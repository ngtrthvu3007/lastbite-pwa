import { getRequiredEnv } from '../common/get-required-env';

export const AUTH_CONFIG = Symbol('AUTH_CONFIG');

export const AUTH_APPS = ['customer', 'merchant'] as const;
export type AuthApp = (typeof AUTH_APPS)[number];

export function createAuthConfig() {
  return {
    apps: {
      customer: getRequiredEnv('CUSTOMER_APP_URL'),
      merchant: getRequiredEnv('MERCHANT_APP_URL'),
    } satisfies Record<AuthApp, string>,
    cognito: {
      clientId: getRequiredEnv('COGNITO_CLIENT_ID'),
      clientSecret: getRequiredEnv('COGNITO_CLIENT_SECRET'),
      domain: getRequiredEnv('COGNITO_DOMAIN'),
      redirectUri: getRequiredEnv('COGNITO_REDIRECT_URI'),
      userPoolId: getRequiredEnv('COGNITO_USER_POOL_ID'),
    },
  };
}

export type AuthConfig = ReturnType<typeof createAuthConfig>;
