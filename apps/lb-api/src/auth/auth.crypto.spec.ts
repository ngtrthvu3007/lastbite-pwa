import { createRandomToken, toSha256 } from './auth.crypto';

describe('auth crypto', () => {
  it('creates a random opaque token and SHA-256 hex digest', () => {
    const token = createRandomToken();

    expect(token).not.toHaveLength(0);
    expect(toSha256(token)).toMatch(/^[a-f0-9]{64}$/);
  });
});
