// Arquivo: apps/api/src/app.ts
import express from 'express';
import cors from 'cors';
import type { Pool } from 'pg';

export function createApp(pool: Pool) {
  const app = express();

  app.use(cors());
  app.use(express.json());

  // 1. Rota para iniciar uma nova sessão (chame quando o site abrir)
  app.post('/api/sessions', async (_req, res) => {
    try {
      const result = await pool.query(
        'INSERT INTO training_session (started_at) VALUES (CURRENT_TIMESTAMP) RETURNING id, started_at',
      );
      res.status(201).json(result.rows[0]);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Erro ao criar sessão' });
    }
  });

  // 2. Rota para registrar uma atividade concluída (chame no método concluir() do Front)
  app.post('/api/sessions/:id/activities', async (req, res) => {
    const sessionId = req.params.id;
    const { activity_id } = req.body;

    try {
      const result = await pool.query(
        `INSERT INTO activity_completion (session_id, activity_id, completed_at)
       VALUES ($1, $2, CURRENT_TIMESTAMP)
       RETURNING *`,
        [sessionId, activity_id],
      );
      res.status(201).json(result.rows[0]);
    } catch (err: unknown) {
      // Tratamento empático de erros do banco
      const code =
        typeof err === 'object' && err !== null && 'code' in err
          ? err.code
          : undefined;
      if (code === '23503')
        return res
          .status(400)
          .json({ error: 'Sessão ou atividade inexistente.' });
      if (code === '23505')
        return res
          .status(409)
          .json({ error: 'Essa atividade já foi feita nesta sessão.' });

      console.error(err);
      res.status(500).json({ error: 'Erro interno no servidor.' });
    }
  });

  // 3. (Bônus) Rota de Healthcheck para você testar no navegador
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  return app;
}
