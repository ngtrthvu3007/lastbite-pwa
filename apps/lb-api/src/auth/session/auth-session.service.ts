import { Inject, Injectable } from '@nestjs/common';
import { and, eq, gt, isNull, lte } from 'drizzle-orm';
import { DB, Database } from '../../db/database.module';
import { authSessions, users } from '../../db/schema';
import type { ActiveSession, CreatedSession } from '../../common';
import { createRandomToken, toSha256 } from '../auth.crypto';

const MS_PER_DAY = 24 * 60 * 60 * 1000;
// Keep in sync with the auth_sessions max-lifetime check constraint in db/schema.ts.
const SESSION_TTL_DAYS = 7;
const SESSION_TTL_MS = SESSION_TTL_DAYS * MS_PER_DAY;
// The old session lives on briefly: parallel requests and a lost Set-Cookie still need it.
const SESSION_GRACE_MS = 2 * 60 * 1000;

@Injectable()
export class AuthSessionService {
  constructor(@Inject(DB) private readonly db: Database) {}

  private async insertSession(
    db: Pick<Database, 'insert'>,
    userId: string,
  ): Promise<CreatedSession> {
    // Only the caller receives the raw session token. Persistence uses its digest
    // so a database leak cannot directly replay the cookie.
    const token = createRandomToken();
    const tokenHash = toSha256(token);
    // Both times come from one Date: the DB default now() is the transaction start, so an
    // expiry computed here later would break the 7-day check constraint.
    const createdAt = new Date();
    const expiresAt = new Date(createdAt.getTime() + SESSION_TTL_MS);

    await db.insert(authSessions).values({ userId, tokenHash, createdAt, expiresAt });

    return { token, expiresAt };
  }

  async createSessionService(userId: string): Promise<CreatedSession> {
    return this.insertSession(this.db, userId);
  }

  // The caller decides when a session is close enough to expiry to rotate (see AuthGuard).
  // Returns the new session when this request won the swap, otherwise null.
  // The conditional UPDATE is the lock: once the old expiry is pulled to the grace end,
  // `expires_at > graceEnd` no longer holds, so parallel requests fall through.
  async rotateSessionService(token: string): Promise<CreatedSession | null> {
    const tokenHash = toSha256(token);
    const now = Date.now();
    const graceEnd = new Date(now + SESSION_GRACE_MS);

    return this.db.transaction(async (tx) => {
      const [old] = await tx
        .update(authSessions)
        .set({ expiresAt: graceEnd })
        .where(
          and(
            eq(authSessions.tokenHash, tokenHash),
            isNull(authSessions.revokedAt),
            gt(authSessions.expiresAt, graceEnd),
          ),
        )
        .returning({ userId: authSessions.userId });

      return old ? this.insertSession(tx, old.userId) : null;
    });
  }

  async getActiveSessionService(token: string): Promise<ActiveSession | null> {
    const tokenHash = toSha256(token);

    const [session] = await this.db
      .select({
        user: {
          id: users.id,
          email: users.email,
          displayName: users.displayName,
          avatarUrl: users.avatarUrl,
        },
        expiresAt: authSessions.expiresAt,
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

    return session ?? null;
  }

  // Logout also ends the session a rotation left in its grace period. The table does not link the
  // old and new session, so "in grace" means: same user, not revoked, dying within the grace window.
  // Another device's session with more than the grace left is not touched.
  async revokeSessionService(token: string): Promise<void> {
    const tokenHash = toSha256(token);
    const now = new Date();
    const graceEnd = new Date(now.getTime() + SESSION_GRACE_MS);

    await this.db.transaction(async (tx) => {
      const [revoked] = await tx
        .update(authSessions)
        .set({ revokedAt: now })
        .where(and(eq(authSessions.tokenHash, tokenHash), isNull(authSessions.revokedAt)))
        .returning({ userId: authSessions.userId });

      if (!revoked) return;

      await tx
        .update(authSessions)
        .set({ revokedAt: now })
        .where(
          and(
            eq(authSessions.userId, revoked.userId),
            isNull(authSessions.revokedAt),
            lte(authSessions.expiresAt, graceEnd),
          ),
        );
    });
  }
}
