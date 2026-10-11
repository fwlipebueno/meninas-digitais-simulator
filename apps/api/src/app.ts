import cors from 'cors';
import { eq } from 'drizzle-orm';
import express from 'express';
import { z } from 'zod';
import type { Database } from './db.ts';
import { activity, activityCompletion, trainingSession } from './schema.ts';

const completionSchema = z.object({
  sessionId: z.uuid(),
  activityId: z.string().min(1),
});

const progressQuerySchema = z.object({
  sessionId: z.uuid(),
});

export function createApp(db: Database) {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.post('/completions', async (req, res) => {
    const parsed = completionSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'sessionId deve ser UUID e activityId não pode ser vazio.',
      });
    }

    const { sessionId, activityId } = parsed.data;

    try {
      const knownActivity = await db
        .select({ id: activity.id })
        .from(activity)
        .where(eq(activity.id, activityId))
        .limit(1);

      if (knownActivity.length === 0) {
        return res
          .status(400)
          .json({ error: `Atividade inexistente: ${activityId}.` });
      }

      await db
        .insert(trainingSession)
        .values({ id: sessionId })
        .onConflictDoNothing();
      await db
        .insert(activityCompletion)
        .values({ sessionId, activityId })
        .onConflictDoNothing();

      return res.status(200).json({ ok: true });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Erro interno no servidor.' });
    }
  });

  app.get('/progress', async (req, res) => {
    const parsed = progressQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      return res.status(400).json({ error: 'sessionId deve ser UUID.' });
    }

    try {
      const rows = await db
        .select({ activityId: activityCompletion.activityId })
        .from(activityCompletion)
        .where(eq(activityCompletion.sessionId, parsed.data.sessionId));

      return res
        .status(200)
        .json({ completedActivityIds: rows.map((row) => row.activityId) });
    } catch (err) {
      console.error(err);
      return res.status(500).json({ error: 'Erro interno no servidor.' });
    }
  });

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  return app;
}
