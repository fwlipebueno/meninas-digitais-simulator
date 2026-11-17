import { afterEach, expect, test, vi } from 'vitest';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.resetModules();
});

test.each([undefined, '', ' '])(
  'produção sem VITE_API_URL (%s) desativa somente a API, sem acessar localhost',
  async (url) => {
    vi.stubEnv('DEV', false);
    vi.stubEnv('VITE_API_URL', url);
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    const { fetchCompletedActivityIds, recordCompletion } =
      await import('./api');
    await expect(fetchCompletedActivityIds('session-id')).rejects.toThrow(
      'VITE_API_URL ausente',
    );
    await expect(recordCompletion('session-id', 'docs-export')).rejects.toThrow(
      'VITE_API_URL ausente',
    );
    expect(fetch).not.toHaveBeenCalled();
  },
);

test('desenvolvimento sem configuração mantém a API local', async () => {
  vi.stubEnv('DEV', true);
  vi.stubEnv('VITE_API_URL', undefined);
  const fetch = vi
    .fn()
    .mockResolvedValue(
      new Response(JSON.stringify({ completedActivityIds: [] })),
    );
  vi.stubGlobal('fetch', fetch);
  const { fetchCompletedActivityIds } = await import('./api');
  expect(await fetchCompletedActivityIds('session-id')).toEqual([]);
  expect(fetch).toHaveBeenCalledWith(
    'http://127.0.0.1:3001/progress?sessionId=session-id',
  );
});

test('a URL de build com barra final mantém os caminhos e envia somente identificadores', async () => {
  vi.stubEnv('VITE_API_URL', 'https://api.example/');
  const fetch = vi
    .fn()
    .mockResolvedValue(
      new Response(JSON.stringify({ completedActivityIds: ['docs-export'] })),
    );
  vi.stubGlobal('fetch', fetch);
  const { fetchCompletedActivityIds, recordCompletion } = await import('./api');
  expect(await fetchCompletedActivityIds('sessão')).toEqual(['docs-export']);
  expect(fetch).toHaveBeenCalledWith(
    'https://api.example/progress?sessionId=sess%C3%A3o',
  );
  await recordCompletion('session-id', 'docs-export');
  expect(fetch).toHaveBeenLastCalledWith('https://api.example/completions', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      sessionId: 'session-id',
      activityId: 'docs-export',
    }),
  });
});
