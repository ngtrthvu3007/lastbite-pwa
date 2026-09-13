import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';
import { getDatabaseConnectionString } from './src/db/database.config';

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: getDatabaseConnectionString(),
  },
});
