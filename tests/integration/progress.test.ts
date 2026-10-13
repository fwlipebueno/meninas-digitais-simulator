import { execFile } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { once } from 'node:events';
import type { Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { Pool } from 'pg';
import { expect, test } from 'vitest';
import { createApp } from '../../apps/api/src/app.ts';
import { connectDatabase } from '../../apps/api/src/db.ts';

test('PostgreSQL: migration, seed e conclusões idempotentes isoladas por sessão', async () => {
  const databaseUrl = process.env.TEST_DATABASE_URL;
  if (!databaseUrl)
    throw new Error(
      'Defina TEST_DATABASE_URL para um PostgreSQL de teste com permissão CREATE DATABASE.',
    );
  const isolatedUrl = new URL(databaseUrl);
  if (!decodeURIComponent(isolatedUrl.pathname).endsWith('_test'))
    throw new Error(
      'TEST_DATABASE_URL deve apontar para um banco cujo nome termina em _test.',
    );
  const admin = new Pool({
    connectionString: databaseUrl,
    connectionTimeoutMillis: 5000,
  });
  const databaseName = `progress_test_${randomUUID().replaceAll('-', '')}`;
  isolatedUrl.pathname = `/${databaseName}`;
  let created = false;
  let pool: Pool | undefined;
  let server: Server | undefined;
  try {
    await admin.query(`CREATE DATABASE "${databaseName}"`);
    created = true;
    const run = promisify(execFile);
    for (const script of ['migrate', 'migrate', 'seed', 'seed']) {
      await run(
        process.execPath,
        [
          fileURLToPath(
            new URL(`../../apps/api/dist/${script}.js`, import.meta.url),
          ),
        ],
        {
          cwd: tmpdir(),
          env: { ...process.env, DATABASE_URL: isolatedUrl.href },
        },
      );
    }
    const connection = connectDatabase(isolatedUrl.href);
    pool = connection.pool;
    expect(
      (await pool.query('SELECT count(*)::int AS count FROM activity')).rows[0]
        .count,
    ).toBe(14);
    expect(
      (
        await pool.query(
          'SELECT count(*)::int AS count FROM drizzle.__drizzle_migrations',
        )
      ).rows[0].count,
    ).toBe(1);
    server = createApp(connection.db).listen(0, '127.0.0.1');
    await once(server, 'listening');
    const { port } = server.address() as AddressInfo;
    const baseUrl = `http://127.0.0.1:${port}`;
    const first = randomUUID();
    const second = randomUUID();
    async function progress(sessionId: string) {
      const response = await fetch(
        `${baseUrl}/progress?sessionId=${sessionId}`,
      );
      expect(response.status).toBe(200);
      return response.json() as Promise<{ completedActivityIds: string[] }>;
    }
    async function complete(sessionId: string, activityId: string) {
      const response = await fetch(`${baseUrl}/completions`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ sessionId, activityId }),
      });
      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ ok: true });
    }
    expect(await progress(first)).toEqual({ completedActivityIds: [] });
    expect(await progress(second)).toEqual({ completedActivityIds: [] });
    await complete(first, 'open-program');
    const initialCompletion = (
      await pool.query(
        'SELECT completed_at FROM activity_completion WHERE session_id = $1',
        [first],
      )
    ).rows[0].completed_at;
    await Promise.all([
      complete(first, 'open-program'),
      complete(first, 'open-program'),
    ]);
    await complete(second, 'new-file');
    expect(await progress(first)).toEqual({
      completedActivityIds: ['open-program'],
    });
    expect(await progress(second)).toEqual({
      completedActivityIds: ['new-file'],
    });
    expect(
      (
        await pool.query(
          'SELECT completed_at FROM activity_completion WHERE session_id = $1',
          [first],
        )
      ).rows[0].completed_at,
    ).toEqual(initialCompletion);
    await complete(first, 'close-program');
    expect((await progress(first)).completedActivityIds.sort()).toEqual([
      'close-program',
      'open-program',
    ]);
    expect(await progress(second)).toEqual({
      completedActivityIds: ['new-file'],
    });
    const unknown = await fetch(`${baseUrl}/completions`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        sessionId: first,
        activityId: 'unknown-activity',
      }),
    });
    expect(unknown.status).toBe(400);
    expect(
      (await pool.query('SELECT count(*)::int AS count FROM training_session'))
        .rows[0].count,
    ).toBe(2);
    expect(
      (
        await pool.query(
          'SELECT count(*)::int AS count FROM activity_completion',
        )
      ).rows[0].count,
    ).toBe(3);
  } finally {
    if (server)
      await new Promise<void>((resolve, reject) =>
        server!.close((error) => (error ? reject(error) : resolve())),
      );
    await pool?.end();
    if (created) await admin.query(`DROP DATABASE "${databaseName}"`);
    await admin.end();
  }
}, 30000);
