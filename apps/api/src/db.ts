// Arquivo: apps/api/src/db.ts
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { readEnv } from './env.ts';
import * as schema from './schema.ts';

// Lê e valida as variáveis de ambiente usando a estrutura do projeto
const env = readEnv(process.env);

// O Pool gerencia conexões usando a connection string validada pelo Zod
export const pool = new Pool({
  connectionString: env.DATABASE_URL,
});

export function connectDatabase(connectionString: string) {
  const databasePool = new Pool({
    connectionString,
    connectionTimeoutMillis: 5000,
  });

  return { db: drizzle(databasePool, { schema }), pool: databasePool };
}

export type Database = ReturnType<typeof connectDatabase>['db'];

// FUNÇÃO DE TESTE DE CONEXÃO
export const testConnection = async () => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT version();');
    console.log(
      '✅ SUCESSO! Conexão com o PostgreSQL estabelecida perfeitamente.',
    );
    console.log('📦 Versão do Banco:', result.rows[0].version);
    client.release();
  } catch (err) {
    console.error(
      '❌ ERRO CRÍTICO: Não foi possível conectar ao PostgreSQL.',
      err,
    );
    console.error(
      'Verifique se o Docker está rodando e se a DATABASE_URL no .env está correta.',
    );
  }
};
