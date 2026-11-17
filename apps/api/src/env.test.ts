import { expect, test } from 'vitest';
import { readEnv } from './env.ts';

test('aceita uma conexão PostgreSQL e aplica a porta padrão', () => {
  expect(readEnv({ DATABASE_URL: 'postgresql://localhost/simulator' })).toEqual(
    {
      PORT: 3001,
      DATABASE_URL: 'postgresql://localhost/simulator',
    },
  );
});

test('CORS_ORIGIN aceita somente uma origem HTTP/HTTPS, sem caminho nem credenciais', () => {
  const DATABASE_URL = 'postgresql://localhost/simulator';
  expect(
    readEnv({ DATABASE_URL, CORS_ORIGIN: 'https://frontend.example' })
      .CORS_ORIGIN,
  ).toBe('https://frontend.example');
  for (const CORS_ORIGIN of [
    '*',
    'https://frontend.example/',
    'https://frontend.example/path',
    'https://user:secret@frontend.example',
  ]) {
    expect(() => readEnv({ DATABASE_URL, CORS_ORIGIN })).toThrow('CORS_ORIGIN');
  }
});

test.each([
  {},
  { DATABASE_URL: 'https://localhost/simulator' },
  { DATABASE_URL: 'postgresql://localhost/simulator', PORT: '65536' },
  { DATABASE_URL: 'postgresql://localhost/simulator', PORT: '' },
])('rejeita configuração inválida sem revelar credenciais', (source) => {
  expect(() => readEnv(source)).toThrow('Variáveis de ambiente inválidas:');
});
