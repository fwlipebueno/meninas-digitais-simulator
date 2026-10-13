const API_BASE_URL: string =
  import.meta.env.VITE_API_URL ?? 'http://127.0.0.1:3001';
const SESSION_STORAGE_KEY = 'meninas-digitais.sessionId';
let sessionId: string | undefined;

export function getSessionId(): string {
  if (sessionId) return sessionId;
  try {
    sessionId = sessionStorage.getItem(SESSION_STORAGE_KEY) ?? undefined;
  } catch {
    // Storage é opcional.
  }
  sessionId ||= crypto.randomUUID();
  try {
    sessionStorage.setItem(SESSION_STORAGE_KEY, sessionId);
  } catch {
    // Mantém a sessão em memória.
  }
  return sessionId;
}

export async function fetchCompletedActivityIds(
  sessionId: string,
): Promise<readonly string[]> {
  const response = await fetch(
    `${API_BASE_URL}/progress?sessionId=${encodeURIComponent(sessionId)}`,
  );
  if (!response.ok)
    throw new Error(`Progresso indisponível (HTTP ${response.status}).`);
  const data = (await response.json()) as { completedActivityIds?: unknown };
  if (!Array.isArray(data.completedActivityIds))
    throw new Error('Progresso indisponível (resposta inesperada).');
  return data.completedActivityIds.filter(
    (id): id is string => typeof id === 'string',
  );
}

export async function recordCompletion(
  sessionId: string,
  activityId: string,
): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/completions`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ sessionId, activityId }),
  });
  if (!response.ok)
    throw new Error(`Conclusão não registrada (HTTP ${response.status}).`);
}
