import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const envPath = resolve(process.cwd(), '.env.test.local');

if (!existsSync(envPath)) {
  throw new Error('Missing .env.test.local. Copy .env.example and use test-only values.');
}

process.loadEnvFile(envPath);
