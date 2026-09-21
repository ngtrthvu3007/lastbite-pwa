import { Inject, Injectable } from '@nestjs/common';
import { and, eq, sql } from 'drizzle-orm';
import { DB, Database } from '../db/database.module';
import { authIdentities, users } from '../db/schema';

const IDENTITY_PROVIDER = 'cognito';

export interface CognitoProfile {
  cognitoSub: string;
  email: string;
  displayName?: string;
  avatarUrl?: string;
}

@Injectable()
export class CognitoUserService {
  constructor(@Inject(DB) private readonly db: Database) {}

  async syncUser(profile: CognitoProfile): Promise<string> {
    return this.db.transaction(async (tx) => {
      // Serialize first-login callbacks for the same Cognito subject. The lock is
      // transaction-scoped, so Postgres releases it on both commit and rollback.
      await tx.execute(
        sql`select pg_advisory_xact_lock(hashtextextended(${profile.cognitoSub}, 0))`,
      );

      const [identity] = await tx
        .select({ userId: authIdentities.userId })
        .from(authIdentities)
        .where(
          and(
            eq(authIdentities.provider, IDENTITY_PROVIDER),
            eq(authIdentities.providerSubject, profile.cognitoSub),
          ),
        )
        .limit(1);

      if (identity) {
        // Cognito sub is the durable identity; profile fields can change later.
        await tx
          .update(users)
          .set({
            email: profile.email,
            displayName: profile.displayName,
            avatarUrl: profile.avatarUrl,
            updatedAt: new Date(),
          })
          .where(eq(users.id, identity.userId));

        return identity.userId;
      }

      const [user] = await tx
        .insert(users)
        .values({
          email: profile.email,
          displayName: profile.displayName,
          avatarUrl: profile.avatarUrl,
        })
        .returning({ id: users.id });

      // Keep identity mapping separate from the application user so one account
      // can serve both customer and merchant applications.
      await tx.insert(authIdentities).values({
        userId: user.id,
        provider: IDENTITY_PROVIDER,
        providerSubject: profile.cognitoSub,
      });

      return user.id;
    });
  }
}
