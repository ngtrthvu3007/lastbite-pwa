import { Inject, Injectable, Logger } from '@nestjs/common';
import { DB, Database } from '../db/database.module';
import { authSessions } from '../db/schema';
import { RedisService } from '../redis/redis.module';
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

@Injectable()
export class AuthSessionService {
  private readonly logger = new Logger(AuthSessionService.name);

  constructor(
    @Inject(DB) private readonly db: Database,
    private readonly redis: RedisService,
  ) {}

  async createSession(
    userId: string,
    cognitoRefreshToken: string,
  ): Promise<CreatedSession> {
    // Only the caller receives the raw session token. Persistence and cache use
    // its digest so a database or Redis leak cannot directly replay the cookie.
    const token = createSessionToken();
    const tokenHash = hashSessionToken(token);
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
    const encryptedRefreshToken = encryptRefreshToken(
      cognitoRefreshToken,
      getRefreshTokenKey(),
    );

    const [session] = await this.db
      .insert(authSessions)
      .values({
        userId,
        tokenHash,
        cognitoRefreshTokenEncrypted: encryptedRefreshToken,
        expiresAt,
      })
      .returning({ id: authSessions.id });

    const ttlSeconds = Math.max(
      1,
      Math.floor((expiresAt.getTime() - Date.now()) / 1000),
    );

    try {
      // Redis is an expiring lookup cache. The committed Postgres row remains
      // authoritative when Redis is unavailable.
      await this.redis.set(
        `auth:session:${tokenHash}`,
        JSON.stringify({
          id: session.id,
          userId,
          expiresAt: expiresAt.toISOString(),
        }),
        ttlSeconds,
      );
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.warn(`Failed to cache auth session: ${message}`);
    }

    return { token, expiresAt };
  }
}
