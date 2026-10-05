import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseEnv } from 'node:util';

const envPath = resolve(process.cwd(), '.env.test.local');

if (!existsSync(envPath)) {
  throw new Error('Missing .env.test.local. Copy .env.example and use test-only values.');
}

// Not process.loadEnvFile(): inside Jest it fills the real process.env, but the test file
// already runs against its own copy of it. The first file in each worker would then miss
// every variable, so which suite fails would depend on file order.
for (const [name, value] of Object.entries(parseEnv(readFileSync(envPath, 'utf8')))) {
  process.env[name] ??= value;
}
