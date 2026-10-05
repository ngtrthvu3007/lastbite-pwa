import { Inject, Injectable } from '@nestjs/common';
import { and, eq, gt, isNull } from 'drizzle-orm';
import { DB, Database } from '../../db/database.module';
import { authSessions, users } from '../../db/schema';
import { CurrentUserDto } from '../../common';
import { encryptRefreshToken, randomToken, sha256 } from '../auth.crypto';
import { AUTH_CONFIG, AuthConfig } from '../auth.config';

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export interface CreatedSession {
  token: string;
  expiresAt: Date;
}

@Injectable()
export class AuthSessionService {
  constructor(
    @Inject(DB) private readonly db: Database,
    @Inject(AUTH_CONFIG)
    private readonly config: AuthConfig,
  ) {}

  async createSessionService(userId: string, cognitoRefreshToken: string): Promise<CreatedSession> {
    // Only the caller receives the raw session token. Persistence uses its digest
    // so a database leak cannot directly replay the cookie.
    const token = randomToken();
    const tokenHash = sha256(token);
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
    const encryptedRefreshToken = encryptRefreshToken(
      cognitoRefreshToken,
      this.config.refreshTokenKey,
    );

    await this.db.insert(authSessions).values({
      userId,
      tokenHash,
      cognitoRefreshTokenEncrypted: encryptedRefreshToken,
      expiresAt,
    });

    return { token, expiresAt };
  }

  async getCurrentUserService(token: string): Promise<CurrentUserDto | null> {
    const tokenHash = sha256(token);

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
          eq(authSessions.tokenHash, tokenHash),
          isNull(authSessions.revokedAt),
          gt(authSessions.expiresAt, new Date()),
        ),
      )
      .limit(1);

    return user ?? null;
  }

  async revokeSessionService(token: string): Promise<void> {
    const tokenHash = sha256(token);
    await this.db
      .update(authSessions)
      .set({ revokedAt: new Date() })
      .where(and(eq(authSessions.tokenHash, tokenHash), isNull(authSessions.revokedAt)));
  }
}
