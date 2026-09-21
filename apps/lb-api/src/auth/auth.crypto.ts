import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const ENCRYPTION_VERSION = 'v1';

export function createSessionToken(): string {
  return randomBytes(32).toString('base64url');
}

export function hashSessionToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function getRefreshTokenKey(
  env: Record<string, string | undefined> = process.env,
): Buffer {
  const encodedKey = env.AUTH_REFRESH_TOKEN_KEY;

  if (!encodedKey) {
    throw new Error(
      'Missing required environment variable: AUTH_REFRESH_TOKEN_KEY',
    );
  }

  const key = Buffer.from(encodedKey, 'base64');

  if (key.length !== 32) {
    throw new Error('AUTH_REFRESH_TOKEN_KEY must decode to exactly 32 bytes');
  }

  return key;
}

export function encryptRefreshToken(token: string, key: Buffer): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(token, 'utf8'),
    cipher.final(),
  ]);

  // Versioned envelope: version.iv.authentication-tag.ciphertext.
  return [
    ENCRYPTION_VERSION,
    iv.toString('base64url'),
    cipher.getAuthTag().toString('base64url'),
    encrypted.toString('base64url'),
  ].join('.');
}

export function decryptRefreshToken(payload: string, key: Buffer): string {
  const [version, iv, authTag, encrypted] = payload.split('.');

  if (version !== ENCRYPTION_VERSION || !iv || !authTag || !encrypted) {
    throw new Error('Invalid encrypted refresh token');
  }

  const decipher = createDecipheriv(
    ALGORITHM,
    key,
    Buffer.from(iv, 'base64url'),
  );
  decipher.setAuthTag(Buffer.from(authTag, 'base64url'));

  return Buffer.concat([
    decipher.update(Buffer.from(encrypted, 'base64url')),
    decipher.final(),
  ]).toString('utf8');
}
