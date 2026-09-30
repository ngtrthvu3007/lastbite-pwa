import { Inject, Injectable, Logger } from '@nestjs/common';
import { and, eq, gt, isNull } from 'drizzle-orm';
import { DB, Database } from '../db/database.module';
import { authSessions, users } from '../db/schema';
import { RedisService } from '../redis/redis.module';
import { CurrentUserDto } from './dto/current-user.dto';
import {
  createSessionToken,
  encryptRefreshToken,
  getRefreshTokenKey,
  hashSessionToken,
} from './auth.crypto';

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export interface CreatedSession {
  token: string;
  expiresAt: Date;
}

interface CachedSession {
  id: string;
  userId: string;
  expiresAt: string;
}

@Injectable()
export class AuthSessionService {
  private readonly logger = new Logger(AuthSessionService.name);

  constructor(
    @Inject(DB) private readonly db: Database,
    private readonly redis: RedisService,
  ) {}

  async createSession(userId: string, cognitoRefreshToken: string): Promise<CreatedSession> {
    // Only the caller receives the raw session token. Persistence and cache use
    // its digest so a database or Redis leak cannot directly replay the cookie.
    const token = createSessionToken();
    const tokenHash = hashSessionToken(token);
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
    const encryptedRefreshToken = encryptRefreshToken(cognitoRefreshToken, getRefreshTokenKey());

    const [session] = await this.db
      .insert(authSessions)
      .values({
        userId,
        tokenHash,
        cognitoRefreshTokenEncrypted: encryptedRefreshToken,
        expiresAt,
      })
      .returning({ id: authSessions.id });

    const ttlSeconds = Math.max(1, Math.floor((expiresAt.getTime() - Date.now()) / 1000));

    try {
      // Redis is an expiring lookup cache. The committed Postgres row remains
      // authoritative when Redis is unavailable.
      await this.writeCachedSession(tokenHash, { id: session.id, userId, expiresAt }, ttlSeconds);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.warn(`Failed to cache auth session: ${message}`);
    }

    return { token, expiresAt };
  }

  async getCurrentUser(token: string | undefined): Promise<CurrentUserDto | null> {
    if (!token) return null;

    const tokenHash = hashSessionToken(token);
    const cachedSession = await this.readCachedSession(tokenHash);

    if (cachedSession) {
      // Redis is only a cache. Re-check durable revocation/expiry state before
      // authenticating so a stale cache entry can never revive a revoked session.
      return this.findCurrentUserBySessionId(cachedSession.id);
    }

    const [session] = await this.db
      .select({
        id: authSessions.id,
        userId: authSessions.userId,
        expiresAt: authSessions.expiresAt,
        user: {
          id: users.id,
          email: users.email,
          displayName: users.displayName,
          avatarUrl: users.avatarUrl,
        },
      })
      .from(authSessions)
      .innerJoin(users, eq(authSessions.userId, users.id))
      .where(
        and(
          eq(authSessions.tokenHash, tokenHash),
          isNull(authSessions.revokedAt),
          gt(authSessions.expiresAt, new Date()),
        ),
      )
      .limit(1);

    if (!session) return null;

    const ttlSeconds = Math.max(1, Math.floor((session.expiresAt.getTime() - Date.now()) / 1000));

    try {
      await this.writeCachedSession(tokenHash, session, ttlSeconds);
    } catch (error: unknown) {
      this.logCacheFailure('cache auth session', error);
    }

    return CurrentUserDto.from(session.user);
  }

  async revokeSession(token: string | undefined): Promise<void> {
    if (!token) return;

    const tokenHash = hashSessionToken(token);
    await this.db
      .update(authSessions)
      .set({ revokedAt: new Date() })
      .where(and(eq(authSessions.tokenHash, tokenHash), isNull(authSessions.revokedAt)));

    try {
      await this.redis.del(this.cacheKey(tokenHash));
    } catch (error: unknown) {
      // Postgres remains authoritative. A later cache read falls back to it if Redis is down.
      this.logCacheFailure('remove auth session from cache', error);
    }
  }

  private async findCurrentUserBySessionId(sessionId: string): Promise<CurrentUserDto | null> {
    const [user] = await this.db
      .select({
        id: users.id,
        email: users.email,
        displayName: users.displayName,
        avatarUrl: users.avatarUrl,
      })
      .from(authSessions)
      .innerJoin(users, eq(authSessions.userId, users.id))
      .where(
        and(
          eq(authSessions.id, sessionId),
          isNull(authSessions.revokedAt),
          gt(authSessions.expiresAt, new Date()),
        ),
      )
      .limit(1);

    return user ? CurrentUserDto.from(user) : null;
  }

  private async readCachedSession(tokenHash: string): Promise<CachedSession | null> {
    try {
      const value = await this.redis.get(this.cacheKey(tokenHash));
      if (!value) return null;

      const session = JSON.parse(value) as Partial<CachedSession>;
      if (
        typeof session.id !== 'string' ||
        typeof session.userId !== 'string' ||
        typeof session.expiresAt !== 'string' ||
        Number.isNaN(new Date(session.expiresAt).getTime()) ||
        new Date(session.expiresAt) <= new Date()
      ) {
        return null;
      }

      return session as CachedSession;
    } catch (error: unknown) {
      this.logCacheFailure('read auth session cache', error);
      return null;
    }
  }

  private async writeCachedSession(
    tokenHash: string,
    session: { id: string; userId: string; expiresAt: Date },
    ttlSeconds: number,
  ): Promise<void> {
    await this.redis.set(
      this.cacheKey(tokenHash),
      JSON.stringify({
        id: session.id,
        userId: session.userId,
        expiresAt: session.expiresAt.toISOString(),
      }),
      ttlSeconds,
    );
  }

  private cacheKey(tokenHash: string): string {
    return `auth:session:${tokenHash}`;
  }

  private logCacheFailure(action: string, error: unknown): void {
    const message = error instanceof Error ? error.message : 'Unknown error';
    this.logger.warn(`Failed to ${action}: ${message}`);
  }
}
