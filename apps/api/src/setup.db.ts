// Arquivo: apps/api/src/setup-db.ts
import { pool } from './db.js';

const initDb = async () => {
  console.log('Iniciando verificação e criação de tabelas...');
  
  const query = `
    CREATE TABLE IF NOT EXISTS training_session (
        id SERIAL PRIMARY KEY,
        started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS activity (
        id VARCHAR(50) PRIMARY KEY,
        module VARCHAR(50) NOT NULL,
        name VARCHAR(100) NOT NULL
    );

    CREATE TABLE IF NOT EXISTS activity_completion (
        session_id INTEGER REFERENCES training_session(id) ON DELETE CASCADE,
        activity_id VARCHAR(50) REFERENCES activity(id) ON DELETE CASCADE,
        completed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (session_id, activity_id)
    );

    INSERT INTO activity (id, module, name) VALUES
    ('abrir-programa', 'Programas', 'Abrir programa'),
    ('fechar-programa', 'Programas', 'Fechar programa'),
    ('alternar-programas', 'Programas', 'Alternar programas')
    ON CONFLICT (id) DO NOTHING;
  `;

  try {
    await pool.query(query);
    console.log('✅ Todas as tabelas e o dicionário de dados foram criados com sucesso!');
  } catch (error) {
    console.error('❌ Ocorreu um erro ao estruturar o banco:', error);
  } finally {
    pool.end();
  }
};

initDb();