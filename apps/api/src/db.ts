import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.ts';

export function connectDatabase(connectionString: string) {
  const databasePool = new Pool({
    connectionString,
    connectionTimeoutMillis: 5000,
  });

  return { db: drizzle(databasePool, { schema }), pool: databasePool };
}

export type Database = ReturnType<typeof connectDatabase>['db'];
