import { connectDatabase } from './db.ts';
import { readEnv } from './env.ts';
import { activity } from './schema.ts';

const activities = [
  { id: 'open-program', module: 'programs', name: 'Abrir um programa' },
  { id: 'close-program', module: 'programs', name: 'Fechar um programa' },
  { id: 'switch-program', module: 'programs', name: 'Alternar programas' },
  { id: 'new-file', module: 'files', name: 'Criar um documento' },
  { id: 'save-file', module: 'files', name: 'Salvar um arquivo' },
  { id: 'rename-file', module: 'files', name: 'Renomear um arquivo' },
  { id: 'delete-file', module: 'files', name: 'Excluir um arquivo' },
  { id: 'create-account', module: 'mail', name: 'Criar uma conta' },
  { id: 'login-mail', module: 'mail', name: 'Fazer login' },
  { id: 'send-mail', module: 'mail', name: 'Enviar um e-mail' },
  { id: 'docs-interface', module: 'docs', name: 'Conhecer a interface' },
  { id: 'docs-insert-elements', module: 'docs', name: 'Inserir elementos' },
  { id: 'docs-export', module: 'docs', name: 'Exportar um documento' },
  { id: 'docs-tools', module: 'docs', name: 'Usar ferramentas do editor' },
] as const;

const env = readEnv(process.env);
const { db, pool } = connectDatabase(env.DATABASE_URL);

try {
  const inserted = await db
    .insert(activity)
    .values([...activities])
    .onConflictDoNothing()
    .returning({ id: activity.id });

  console.log(
    `✅ Seed concluído: ${inserted.length} atividade(s) inserida(s), ` +
      `${activities.length - inserted.length} já existiam.`,
  );
} catch (err) {
  console.error('❌ Erro ao semear atividades:', err);
  process.exitCode = 1;
} finally {
  await pool.end();
}
