import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { fileURLToPath } from 'node:url';
import { connectDatabase } from './db.ts';
import { readEnv } from './env.ts';

const env = readEnv(process.env);
const { db, pool } = connectDatabase(env.DATABASE_URL);

try {
  await migrate(db, {
    migrationsFolder: fileURLToPath(new URL('../drizzle/', import.meta.url)),
  });
  console.log('✅ Migrations aplicadas com sucesso.');
} catch (err) {
  console.error('❌ Erro ao aplicar migrations:', err);
  process.exitCode = 1;
} finally {
  await pool.end();
}
