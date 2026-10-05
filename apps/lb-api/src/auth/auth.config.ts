import { decodeRefreshTokenKey } from './auth.crypto';

export const AUTH_CONFIG = Symbol('AUTH_CONFIG');

export function createAuthConfig() {
  return {
    apps: {
      customer: requiredEnv('CUSTOMER_APP_URL'),
      merchant: requiredEnv('MERCHANT_APP_URL'),
    },
    cognito: {
      clientId: requiredEnv('COGNITO_CLIENT_ID'),
      clientSecret: requiredEnv('COGNITO_CLIENT_SECRET'),
      domain: requiredEnv('COGNITO_DOMAIN'),
      redirectUri: requiredEnv('COGNITO_REDIRECT_URI'),
      userPoolId: requiredEnv('COGNITO_USER_POOL_ID'),
    },
    refreshTokenKey: decodeRefreshTokenKey(requiredEnv('AUTH_REFRESH_TOKEN_KEY')),
  };
}

export type AuthConfig = ReturnType<typeof createAuthConfig>;

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is required`);

  return value;
}
