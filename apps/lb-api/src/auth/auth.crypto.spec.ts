import {
  createSessionToken,
  decryptRefreshToken,
  encryptRefreshToken,
  getRefreshTokenKey,
  hashSessionToken,
} from './auth.crypto';

describe('auth crypto', () => {
  const key = Buffer.alloc(32, 7);

  it('creates an opaque token and a SHA-256 hex digest', () => {
    const token = createSessionToken();

    expect(token).not.toHaveLength(0);
    expect(hashSessionToken(token)).toMatch(/^[a-f0-9]{64}$/);
  });

  it('encrypts and decrypts a Cognito refresh token', () => {
    const token = 'cognito-refresh-token';
    const encrypted = encryptRefreshToken(token, key);

    expect(encrypted).not.toContain(token);
    expect(decryptRefreshToken(encrypted, key)).toBe(token);
  });

  it('requires a base64-encoded 32-byte key', () => {
    expect(() => getRefreshTokenKey({ AUTH_REFRESH_TOKEN_KEY: 'bad' })).toThrow(
      'AUTH_REFRESH_TOKEN_KEY must decode to exactly 32 bytes',
    );
  });
});
