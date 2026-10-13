type Env = Record<string, string | undefined>;

export function getRequiredEnv(name: string, env: Env = process.env): string {
  const value = env[name]?.trim();
  if (!value) throw new Error(`Missing required environment variable: ${name}`);

  return value;
}
