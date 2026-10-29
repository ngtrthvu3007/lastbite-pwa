import { createHash, randomBytes } from 'node:crypto';
import { Pool } from 'pg';
import { env } from './env';

const MS_PER_DAY = 24 * 60 * 60 * 1000;

let pool: Pool | undefined;
const getPool = () => (pool ??= new Pool({ connectionString: env.databaseUrl }));

const hashToken = (token: string) => createHash('sha256').update(token).digest('hex');

export interface SeededSession {
  userId: string;
  email: string;
  token: string;
}

export interface SessionRow {
  id: string;
  created_at: Date;
  expires_at: Date;
  revoked_at: Date | null;
}

// Inserts a user with one session that expires in `expiresInMs` (at most 7 days; a negative value
// gives an already expired session). created_at is set exactly 7 days before the expiry, so the
// table's 7-day CHECK always holds, even for a nearly expired session.
export async function seedSession(expiresInMs: number): Promise<SeededSession> {
  const token = randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + expiresInMs);
  const createdAt = new Date(expiresAt.getTime() - 7 * MS_PER_DAY);

  const email = `it-${randomBytes(6).toString('hex')}@example.test`;

  const { rows } = await getPool().query<{ id: string }>(
    'insert into users (email, display_name) values ($1, $2) returning id',
    [email, 'IT user'],
  );
  const userId = rows[0].id;

  await getPool().query(
    'insert into auth_sessions (user_id, token_hash, created_at, expires_at) values ($1, $2, $3, $4)',
    [userId, hashToken(token), createdAt, expiresAt],
  );

  return { userId, email, token };
}

export async function listSessions(userId: string): Promise<SessionRow[]> {
  const { rows } = await getPool().query<SessionRow>(
    'select id, created_at, expires_at, revoked_at from auth_sessions where user_id = $1 order by created_at',
    [userId],
  );

  return rows;
}

export async function getSession(token: string): Promise<SessionRow | undefined> {
  const { rows } = await getPool().query<SessionRow>(
    'select id, created_at, expires_at, revoked_at from auth_sessions where token_hash = $1',
    [hashToken(token)],
  );

  return rows[0];
}

export async function revokeSession(token: string) {
  await getPool().query('update auth_sessions set revoked_at = now() where token_hash = $1', [
    hashToken(token),
  ]);
}

// Moves a session into the past, as if its grace period had ended.
export async function expireSession(token: string) {
  await getPool().query(
    "update auth_sessions set created_at = now() - interval '1 day', expires_at = now() - interval '1 minute' where token_hash = $1",
    [hashToken(token)],
  );
}

// Sessions go with the user (ON DELETE CASCADE).
export async function deleteUser(userId: string) {
  await getPool().query('delete from users where id = $1', [userId]);
}

export async function closeDb() {
  await pool?.end();
  pool = undefined;
}
