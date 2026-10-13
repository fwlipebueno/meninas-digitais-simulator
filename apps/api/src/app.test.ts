import { once } from 'node:events';
import type { AddressInfo } from 'node:net';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { expect, test } from 'vitest';
import { createApp } from './app.ts';
import * as schema from './schema.ts';

async function withServer(
  run: (baseUrl: string) => Promise<void>,
): Promise<void> {
  const pool = new Pool();
  const db = drizzle(pool, { schema });
  const server = createApp(db).listen(0, '127.0.0.1');
  try {
    await once(server, 'listening');
    const { port } = server.address() as AddressInfo;
    await run(`http://127.0.0.1:${port}`);
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
    await pool.end();
  }
}

test('GET /health responde com o estado do processo em JSON', async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/health`);
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toContain('application/json');
    expect(response.headers.has('x-powered-by')).toBe(false);
    expect(await response.json()).toEqual({ status: 'ok' });
  });
});

test('POST /completions rejeita sessionId que não é UUID', async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/completions`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        sessionId: 'nao-e-uuid',
        activityId: 'open-program',
      }),
    });
    expect(response.status).toBe(400);
  });
});

test('GET /progress rejeita sessionId que não é UUID', async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/progress?sessionId=nao-e-uuid`);
    expect(response.status).toBe(400);
  });
});

test('contratos de progresso rejeitam campos adicionais', async () => {
  await withServer(async (baseUrl) => {
    const sessionId = crypto.randomUUID();
    const response = await fetch(`${baseUrl}/completions`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        activityId: 'open-program',
        content: 'Não persistir',
      }),
    });
    expect(response.status).toBe(400);
    expect(
      (await fetch(`${baseUrl}/progress?sessionId=${sessionId}&extra=true`))
        .status,
    ).toBe(400);
  });
});

test('POST /completions limita o corpo a 4kb', async () => {
  await withServer(async (baseUrl) => {
    const response = await fetch(`${baseUrl}/completions`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        sessionId: crypto.randomUUID(),
        activityId: 'a'.repeat(4096),
      }),
    });
    expect(response.status).toBe(413);
  });
});
