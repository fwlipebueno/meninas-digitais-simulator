import { expect, test, type Page } from '@playwright/test';

async function enter(page: Page, activity: string) {
  await page.goto('/');
  await page.getByRole('button', { name: 'E-mail', exact: true }).click();
  await page.getByRole('button', { name: new RegExp(activity) }).click();
  await expect(
    page.getByRole('heading', { level: 1, name: activity, exact: true }),
  ).toBeFocused();
}

async function register(page: Page, username = 'aluna.cp') {
  await page.getByRole('button', { name: 'Criar conta', exact: true }).click();
  await page.getByLabel('Nome', { exact: true }).fill('Aluna');
  await page.getByLabel('Sobrenome').fill('Treino');
  await page.getByLabel('Nome de usuário').fill(username);
  await page.getByLabel('Senha', { exact: true }).fill('abcd1234');
  await page.getByLabel('Confirmar senha').fill('abcd1234');
  await page.getByRole('button', { name: 'Criar conta de treino' }).click();
}

async function compose(page: Page) {
  await page.getByRole('button', { name: 'Escrever', exact: true }).click();
  await expect(page.getByLabel('Para', { exact: true })).toBeFocused();
  await page.getByLabel('Para', { exact: true }).fill('mentora@exemplo.com');
  await page.getByLabel('Assunto', { exact: true }).fill('Projeto de treino');
  await page
    .getByLabel('Corpo', { exact: true })
    .fill('Olá, mentora!\nVamos conversar sobre o projeto?');
}

test.beforeEach(async ({ page }) => {
  await page.route('http://127.0.0.1:3001/**', (route) => route.abort());
});

test('Cadastro: campos obrigatórios, disponibilidade, senha e confirmação antes de criar', async ({
  page,
}) => {
  const posts: unknown[] = [];
  page.on('request', (request) => {
    if (request.method() === 'POST') posts.push(request.postDataJSON());
  });
  await enter(page, 'Criar uma conta');
  await expect(page.getByText('Gmail — simulação')).toBeVisible();
  await expect(page.getByLabel('E-mail ou telefone')).toBeVisible();
  await expect(page.getByLabel('Senha', { exact: true })).toHaveAttribute(
    'type',
    'password',
  );
  await expect(
    page.getByRole('button', { name: 'Concluir atividade' }),
  ).toBeDisabled();
  await page.getByRole('button', { name: 'Criar conta', exact: true }).click();
  await expect(page.getByLabel('Nome', { exact: true })).toBeFocused();
  await page.getByRole('button', { name: 'Criar conta de treino' }).click();
  await expect(page.getByRole('alert')).toHaveText('Preencha todos os campos.');
  await page.getByLabel('Nome', { exact: true }).fill('Aluna');
  await page.getByLabel('Sobrenome').fill('Treino');
  const username = page.getByLabel('Nome de usuário');
  for (const name of ['admin', ' MENINASDIGITAIS ', 'technovation']) {
    await username.fill(name);
    await username.press('Tab');
    await expect(
      page.getByText(/Nome de usuário indisponível\. Tente/),
    ).toContainText(`${name.trim().toLowerCase()}.cp`);
  }
  await page.getByLabel('Senha', { exact: true }).fill('abcd1234');
  await page.getByLabel('Confirmar senha').fill('abcd1234');
  await page.getByRole('button', { name: 'Criar conta de treino' }).click();
  await expect(page.getByRole('alert')).toHaveText(
    'Escolha um nome de usuário disponível.',
  );
  await username.fill('aluna.cp');
  await expect(
    page.getByText('Nome de usuário disponível.', { exact: true }),
  ).toBeVisible();
  for (const password of ['abc1234', 'abcdefgh', '12345678']) {
    await page.getByLabel('Senha', { exact: true }).fill(password);
    await page.getByRole('button', { name: 'Criar conta de treino' }).click();
    await expect(page.getByRole('alert')).toHaveText(
      'Use pelo menos 8 caracteres, com letras e números.',
    );
  }
  await page.getByLabel('Senha', { exact: true }).fill('abcd1234');
  await expect(page.getByText('Senha válida.', { exact: true })).toBeVisible();
  await page.getByLabel('Confirmar senha').fill('outra123');
  await page.getByRole('button', { name: 'Criar conta de treino' }).click();
  await expect(page.getByRole('alert')).toHaveText('As senhas não conferem.');
  for (const label of ['Senha', 'Confirmar senha']) {
    await expect(page.getByLabel(label, { exact: true })).toHaveAttribute(
      'type',
      'password',
    );
  }
  await page.getByLabel('Confirmar senha').fill('abcd1234');
  await page.getByLabel('Confirmar senha').press('Enter');
  await expect(
    page.getByRole('heading', { name: 'Caixa de entrada', exact: true }),
  ).toBeFocused();
  await expect(
    page.getByText('Conta de treino criada. Bem-vinda!', { exact: true }),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Fechar mensagem de boas-vindas' })
    .click();
  await expect(
    page.getByText('Conta de treino criada. Bem-vinda!', { exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole('heading', { name: 'Caixa de entrada', exact: true }),
  ).toBeFocused();
  await expect(
    page.getByText('aluna.cp@gmail.com', { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Escrever', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Concluir atividade' }),
  ).toBeEnabled();
  expect(posts).toEqual([]);
  await page.getByRole('button', { name: 'Concluir atividade' }).click();
  await expect(
    page.getByRole('heading', { name: 'Atividade concluída' }),
  ).toBeFocused();
  await expect.poll(() => posts.length).toBe(1);
  expect(posts[0]).toEqual({
    sessionId: expect.any(String),
    activityId: 'create-account',
  });
  await page
    .getByRole('button', { name: 'Repetir atividade', exact: true })
    .click();
  await page.getByRole('button', { name: 'Criar conta', exact: true }).click();
  await username.fill('ALUNA.CP');
  await expect(page.getByText(/Nome de usuário indisponível/)).toContainText(
    'aluna.cp.cp',
  );
  await page.getByRole('button', { name: 'Voltar à seleção' }).click();
  await expect(
    page.getByRole('button', { name: /Criar uma conta/ }),
  ).toContainText('✓ Concluída');
});

test('Login: erro permite corrigir; conta criada funciona só em memória e o progresso aguarda Concluir', async ({
  page,
}) => {
  const posts: unknown[] = [];
  page.on('request', (request) => {
    if (request.method() === 'POST') posts.push(request.postDataJSON());
  });
  await enter(page, 'Criar uma conta');
  await register(page);
  await page.getByRole('button', { name: 'Voltar à seleção' }).click();
  await expect(
    page.getByRole('button', { name: /Criar uma conta/ }),
  ).not.toContainText('✓ Concluída');
  await page.getByRole('button', { name: /Fazer login/ }).click();
  await page.getByLabel('E-mail ou telefone').fill('aluna.cp@gmail.com');
  await page.getByLabel('Senha', { exact: true }).fill('errada');
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText(
    'E-mail ou senha incorretos',
  );
  await expect(page.getByLabel('E-mail ou telefone')).toHaveValue(
    'aluna.cp@gmail.com',
  );
  await expect(
    page.getByRole('button', { name: 'Concluir atividade' }),
  ).toBeDisabled();
  await page.getByLabel('Senha', { exact: true }).fill('abcd1234');
  await page.getByLabel('Senha', { exact: true }).press('Enter');
  await expect(
    page.getByRole('heading', { name: 'Caixa de entrada', exact: true }),
  ).toBeFocused();
  expect(posts).toEqual([]);
  await page.getByRole('button', { name: 'Concluir atividade' }).click();
  await expect(
    page.getByRole('heading', { name: 'Atividade concluída' }),
  ).toBeFocused();
  await expect.poll(() => posts.length).toBe(1);
  expect(posts[0]).toEqual({
    sessionId: expect.any(String),
    activityId: 'login-mail',
  });
  await page
    .getByRole('button', { name: 'Voltar à seleção', exact: true })
    .click();
  await page.getByRole('button', { name: 'Início' }).click();
  await page.getByRole('button', { name: 'E-mail', exact: true }).click();
  await page.getByRole('button', { name: /Fazer login/ }).click();
  await page.getByLabel('E-mail ou telefone').fill('aluna.cp@gmail.com');
  await page.getByLabel('Senha', { exact: true }).fill('abcd1234');
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText(
    'E-mail ou senha incorretos',
  );
  await page.getByLabel('E-mail ou telefone').fill(' ALUNA@TREINO.COM ');
  await page.getByLabel('Senha', { exact: true }).fill('treino123');
  await page.getByLabel('Senha', { exact: true }).press('Enter');
  await expect(
    page.getByRole('heading', { name: 'Caixa de entrada', exact: true }),
  ).toBeVisible();
});

test('Enviar: valida destinatário e conteúdo, minimiza sem perder texto e registra somente ao concluir', async ({
  page,
}) => {
  const posts: unknown[] = [];
  page.on('request', (request) => {
    if (request.method() === 'POST') posts.push(request.postDataJSON());
  });
  await enter(page, 'Enviar um e-mail');
  await expect(
    page.getByRole('heading', { name: 'Caixa de entrada', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Escrever', exact: true }).click();
  const to = page.getByLabel('Para', { exact: true });
  await expect(to).toBeFocused();
  for (const invalid of ['', 'mentora@exemplo', 'x@@y.z', 'x y@exemplo.com']) {
    await to.fill(invalid);
    await page.getByRole('button', { name: 'Enviar', exact: true }).click();
    await expect(page.getByRole('alert')).toHaveText(
      'Digite um endereço de e-mail válido.',
    );
    await expect(to).toHaveAttribute('aria-invalid', 'true');
    await expect(to).toBeFocused();
    await expect(
      page.getByRole('button', { name: 'Concluir atividade' }),
    ).toBeDisabled();
  }
  await to.fill('mentora@exemplo.com');
  await to.press('Tab');
  await expect(page.getByLabel('Assunto', { exact: true })).toBeFocused();
  await page.getByRole('button', { name: 'Enviar', exact: true }).click();
  await expect(page.getByRole('alert')).toHaveText(
    'Preencha o assunto e a mensagem.',
  );
  const subject = 'Projeto ' + 'a'.repeat(180);
  const body =
    'Olá, mentora!\n<script>window.erro = true</script>\n' +
    'Vamos treinar. '.repeat(80);
  await page.getByLabel('Assunto', { exact: true }).fill(subject);
  await page.getByRole('button', { name: 'Enviar', exact: true }).click();
  await expect(page.getByRole('alert')).toHaveText(
    'Preencha o assunto e a mensagem.',
  );
  await page.getByLabel('Corpo', { exact: true }).fill(body);
  await page.getByRole('button', { name: 'Minimizar mensagem' }).click();
  await expect(to).toHaveCount(0);
  await page.getByRole('button', { name: 'Restaurar mensagem' }).click();
  await expect(to).toBeFocused();
  await expect(to).toHaveValue('mentora@exemplo.com');
  await expect(page.getByLabel('Assunto', { exact: true })).toHaveValue(
    subject,
  );
  await expect(page.getByLabel('Corpo', { exact: true })).toHaveValue(body);
  await page.getByRole('button', { name: 'Enviar', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Nova mensagem' })).toHaveCount(
    0,
  );
  await expect(
    page.getByRole('heading', { name: 'Enviados', exact: true }),
  ).toBeFocused();
  const sent = page.getByRole('region', { name: 'Enviados', exact: true });
  await expect(sent).toContainText(subject);
  await expect(sent).toContainText('<script>window.erro = true</script>');
  await expect(
    page.getByText('Mensagem enviada.', { exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(posts).toEqual([]);
  await page
    .getByRole('button', { name: 'Caixa de entrada', exact: true })
    .click();
  await page.getByRole('button', { name: 'Enviados', exact: true }).click();
  await expect(sent.getByRole('listitem')).toHaveCount(1);
  await page.getByRole('button', { name: 'Concluir atividade' }).click();
  await expect(
    page.getByRole('heading', { name: 'Atividade concluída' }),
  ).toBeFocused();
  await expect.poll(() => posts.length).toBe(1);
  expect(posts[0]).toEqual({
    sessionId: expect.any(String),
    activityId: 'send-mail',
  });
  await page
    .getByRole('button', { name: 'Repetir atividade', exact: true })
    .click();
  await expect(
    page.getByRole('button', { name: 'Concluir atividade' }),
  ).toBeDisabled();
  await page.getByRole('button', { name: 'Enviados', exact: true }).click();
  await expect(
    page.getByText('Nenhuma mensagem enviada.', { exact: true }),
  ).toBeVisible();
});

test('Descartar por X e Descartar limpa a composição e preserva somente mensagens já enviadas', async ({
  page,
}) => {
  await enter(page, 'Enviar um e-mail');
  for (const control of ['Fechar e descartar mensagem', 'Descartar']) {
    await compose(page);
    await page.getByRole('button', { name: control, exact: true }).click();
    await expect(
      page.getByRole('button', { name: 'Escrever', exact: true }),
    ).toBeFocused();
    await expect(
      page.getByRole('region', { name: 'Nova mensagem' }),
    ).toHaveCount(0);
    await expect(
      page.getByRole('button', { name: 'Concluir atividade' }),
    ).toBeDisabled();
    await page.getByRole('button', { name: 'Enviados', exact: true }).click();
    await expect(
      page.getByText('Nenhuma mensagem enviada.', { exact: true }),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Escrever', exact: true }).click();
    for (const label of ['Para', 'Assunto', 'Corpo'])
      await expect(page.getByLabel(label, { exact: true })).toHaveValue('');
    await page.getByRole('button', { name: 'Descartar', exact: true }).click();
  }
  await compose(page);
  await page.getByRole('button', { name: 'Enviar', exact: true }).click();
  await compose(page);
  await page.getByRole('button', { name: 'Escrever', exact: true }).click();
  await expect(page.getByLabel('Corpo', { exact: true })).not.toHaveValue('');
  await page.getByRole('button', { name: 'Descartar', exact: true }).click();
  await expect(
    page
      .getByRole('region', { name: 'Enviados', exact: true })
      .getByRole('listitem'),
  ).toHaveCount(1);
  await page.getByRole('button', { name: 'Rascunhos', exact: true }).click();
  await expect(
    page.getByText('Nenhum rascunho salvo nesta atividade.', { exact: true }),
  ).toBeVisible();
});

test('Módulo: três objetivos locais, conclusão individual e resumo explícito 3/3 sem apagar progresso', async ({
  page,
}) => {
  await enter(page, 'Criar uma conta');
  await register(page);
  await page.getByRole('button', { name: 'Concluir atividade' }).click();
  await expect(
    page.getByRole('button', { name: 'Ver resumo do módulo' }),
  ).toHaveCount(0);
  await page
    .getByRole('button', { name: 'Voltar à seleção', exact: true })
    .click();
  await page.getByRole('button', { name: /Fazer login/ }).click();
  await page.getByLabel('E-mail ou telefone').fill('aluna@treino.com');
  await page.getByLabel('Senha', { exact: true }).fill('treino123');
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await page.getByRole('button', { name: 'Concluir atividade' }).click();
  await page
    .getByRole('button', { name: 'Voltar à seleção', exact: true })
    .click();
  await page.getByRole('button', { name: /Enviar um e-mail/ }).click();
  await compose(page);
  await page.getByRole('button', { name: 'Enviar', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Módulo concluído!' }),
  ).toHaveCount(0);
  await page.getByRole('button', { name: 'Concluir atividade' }).click();
  await expect(
    page.getByRole('heading', { name: 'Atividade concluída' }),
  ).toBeFocused();
  await page.getByRole('button', { name: 'Ver resumo do módulo' }).click();
  await expect(
    page.getByRole('heading', { name: 'Módulo concluído!' }),
  ).toBeFocused();
  await expect(page.getByText('3 de 3', { exact: true })).toBeVisible();
  await expect(
    page.getByRole('progressbar', { name: 'Progresso do módulo E-mail' }),
  ).toHaveAttribute('aria-valuenow', '3');
  await page.getByRole('button', { name: 'Repetir módulo' }).click();
  await expect(
    page.getByRole('button').filter({ hasText: '✓ Concluída' }),
  ).toHaveCount(3);
  await page.getByRole('button', { name: /Enviar um e-mail/ }).click();
  await page.getByRole('button', { name: 'Voltar à seleção' }).click();
  await expect(
    page.getByRole('button').filter({ hasText: '✓ Concluída' }),
  ).toHaveCount(3);
  await page.getByRole('button', { name: /Fazer login/ }).click();
  await page.getByRole('button', { name: 'Criar conta', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Criar uma conta', exact: true }),
  ).toBeFocused();
  await expect(page.getByLabel('Nome', { exact: true })).toBeVisible();
});

test('Login iniciado no cadastro preserva os campos, identifica a atividade correta e só registra ao concluir', async ({
  page,
}) => {
  const posts: unknown[] = [];
  page.on('request', (request) => {
    if (request.method() === 'POST') posts.push(request.postDataJSON());
  });
  await enter(page, 'Criar uma conta');
  await page.getByLabel('E-mail ou telefone').fill('aluna@treino.com');
  await page.getByLabel('Senha', { exact: true }).fill('errada');
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Fazer login', exact: true }),
  ).toBeFocused();
  await expect(page.getByRole('alert')).toContainText(
    'E-mail ou senha incorretos',
  );
  await expect(page.getByLabel('E-mail ou telefone')).toHaveValue(
    'aluna@treino.com',
  );
  await expect(
    page.getByRole('button', { name: 'Concluir atividade' }),
  ).toBeDisabled();
  await page.getByRole('button', { name: 'Voltar à seleção' }).click();
  await page.getByRole('button', { name: /Criar uma conta/ }).click();
  await page.getByLabel('E-mail ou telefone').fill('aluna@treino.com');
  await page.getByLabel('Senha', { exact: true }).fill('treino123');
  await page.getByLabel('Senha', { exact: true }).press('Enter');
  await expect(
    page.getByRole('heading', { name: 'Fazer login', exact: true }),
  ).toBeFocused();
  await expect(
    page.getByRole('heading', { name: 'Caixa de entrada', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Concluir atividade' }),
  ).toBeEnabled();
  expect(posts).toEqual([]);
  await page.getByRole('button', { name: 'Concluir atividade' }).click();
  await expect(
    page.getByRole('heading', { name: 'Atividade concluída' }),
  ).toBeFocused();
  await expect
    .poll(() => posts)
    .toEqual([{ sessionId: expect.any(String), activityId: 'login-mail' }]);
  await page
    .getByRole('button', { name: 'Repetir atividade', exact: true })
    .click();
  await expect(
    page.getByRole('heading', { name: 'Fazer login', exact: true }),
  ).toBeFocused();
  await expect(page.getByLabel('E-mail ou telefone')).toHaveValue('');
  await expect(page.getByLabel('Senha', { exact: true })).toHaveValue('');
  await page.getByRole('button', { name: 'Voltar à seleção' }).click();
  await expect(page.getByRole('button', { name: /Fazer login/ })).toContainText(
    '✓ Concluída',
  );
  await expect(
    page.getByRole('button', { name: /Criar uma conta/ }),
  ).not.toContainText('✓ Concluída');
});

test('Boas-vindas: expiração preserva foco contextual; sugestões longas não causam overflow', async ({
  page,
}) => {
  await page.clock.install();
  await enter(page, 'Criar uma conta');
  const username = 'aluna' + 'x'.repeat(100);
  await register(page, username);
  await page
    .getByRole('button', { name: 'Fechar mensagem de boas-vindas' })
    .focus();
  await page.clock.fastForward(5000);
  await expect(
    page.getByRole('heading', { name: 'Caixa de entrada', exact: true }),
  ).toBeFocused();
  await expect(
    page.getByRole('button', { name: 'Fechar mensagem de boas-vindas' }),
  ).toHaveCount(0);
  await page.getByRole('button', { name: 'Concluir atividade' }).click();
  await page
    .getByRole('button', { name: 'Repetir atividade', exact: true })
    .click();
  await page.getByRole('button', { name: 'Criar conta', exact: true }).click();
  await page.getByLabel('Nome de usuário').fill(username);
  await expect(page.getByText(/Nome de usuário indisponível/)).toContainText(
    `${username}.cp`,
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole('button', { name: 'Voltar à seleção' }).click();
  await page.getByRole('button', { name: /Criar uma conta/ }).click();
  await register(page, 'aluna.cp');
  await page.getByRole('button', { name: 'Enviados', exact: true }).focus();
  await page.clock.fastForward(5000);
  await expect(
    page.getByRole('button', { name: 'Enviados', exact: true }),
  ).toBeFocused();
});

test('Progresso: restauração tardia se une ao envio local; somente IDs chegam à API', async ({
  page,
}) => {
  let restore!: () => void;
  const pending = new Promise<void>((resolve) => {
    restore = resolve;
  });
  const completions: unknown[] = [];
  let sessionId: string | null = null;
  await page.route('http://127.0.0.1:3001/**', async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname === '/progress') {
      sessionId = url.searchParams.get('sessionId');
      await pending;
      await route.fulfill({
        json: {
          completedActivityIds: ['create-account', 'login-mail', 'new-file'],
        },
      });
    } else {
      completions.push(route.request().postDataJSON());
      await route.fulfill({ json: { ok: true } });
    }
  });
  await enter(page, 'Enviar um e-mail');
  await compose(page);
  await page.getByRole('button', { name: 'Enviar', exact: true }).click();
  expect(completions).toEqual([]);
  await page.getByRole('button', { name: 'Concluir atividade' }).click();
  await expect
    .poll(() => completions)
    .toEqual([{ sessionId, activityId: 'send-mail' }]);
  await page
    .getByRole('button', { name: 'Repetir atividade', exact: true })
    .click();
  restore();
  await page.getByRole('button', { name: 'Voltar à seleção' }).click();
  await expect(
    page.getByRole('button').filter({ hasText: '✓ Concluída' }),
  ).toHaveCount(3);
  await page.getByRole('button', { name: /Criar uma conta/ }).click();
  await expect(
    page.getByRole('button', { name: 'Concluir atividade' }),
  ).toBeDisabled();
  await register(page);
  await page.getByRole('button', { name: 'Concluir atividade' }).click();
  await expect
    .poll(() => completions)
    .toEqual([
      { sessionId, activityId: 'send-mail' },
      { sessionId, activityId: 'create-account' },
    ]);
  await expect(
    page.getByRole('button', { name: 'Ver resumo do módulo' }),
  ).toBeVisible();
});

test('API e storage indisponíveis: E-mail continua utilizável sem persistir contas ou mensagens', async ({
  page,
}) => {
  const errors: string[] = [];
  const sessionIds: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.addInitScript(() => {
    for (const key of ['sessionStorage', 'localStorage'])
      Object.defineProperty(window, key, {
        get() {
          throw new DOMException('Storage bloqueado', 'SecurityError');
        },
      });
  });
  await page.route('http://127.0.0.1:3001/**', async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname === '/progress')
      sessionIds.push(url.searchParams.get('sessionId')!);
    else
      sessionIds.push(
        (route.request().postDataJSON() as { sessionId: string }).sessionId,
      );
    await route.abort();
  });
  await enter(page, 'Enviar um e-mail');
  await compose(page);
  await page.getByRole('button', { name: 'Enviar', exact: true }).click();
  await page.getByRole('button', { name: 'Concluir atividade' }).click();
  await expect(
    page.getByRole('heading', { name: 'Atividade concluída' }),
  ).toBeFocused();
  await expect.poll(() => sessionIds.length).toBe(2);
  expect(new Set(sessionIds).size).toBe(1);
  expect(errors).toEqual([]);
});
