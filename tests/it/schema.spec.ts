import { createHash } from 'node:crypto';
import { expect, test } from '@playwright/test';
import { callApi } from '../support/api';
import { SESSION_COOKIE } from '../support/cookies';
import { closeDb, deleteUser, queryDb, seedSession } from '../support/db';

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const UNIQUE_VIOLATION = '23505';
const CHECK_VIOLATION = '23514';

const createdUsers: string[] = [];

async function createUser() {
  const { rows } = await queryDb('insert into users (email) values ($1) returning id', [
    `it-${Math.random().toString(36).slice(2)}@example.test`,
  ]);
  createdUsers.push(rows[0].id);

  return rows[0].id as string;
}

// The SQLSTATE of the failure, or 'ok' when the statement went through.
const outcomeOf = (text: string, params: unknown[]) =>
  queryDb(text, params).then(
    () => 'ok',
    (error: { code?: string }) => error.code,
  );

const insertSession = (userId: string, tokenHash: string, createdAt: Date, expiresAt: Date) =>
  outcomeOf(
    'insert into auth_sessions (user_id, token_hash, created_at, expires_at) values ($1, $2, $3, $4)',
    [userId, tokenHash, createdAt, expiresAt],
  );

test.afterEach(async () => {
  await Promise.all(createdUsers.splice(0).map(deleteUser));
});

test.afterAll(closeDb);

// LB-83 acceptance criteria, checked against the real database.
test.describe('auth schema', () => {
  test('[LB-83] auth_identities(provider, provider_subject) is unique', async () => {
    const [first, second] = [await createUser(), await createUser()];
    const insert = 'insert into auth_identities (user_id, provider, provider_subject) values ($1, $2, $3)';

    expect(await outcomeOf(insert, [first, 'cognito', 'sub-1'])).toBe('ok');
    expect(await outcomeOf(insert, [second, 'cognito', 'sub-1'])).toBe(UNIQUE_VIOLATION);
    // The same subject under another provider is a different identity.
    expect(await outcomeOf(insert, [second, 'other', 'sub-1'])).toBe('ok');
  });

  test('[LB-83] auth_sessions(token_hash) is unique', async () => {
    const userId = await createUser();
    const now = new Date();
    const later = new Date(now.getTime() + MS_PER_DAY);

    expect(await insertSession(userId, 'a'.repeat(64), now, later)).toBe('ok');
    expect(await insertSession(userId, 'a'.repeat(64), now, later)).toBe(UNIQUE_VIOLATION);
  });

  test('[LB-83] users.email is unique', async () => {
    const userId = await createUser();
    const { rows } = await queryDb('select email from users where id = $1', [userId]);

    expect(await outcomeOf('insert into users (email) values ($1)', [rows[0].email])).toBe(
      UNIQUE_VIOLATION,
    );
  });

  test('[LB-83] the database refuses a session longer than 7 days', async () => {
    const userId = await createUser();
    const createdAt = new Date();
    const at = (ms: number) => new Date(createdAt.getTime() + ms);

    expect(await insertSession(userId, 'b'.repeat(64), createdAt, at(7 * MS_PER_DAY))).toBe('ok');
    expect(await insertSession(userId, 'c'.repeat(64), createdAt, at(7 * MS_PER_DAY + 1000))).toBe(
      CHECK_VIOLATION,
    );
  });

  test('[LB-83] the database refuses a session that expires at or before its creation', async () => {
    const userId = await createUser();
    const createdAt = new Date();

    expect(await insertSession(userId, 'd'.repeat(64), createdAt, createdAt)).toBe(CHECK_VIOLATION);
    expect(await insertSession(userId, 'e'.repeat(64), createdAt, new Date(createdAt.getTime() - 1000))).toBe(
      CHECK_VIOLATION,
    );
  });

  test('[LB-83] deleting a user deletes the identities and sessions that belong to it', async () => {
    const userId = await createUser();
    const now = new Date();

    await queryDb('insert into auth_identities (user_id, provider, provider_subject) values ($1, $2, $3)', [
      userId,
      'cognito',
      'sub-cascade',
    ]);
    await insertSession(userId, 'f'.repeat(64), now, new Date(now.getTime() + MS_PER_DAY));
    await deleteUser(userId);

    const identities = await queryDb('select 1 from auth_identities where user_id = $1', [userId]);
    const sessions = await queryDb('select 1 from auth_sessions where user_id = $1', [userId]);

    expect([identities.rowCount, sessions.rowCount]).toEqual([0, 0]);
  });

  test('[LB-84] auth_sessions keeps no raw token and no Cognito refresh token column', async () => {
    const { rows } = await queryDb(
      "select column_name from information_schema.columns where table_name = 'auth_sessions' order by column_name",
    );
    const columns = rows.map((row) => row.column_name);

    expect(columns).toEqual(['created_at', 'expires_at', 'id', 'revoked_at', 'token_hash', 'user_id']);
  });

  test('[LB-84][LB-85] a session the API creates is stored only as the SHA-256 of its cookie token', async ({
    playwright,
  }) => {
    // Rotation is the one place a test can make the API create a session without a Google login.
    const { userId, token } = await seedSession(60 * 60 * 1000);
    createdUsers.push(userId);

    const rotation = await callApi(playwright, 'GET', '/auth/me', token);
    const newToken = rotation.cookies[SESSION_COOKIE].value;
    const expectedHash = createHash('sha256').update(newToken).digest('hex');

    const asPlain = await queryDb('select 1 from auth_sessions where token_hash = $1', [newToken]);
    const asHash = await queryDb('select token_hash from auth_sessions where token_hash = $1', [expectedHash]);

    expect(asPlain.rowCount).toBe(0);
    expect(asHash.rows[0].token_hash).toMatch(/^[0-9a-f]{64}$/);
  });
});
