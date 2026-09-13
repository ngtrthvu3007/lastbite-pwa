type DatabaseEnv = Record<string, string | undefined>;

function required(env: DatabaseEnv, name: string): string {
  const value = env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export function getDatabaseConnectionString(
  env: DatabaseEnv = process.env,
): string {
  return required(env, 'DATABASE_URL');
}

function isDevelopment(env: DatabaseEnv): boolean {
  return env.APP_ENV === 'development';
}

export function getDatabaseSslConfig(
  env: DatabaseEnv = process.env,
): false | { rejectUnauthorized: boolean } {
  return isDevelopment(env) ? false : { rejectUnauthorized: false };
}
