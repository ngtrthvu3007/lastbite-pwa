import { randomToken, decodeRefreshTokenKey, encryptRefreshToken, sha256 } from './auth.crypto';

describe('auth crypto', () => {
  const key = Buffer.alloc(32, 7);

  it('creates a random opaque token and SHA-256 hex digest', () => {
    const token = randomToken();

    expect(token).not.toHaveLength(0);
    expect(sha256(token)).toMatch(/^[a-f0-9]{64}$/);
  });

  it('encrypts a Cognito refresh token without exposing it', () => {
    const token = 'cognito-refresh-token';
    const encrypted = encryptRefreshToken(token, key);

    expect(encrypted).not.toContain(token);
    expect(encrypted.split('.')).toHaveLength(4);
  });

  it('requires a base64-encoded 32-byte key', () => {
    expect(() => decodeRefreshTokenKey('bad')).toThrow(
      'AUTH_REFRESH_TOKEN_KEY must decode to exactly 32 bytes',
    );
  });
});
