import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';

export function connectDatabase(connectionString: string) {
  const pool = new pg.Pool({ connectionString, connectionTimeoutMillis: 5000 });
  return { db: drizzle(pool), pool };
}
