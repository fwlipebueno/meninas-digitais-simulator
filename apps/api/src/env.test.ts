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

test.each([
  {},
  { DATABASE_URL: 'https://localhost/simulator' },
  { DATABASE_URL: 'postgresql://localhost/simulator', PORT: '65536' },
  { DATABASE_URL: 'postgresql://localhost/simulator', PORT: '' },
])('rejeita configuração inválida sem revelar credenciais', (source) => {
  expect(() => readEnv(source)).toThrow('Variáveis de ambiente inválidas:');
});
