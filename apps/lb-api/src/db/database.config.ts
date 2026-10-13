import { getRequiredEnv } from '../common/get-required-env';

type DatabaseEnv = Record<string, string | undefined>;

export function getDatabaseConnectionString(env: DatabaseEnv = process.env): string {
  return getRequiredEnv('DATABASE_URL', env);
}

function isDevelopment(env: DatabaseEnv): boolean {
  return env.APP_ENV === 'development';
}

export function getDatabaseSslConfig(
  env: DatabaseEnv = process.env,
): false | { rejectUnauthorized: boolean } {
  return isDevelopment(env) ? false : { rejectUnauthorized: false };
}
