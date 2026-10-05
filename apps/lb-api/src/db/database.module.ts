import { Module } from '@nestjs/common';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { getDatabaseConnectionString, getDatabaseSslConfig } from './database.config';
import * as schema from './schema';

export const DB = Symbol('DB');
export type Database = NodePgDatabase<typeof schema>;

@Module({
  providers: [
    {
      provide: DB,
      useFactory: () =>
        drizzle(
          new Pool({
            connectionString: getDatabaseConnectionString(process.env),
            ssl: getDatabaseSslConfig(process.env),
          }),
          { schema },
        ),
    },
  ],
  exports: [DB],
})
export class DatabaseModule {}
