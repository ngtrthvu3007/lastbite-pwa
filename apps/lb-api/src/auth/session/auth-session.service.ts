import { Inject, Injectable } from '@nestjs/common';
import { and, eq, gt, isNull } from 'drizzle-orm';
import { DB, Database } from '../../db/database.module';
import { authSessions, users } from '../../db/schema';
import { CurrentUserDto } from '../../common';
import { createRandomToken, toSha256 } from '../auth.crypto';

const MS_PER_DAY = 24 * 60 * 60 * 1000;
// Keep in sync with the auth_sessions max-lifetime check constraint in db/schema.ts.
const SESSION_TTL_DAYS = 7;
const SESSION_TTL_MS = SESSION_TTL_DAYS * MS_PER_DAY;

export interface CreatedSession {
  token: string;
  expiresAt: Date;
}

@Injectable()
export class AuthSessionService {
  constructor(@Inject(DB) private readonly db: Database) {}

  async createSessionService(userId: string): Promise<CreatedSession> {
    // Only the caller receives the raw session token. Persistence uses its digest
    // so a database leak cannot directly replay the cookie.
    const token = createRandomToken();
    const tokenHash = toSha256(token);
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

    await this.db.insert(authSessions).values({ userId, tokenHash, expiresAt });

    return { token, expiresAt };
  }

  async getCurrentUserService(token: string): Promise<CurrentUserDto | null> {
    const tokenHash = toSha256(token);

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
    const tokenHash = toSha256(token);
    await this.db
      .update(authSessions)
      .set({ revokedAt: new Date() })
      .where(and(eq(authSessions.tokenHash, tokenHash), isNull(authSessions.revokedAt)));
  }
}
