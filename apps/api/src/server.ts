import { sql } from 'drizzle-orm';
import { createApp } from './app.ts';
import { connectDatabase } from './db.ts';
import { readEnv } from './env.ts';

const env = readEnv(process.env);
const { db, pool } = connectDatabase(env.DATABASE_URL);

try {
  await db.execute(sql`select 1`);
} catch {
  console.error(
    'Não foi possível conectar ao PostgreSQL. Confira DATABASE_URL e inicie o banco.',
  );
  await pool.end();
  process.exit(1);
}

const server = createApp(pool).listen(env.PORT, () => {
  console.log(`API disponível na porta ${env.PORT}.`);
});

function shutdown(exitCode: number) {
  const timeout = setTimeout(() => process.exit(1), 5000);
  timeout.unref();
  server.close(() => {
    void pool.end().finally(() => process.exit(exitCode));
  });
}

server.on('error', () => {
  console.error(
    'Não foi possível iniciar a API. Confira se a porta está disponível.',
  );
  shutdown(1);
});
pool.on('error', () => {
  console.error(
    'A conexão com o PostgreSQL foi interrompida. Reinicie a API após recuperar o banco.',
  );
  shutdown(1);
});
process.once('SIGINT', () => shutdown(0));
process.once('SIGTERM', () => shutdown(0));
