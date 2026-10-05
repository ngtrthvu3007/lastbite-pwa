import { createCipheriv, createHash, randomBytes } from 'node:crypto';

const REFRESH_TOKEN_ENCRYPTION_ALGORITHM = 'aes-256-gcm';
const ENCRYPTION_VERSION = 'v1';

export function randomToken(): string {
  return randomBytes(32).toString('base64url');
}

export function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

export function decodeRefreshTokenKey(encodedKey: string): Buffer {
  const key = Buffer.from(encodedKey, 'base64');

  if (key.length !== 32) {
    throw new Error('AUTH_REFRESH_TOKEN_KEY must decode to exactly 32 bytes');
  }

  return key;
}

export function encryptRefreshToken(token: string, key: Buffer): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv(REFRESH_TOKEN_ENCRYPTION_ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(token, 'utf8'), cipher.final()]);

  // Versioned envelope: version.iv.authentication-tag.ciphertext.
  return [
    ENCRYPTION_VERSION,
    iv.toString('base64url'),
    cipher.getAuthTag().toString('base64url'),
    encrypted.toString('base64url'),
  ].join('.');
}
