export const TEST_AUTH_ENV: NodeJS.ProcessEnv = {
  AUTH_REFRESH_TOKEN_KEY: Buffer.alloc(32, 7).toString('base64'),
  COGNITO_CLIENT_ID: 'test-client-id',
  COGNITO_CLIENT_SECRET: 'test-client-secret',
  COGNITO_DOMAIN: 'https://auth.test',
  COGNITO_REDIRECT_URI: 'http://api.test/auth/callback',
  COGNITO_USER_POOL_ID: 'ap-southeast-1_test',
  CUSTOMER_APP_URL: 'http://customer.test',
  MERCHANT_APP_URL: 'http://merchant.test',
};

export const TEST_REDIS_ENV: NodeJS.ProcessEnv = {
  REDIS_URL: 'redis://redis.test:6379',
};

export const TEST_APP_ENV: NodeJS.ProcessEnv = { APP_ENV: 'test' };

export const TEST_API_ENV: NodeJS.ProcessEnv = {
  ...TEST_APP_ENV,
  ...TEST_AUTH_ENV,
  ...TEST_REDIS_ENV,
  DATABASE_URL: 'postgres://postgres:postgres@database.test:5432/lastbite_test',
};

export function useTestEnvironment(values: NodeJS.ProcessEnv): () => void {
  const previous = process.env;
  process.env = { ...previous, ...values };

  return () => {
    process.env = previous;
  };
}
