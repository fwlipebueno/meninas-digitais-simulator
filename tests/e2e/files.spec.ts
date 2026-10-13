import { expect, test, type Page } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.route('http://127.0.0.1:3001/**', (route) => route.abort());
});

async function start(page: Page, activity: string) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Arquivos', exact: true }).click();
  await page.getByRole('button', { name: new RegExp(activity) }).click();
}

async function fileMenu(page: Page, action: string) {
  await page.getByRole('button', { name: 'Arquivo', exact: true }).click();
  await page
    .getByRole('group', { name: 'Opções de Arquivo' })
    .getByRole('button', { name: action, exact: true })
    .click();
}

async function completeAndRepeat(page: Page) {
  await page.getByRole('button', { name: 'Concluir atividade' }).click();
  await expect(
    page.getByRole('heading', { name: 'Atividade concluída' }),
  ).toBeFocused();
  await page.getByRole('button', { name: 'Repetir atividade' }).click();
}

test('Criar: Novo limpa o conteúdo, mantém Sem título e permite repetir e retornar', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await start(page, 'Criar um documento');
  const editor = page.getByRole('textbox', {
    name: 'Conteúdo do Bloco de Notas',
  });
  await expect(editor).toHaveValue('Anotações anteriores');
  await editor.fill('Texto anterior alterado');
  await page
    .getByRole('button', { name: 'Arquivo', exact: true })
    .press('Enter');
  await page.getByRole('button', { name: 'Novo', exact: true }).press('Enter');
  await expect(editor).toHaveValue('');
  await expect(editor).toBeFocused();
  await expect(
    page.getByRole('heading', { name: 'Sem título — Bloco de Notas' }),
  ).toBeVisible();
  await expect(page.getByRole('status')).toContainText(
    'Novo documento em branco criado',
  );
  await completeAndRepeat(page);
  await expect(editor).toHaveValue('Anotações anteriores');
  await page.getByRole('button', { name: 'Voltar à seleção' }).click();
  await expect(
    page.getByRole('heading', {
      name: 'Criar, salvar, renomear e excluir arquivos',
    }),
  ).toBeFocused();
  await page.getByRole('button', { name: 'Início' }).click();
  await expect(
    page.getByRole('heading', { name: 'Aprender na prática' }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'E-mail', exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole('button', { name: 'Google Docs', exact: true }),
  ).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('Salvar como: cancelar preserva documento; confirmar salva conteúdo, local e título', async ({
  page,
}) => {
  await start(page, 'Salvar um arquivo');
  const editor = page.getByRole('textbox', {
    name: 'Conteúdo do Bloco de Notas',
  });
  await editor.fill('Minha ideia para o projeto');
  await fileMenu(page, 'Salvar como');
  const dialog = page.getByRole('dialog', { name: 'Salvar como', exact: true });
  const name = dialog.getByRole('textbox', { name: 'Nome do arquivo' });
  await expect(name).toBeFocused();
  await expect(
    dialog.getByRole('button', { name: 'Salvar', exact: true }),
  ).toBeDisabled();
  await name.fill('cancelado.txt');
  await dialog
    .getByRole('combobox', { name: 'Local' })
    .selectOption('Documentos');
  await dialog.getByRole('button', { name: 'Cancelar' }).click();
  await expect(dialog).toHaveCount(0);
  await expect(editor).toBeFocused();
  await expect(editor).toHaveValue('Minha ideia para o projeto');
  await expect(
    page.getByRole('region', { name: 'Pasta simulada' }),
  ).toHaveCount(0);
  await expect(
    page.getByRole('heading', { name: 'Sem título — Bloco de Notas' }),
  ).toBeVisible();
  await fileMenu(page, 'Salvar como');
  await name.fill('ideias.txt');
  await dialog
    .getByRole('combobox', { name: 'Local' })
    .selectOption('Documentos');
  await name.press('Enter');
  await expect(dialog).toHaveCount(0);
  await expect(
    page.getByRole('heading', { name: 'ideias.txt — Bloco de Notas' }),
  ).toBeVisible();
  const folder = page.getByRole('region', { name: 'Pasta simulada' });
  await expect(
    folder.getByRole('button', { name: 'ideias.txt', exact: true }),
  ).toBeVisible();
  await expect(folder).toContainText('Este Computador / Documentos');
  await page
    .locator('summary')
    .filter({ hasText: 'Ver conteúdo salvo' })
    .click();
  await expect(page.getByLabel('Conteúdo salvo', { exact: true })).toHaveText(
    'Minha ideia para o projeto',
  );
  await editor.fill('Minha ideia para o projeto atualizada');
  await expect(page.getByLabel('Conteúdo salvo', { exact: true })).toHaveText(
    'Minha ideia para o projeto',
  );
  await fileMenu(page, 'Salvar');
  await expect(dialog).toHaveCount(0);
  await expect(page.getByLabel('Conteúdo salvo', { exact: true })).toHaveText(
    'Minha ideia para o projeto atualizada',
  );
  await expect(page.getByRole('status')).toHaveText('Salvo.');
  await fileMenu(page, 'Salvar como');
  await name.fill('outro.txt');
  await dialog.getByRole('button', { name: 'Cancelar' }).click();
  await expect(
    page.getByRole('heading', { name: 'ideias.txt — Bloco de Notas' }),
  ).toBeVisible();
  await expect(
    folder.getByRole('button', { name: 'ideias.txt', exact: true }),
  ).toBeVisible();
  await completeAndRepeat(page);
  await expect(editor).toHaveValue('');
  await expect(folder).toHaveCount(0);
});

test('Ctrl + S funciona desde o título e em toda a atividade, sem reiniciar o diálogo', async ({
  page,
}) => {
  await start(page, 'Salvar um arquivo');
  const title = page.getByRole('heading', {
    name: 'Salvar um arquivo',
    exact: true,
  });
  await expect(title).toBeFocused();
  await page.keyboard.press('Control+s');
  const dialog = page.getByRole('dialog', { name: 'Salvar como', exact: true });
  const name = dialog.getByRole('textbox', { name: 'Nome do arquivo' });
  await expect(dialog).toBeVisible();
  await name.fill('rascunho.txt');
  await dialog
    .getByRole('combobox', { name: 'Local' })
    .selectOption('Documentos');
  await name.press('Control+s');
  await expect(dialog).toHaveCount(1);
  await expect(name).toHaveValue('rascunho.txt');
  await expect(dialog.getByRole('combobox', { name: 'Local' })).toHaveValue(
    'Documentos',
  );
  expect(
    await name.evaluate((element) =>
      element.dispatchEvent(
        new KeyboardEvent('keydown', {
          key: 's',
          ctrlKey: true,
          bubbles: true,
          cancelable: true,
        }),
      ),
    ),
  ).toBe(false);
  await dialog.getByRole('button', { name: 'Cancelar' }).click();

  for (const control of [
    page.getByText('Mostrar dica', { exact: true }),
    page.getByRole('button', { name: 'Arquivo', exact: true }),
    page.getByRole('textbox', { name: 'Conteúdo do Bloco de Notas' }),
  ]) {
    await control.focus();
    await page.keyboard.press('Control+s');
    await expect(dialog).toBeVisible();
    await expect(name).toHaveValue('');
    await dialog.getByRole('button', { name: 'Cancelar' }).click();
  }

  await title.focus();
  expect(
    await title.evaluate((element) =>
      element.dispatchEvent(
        new KeyboardEvent('keydown', {
          key: 's',
          ctrlKey: true,
          bubbles: true,
          cancelable: true,
        }),
      ),
    ),
  ).toBe(false);
  await name.fill('ideias.txt');
  await dialog.getByRole('button', { name: 'Salvar', exact: true }).click();
  await page
    .getByRole('textbox', { name: 'Conteúdo do Bloco de Notas' })
    .fill('Alteração');
  await title.focus();
  await page.keyboard.press('Control+s');
  await expect(dialog).toHaveCount(0);
  await expect(page.getByRole('status')).toHaveText('Salvo.');
  await page.getByRole('button', { name: 'Concluir atividade' }).click();
  expect(
    await page
      .getByRole('heading', { name: 'Atividade concluída' })
      .evaluate((element) =>
        element.dispatchEvent(
          new KeyboardEvent('keydown', {
            key: 's',
            ctrlKey: true,
            bubbles: true,
            cancelable: true,
          }),
        ),
      ),
  ).toBe(true);
  await page.getByRole('button', { name: 'Voltar à seleção' }).click();
  await page.getByRole('button', { name: /Criar um documento/ }).click();
  expect(
    await page
      .getByRole('heading', { name: 'Criar um documento', exact: true })
      .evaluate((element) =>
        element.dispatchEvent(
          new KeyboardEvent('keydown', {
            key: 's',
            ctrlKey: true,
            bubbles: true,
            cancelable: true,
          }),
        ),
      ),
  ).toBe(true);
  await expect(dialog).toHaveCount(0);
});

for (const method of ['Salvar', 'Ctrl + S simulado', 'Ctrl + S físico']) {
  test(`Salvar: ${method} abre Salvar como na primeira vez e salva depois sem diálogo`, async ({
    page,
  }) => {
    await start(page, 'Salvar um arquivo');
    const editor = page.getByRole('textbox', {
      name: 'Conteúdo do Bloco de Notas',
    });
    async function save() {
      if (method === 'Salvar') await fileMenu(page, 'Salvar');
      else if (method === 'Ctrl + S simulado')
        await page
          .getByRole('button', { name: 'Ctrl + S', exact: true })
          .press('Enter');
      else await editor.press('Control+s');
    }
    await save();
    const dialog = page.getByRole('dialog', {
      name: 'Salvar como',
      exact: true,
    });
    await expect(dialog).toBeVisible();
    await dialog
      .getByRole('textbox', { name: 'Nome do arquivo' })
      .fill('vazio.txt');
    await dialog.getByRole('button', { name: 'Salvar', exact: true }).click();
    await expect(
      page.getByRole('heading', { name: 'vazio.txt — Bloco de Notas' }),
    ).toBeVisible();
    await page
      .locator('summary')
      .filter({ hasText: 'Ver conteúdo salvo' })
      .click();
    await expect(page.getByLabel('Conteúdo salvo', { exact: true })).toHaveText(
      '',
    );
    await save();
    await expect(dialog).toHaveCount(0);
    await expect(page.getByRole('status')).toHaveText('Salvo.');
    await expect(
      page.getByRole('button', { name: 'Concluir atividade' }),
    ).toHaveCount(0);
    await editor.fill('Agora há uma alteração');
    await save();
    await expect(dialog).toHaveCount(0);
    await expect(page.getByLabel('Conteúdo salvo', { exact: true })).toHaveText(
      'Agora há uma alteração',
    );
    await expect(
      page.getByRole('button', { name: 'Concluir atividade' }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  });
}

test('Renomear: clique direito e Enter alteram o nome; perda de foco também confirma', async ({
  page,
}) => {
  await start(page, 'Renomear um arquivo');
  const folder = page.getByRole('region', { name: 'Pasta simulada' });
  await folder
    .getByRole('button', { name: 'ideias.txt', exact: true })
    .click({ button: 'right' });
  const context = page.getByRole('group', { name: 'Menu de contexto' });
  await expect(context.getByRole('button')).toHaveCount(1);
  await expect(
    context.getByRole('button', { name: 'Excluir', exact: true }),
  ).toHaveCount(0);
  await expect(
    context.getByRole('button', { name: 'Renomear', exact: true }),
  ).toBeFocused();
  await context
    .getByRole('button', { name: 'Renomear', exact: true })
    .press('Enter');
  const name = page.getByRole('textbox', { name: 'Novo nome do arquivo' });
  await expect(name).toBeFocused();
  await name.fill('projeto.txt');
  await name.press('Enter');
  await expect(
    folder.getByRole('button', { name: 'ideias.txt', exact: true }),
  ).toHaveCount(0);
  await expect(
    folder.getByRole('button', { name: 'projeto.txt', exact: true }),
  ).toBeFocused();
  await completeAndRepeat(page);
  await expect(
    folder.getByRole('button', { name: 'ideias.txt', exact: true }),
  ).toBeVisible();
  await folder
    .getByRole('button', { name: 'ideias.txt', exact: true })
    .press('Shift+F10');
  await context.getByRole('button', { name: 'Renomear', exact: true }).click();
  await name.fill('novas ideias.txt');
  await page.getByRole('heading', { name: 'Mude o nome do arquivo' }).click();
  await expect(
    folder.getByRole('button', { name: 'novas ideias.txt', exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test('Excluir: Não e Esc preservam o arquivo; Sim remove e repetição restaura', async ({
  page,
}) => {
  await start(page, 'Excluir um arquivo');
  const folder = page.getByRole('region', { name: 'Pasta simulada' });
  const icon = folder.getByRole('button', { name: 'ideias.txt', exact: true });
  const context = page.getByRole('group', { name: 'Menu de contexto' });
  const dialog = page.getByRole('dialog', {
    name: 'Excluir arquivo',
    exact: true,
  });
  await icon.click({ button: 'right' });
  await expect(context.getByRole('button')).toHaveCount(1);
  await expect(
    context.getByRole('button', { name: 'Renomear', exact: true }),
  ).toHaveCount(0);
  await context.getByRole('button', { name: 'Excluir', exact: true }).click();
  await expect(dialog).toContainText(
    'Deseja excluir ideias.txt da pasta simulada?',
  );
  await expect(
    dialog.getByRole('button', { name: 'Não', exact: true }),
  ).toBeFocused();
  await dialog.getByRole('button', { name: 'Não', exact: true }).click();
  await expect(icon).toBeFocused();
  await expect(
    page.getByRole('button', { name: 'Concluir atividade' }),
  ).toHaveCount(0);
  await page.getByRole('button', { name: 'Opções do arquivo' }).click();
  await context.getByRole('button', { name: 'Excluir', exact: true }).click();
  await dialog
    .getByRole('button', { name: 'Não', exact: true })
    .press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(icon).toBeVisible();
  await icon.press('Shift+F10');
  await context
    .getByRole('button', { name: 'Excluir', exact: true })
    .press('Enter');
  await dialog.getByRole('button', { name: 'Sim', exact: true }).press('Enter');
  await expect(dialog).toHaveCount(0);
  await expect(icon).toHaveCount(0);
  await expect(folder).toBeFocused();
  await expect(folder).toContainText('O arquivo foi removido da pasta.');
  await expect(page.getByRole('status')).toContainText('Arquivo excluído');
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await completeAndRepeat(page);
  await expect(icon).toBeVisible();
});

test('Módulo: concluir as quatro atividades de Arquivos mostra a tela de módulo concluído', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Arquivos', exact: true }).click();

  await page.getByRole('button', { name: /Criar um documento/ }).click();
  await page.getByRole('button', { name: 'Arquivo', exact: true }).click();
  await page
    .getByRole('group', { name: 'Opções de Arquivo' })
    .getByRole('button', { name: 'Novo', exact: true })
    .click();
  await page.getByRole('button', { name: 'Concluir atividade' }).click();
  await expect(
    page.getByRole('heading', { name: 'Atividade concluída' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Voltar à seleção' }).click();

  await page.getByRole('button', { name: /Salvar um arquivo/ }).click();
  const editor = page.getByRole('textbox', {
    name: 'Conteúdo do Bloco de Notas',
  });
  await editor.fill('Minha ideia para o projeto');
  await page.getByRole('button', { name: 'Arquivo', exact: true }).click();
  await page
    .getByRole('group', { name: 'Opções de Arquivo' })
    .getByRole('button', { name: 'Salvar como', exact: true })
    .click();
  const dialog = page.getByRole('dialog', { name: 'Salvar como', exact: true });
  const name = dialog.getByRole('textbox', { name: 'Nome do arquivo' });
  await name.fill('ideias2.txt');
  await name.press('Enter');
  await editor.fill('Minha ideia para o projeto atualizada');
  await page.getByRole('button', { name: 'Arquivo', exact: true }).click();
  await page
    .getByRole('group', { name: 'Opções de Arquivo' })
    .getByRole('button', { name: 'Salvar', exact: true })
    .click();
  await page.getByRole('button', { name: 'Concluir atividade' }).click();
  await expect(
    page.getByRole('heading', { name: 'Atividade concluída' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Voltar à seleção' }).click();

  await page.getByRole('button', { name: /Renomear um arquivo/ }).click();
  const folder = page.getByRole('region', { name: 'Pasta simulada' });
  await folder
    .getByRole('button', { name: 'ideias.txt', exact: true })
    .click({ button: 'right' });
  await page
    .getByRole('group', { name: 'Menu de contexto' })
    .getByRole('button', { name: 'Renomear', exact: true })
    .click();
  await page
    .getByRole('textbox', { name: 'Novo nome do arquivo' })
    .fill('renomeado.txt');
  await page
    .getByRole('textbox', { name: 'Novo nome do arquivo' })
    .press('Enter');
  await page.getByRole('button', { name: 'Concluir atividade' }).click();
  await expect(
    page.getByRole('heading', { name: 'Atividade concluída' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Voltar à seleção' }).click();

  await page.getByRole('button', { name: /Excluir um arquivo/ }).click();
  await page
    .getByRole('region', { name: 'Pasta simulada' })
    .getByRole('button', { name: 'ideias.txt', exact: true })
    .click({ button: 'right' });
  await page
    .getByRole('group', { name: 'Menu de contexto' })
    .getByRole('button', { name: 'Excluir', exact: true })
    .click();
  const excludeDialog = page.getByRole('dialog', {
    name: 'Excluir arquivo',
    exact: true,
  });
  await excludeDialog.getByRole('button', { name: 'Sim', exact: true }).click();
  await page.getByRole('button', { name: 'Concluir atividade' }).click();
  await expect(
    page.getByRole('heading', { name: 'Atividade concluída' }),
  ).toBeFocused();
  await expect(
    page.getByRole('button', { name: 'Repetir atividade', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Voltar à seleção', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Ver resumo do módulo' }).click();
  await expect(
    page.getByRole('heading', { name: 'Módulo concluído!' }),
  ).toBeFocused();
  await expect(
    page.getByRole('progressbar', { name: 'Progresso do módulo Arquivos' }),
  ).toHaveAttribute('aria-valuenow', '4');
  await expect(page.locator('.module-checklist li')).toHaveCount(4);
  await page.getByRole('button', { name: 'Repetir módulo' }).click();
  await expect(
    page.getByRole('heading', {
      name: 'Criar, salvar, renomear e excluir arquivos',
    }),
  ).toBeFocused();
  await expect(
    page.getByRole('button').filter({ hasText: '✓ Concluída' }),
  ).toHaveCount(4);
});

test('Integração: progresso anterior restaurado e conclusão registrada na API', async ({
  page,
}) => {
  let progressSessionId: string | null = null;
  let completion: { sessionId?: string; activityId?: string } | null = null;
  await page.route('http://127.0.0.1:3001/**', async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname === '/progress') {
      progressSessionId = url.searchParams.get('sessionId');
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          completedActivityIds: ['new-file', 'save-file', 'rename-file'],
        }),
      });
    } else if (url.pathname === '/completions') {
      completion = JSON.parse(route.request().postData() ?? '{}') as {
        sessionId?: string;
        activityId?: string;
      };
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: '{"ok":true}',
      });
    } else {
      await route.abort();
    }
  });

  await page.goto('/');
  await page.getByRole('button', { name: 'Arquivos', exact: true }).click();
  await expect(
    page.getByRole('button').filter({ hasText: '✓ Concluída' }),
  ).toHaveCount(3);
  await page.getByRole('button', { name: /Excluir um arquivo/ }).click();
  await page
    .getByRole('region', { name: 'Pasta simulada' })
    .getByRole('button', { name: 'ideias.txt', exact: true })
    .click({ button: 'right' });
  await page
    .getByRole('group', { name: 'Menu de contexto' })
    .getByRole('button', { name: 'Excluir', exact: true })
    .click();
  const excludeDialog = page.getByRole('dialog', {
    name: 'Excluir arquivo',
    exact: true,
  });
  await excludeDialog.getByRole('button', { name: 'Sim', exact: true }).click();
  await page.getByRole('button', { name: 'Concluir atividade' }).click();

  await expect(
    page.getByRole('heading', { name: 'Atividade concluída' }),
  ).toBeFocused();
  await expect(
    page.getByRole('button', { name: 'Repetir atividade', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: 'Voltar à seleção', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Ver resumo do módulo' }).click();
  await expect(
    page.getByRole('heading', { name: 'Módulo concluído!' }),
  ).toBeVisible();
  await expect
    .poll(() => completion)
    .toEqual({
      sessionId: progressSessionId,
      activityId: 'delete-file',
    });
  expect(progressSessionId).toMatch(
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  );
});
