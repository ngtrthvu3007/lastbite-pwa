import { getRequiredEnv } from '../common/get-required-env';

export const AUTH_CONFIG = Symbol('AUTH_CONFIG');

export function createAuthConfig() {
  return {
    appUrl: getRequiredEnv('APP_URL'),
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
