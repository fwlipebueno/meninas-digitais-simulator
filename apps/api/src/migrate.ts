import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { connectDatabase } from './db.ts';
import { readEnv } from './env.ts';

const env = readEnv(process.env);
const { db, pool } = connectDatabase(env.DATABASE_URL);

try {
  await migrate(db, { migrationsFolder: './drizzle' });
  console.log('✅ Migrations aplicadas com sucesso.');
} catch (err) {
  console.error('❌ Erro ao aplicar migrations:', err);
  process.exitCode = 1;
} finally {
  await pool.end();
}
