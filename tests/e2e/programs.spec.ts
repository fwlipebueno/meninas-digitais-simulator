import { expect, test, type Page } from '@playwright/test';

test('Alternar: Alt + Tab percorre sem ativar até Soltar Alt', async ({
  page,
}) => {
  await start(page, 'Alternar programas', 'Alt + Tab');
  const shortcuts = page.getByRole('group', { name: 'Atalhos simulados' });
  const taskbar = page.getByRole('group', { name: 'Barra de tarefas' });
  await shortcuts
    .getByRole('button', { name: 'Alt + Tab', exact: true })
    .click();
  const selector = page.getByRole('region', { name: 'Seletor Alt + Tab' });
  const cards = selector.getByRole('listitem');
  await expect(cards).toHaveCount(2);
  await expect(cards.filter({ hasText: 'Bloco de Notas' })).toContainText(
    '✓ Selecionada',
  );
  const tab = selector.getByRole('button', { name: 'Tab', exact: true });
  await expect(
    taskbar.getByRole('button', { name: 'Navegador', exact: true }),
  ).toBeDisabled();
  await taskbar
    .getByRole('button', { name: 'Navegador', exact: true })
    .click({ force: true });
  await expect(
    shortcuts.getByRole('button', { name: 'Alt + F4', exact: true }),
  ).toBeDisabled();
  await tab.press('Enter');
  await expect(cards.filter({ hasText: 'Navegador' })).toContainText(
    '✓ Selecionada',
  );
  await expect(
    taskbar.getByRole('button', { name: 'Bloco de Notas', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
  await tab.click();
  await expect(cards.filter({ hasText: 'Bloco de Notas' })).toContainText(
    '✓ Selecionada',
  );
  await tab.click();
  await selector.getByRole('button', { name: 'Soltar Alt' }).press('Enter');
  await expect(selector).toHaveCount(0);
  await expect(
    page.getByRole('region', { name: 'Janela Navegador', exact: true }),
  ).toBeFocused();
  await expect(
    taskbar.getByRole('button', { name: 'Navegador', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: 'Concluir atividade' }).click();
  await page.getByRole('button', { name: 'Repetir atividade' }).click();
  await expect(
    taskbar.getByRole('button', { name: 'Bloco de Notas', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
});

test('Alternar: Task View usa setas, Enter, clique e cancelamento sem ativar', async ({
  page,
}) => {
  await start(page, 'Alternar programas', 'Win + Tab');
  const shortcut = page
    .getByRole('group', { name: 'Atalhos simulados' })
    .getByRole('button', { name: 'Win + Tab', exact: true });
  const view = page.getByRole('region', {
    name: 'Visão de Tarefas',
    exact: true,
  });
  const notepad = view.getByRole('button', { name: /Bloco de Notas/ });
  const browser = view.getByRole('button', { name: /Navegador/ });
  const taskbar = page.getByRole('group', { name: 'Barra de tarefas' });
  await shortcut.click();
  await expect(view.getByText('✓ Área de trabalho 1 · Atual')).toBeVisible();
  await expect(notepad).toBeFocused();
  await notepad.press('ArrowRight');
  await expect(browser).toHaveAttribute('aria-pressed', 'true');
  await expect(browser).toBeFocused();
  await expect(
    taskbar.getByRole('button', { name: 'Navegador', exact: true }),
  ).toBeDisabled();
  await taskbar
    .getByRole('button', { name: 'Navegador', exact: true })
    .click({ force: true });
  await expect(
    taskbar.getByRole('button', { name: 'Bloco de Notas', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
  await browser.press('Escape');
  await expect(view).toHaveCount(0);
  await expect(
    taskbar.getByRole('button', { name: 'Bloco de Notas', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
  await shortcut.click();
  await notepad.press('ArrowLeft');
  await expect(browser).toHaveAttribute('aria-pressed', 'true');
  await page
    .getByRole('button', { name: 'Sair da Visão de Tarefas sem alternar' })
    .click({ position: { x: 6, y: 100 } });
  await expect(view).toHaveCount(0);
  await expect(
    taskbar.getByRole('button', { name: 'Bloco de Notas', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
  await shortcut.click();
  await notepad.press('ArrowDown');
  await browser.press('Enter');
  await expect(
    page.getByRole('region', { name: 'Janela Navegador', exact: true }),
  ).toBeFocused();
  await shortcut.click();
  await notepad.click();
  await expect(
    page.getByRole('region', { name: 'Janela Bloco de Notas', exact: true }),
  ).toBeFocused();
  await expect(view).toHaveCount(0);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test('Alternar: miniaturas e Gerenciador acompanham abertura, minimização e fechamento', async ({
  page,
}) => {
  await start(page, 'Alternar programas', 'Win + Tab');
  const shortcuts = page.getByRole('group', { name: 'Atalhos simulados' });
  const view = page.getByRole('region', {
    name: 'Visão de Tarefas',
    exact: true,
  });
  await page
    .getByRole('button', { name: 'Minimizar Bloco de Notas', exact: true })
    .click();
  await shortcuts
    .getByRole('button', { name: 'Win + Tab', exact: true })
    .click();
  await expect(view.getByRole('listitem')).toHaveCount(2);
  await view
    .getByRole('button', { name: /Bloco de Notas.*Minimizada/ })
    .click();
  await expect(
    page.getByRole('region', { name: 'Janela Bloco de Notas', exact: true }),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Fechar Bloco de Notas', exact: true })
    .click();
  await shortcuts
    .getByRole('button', { name: 'Ctrl + Shift + Esc', exact: true })
    .click();
  const manager = page.getByRole('region', {
    name: 'Gerenciador de Tarefas',
    exact: true,
  });
  await expect(manager.getByRole('radio')).toHaveCount(1);
  await expect(manager.getByRole('radio')).toHaveAccessibleName(/Navegador/);
  await shortcuts
    .getByRole('button', { name: 'Alt + Tab', exact: true })
    .click();
  await expect(
    page
      .getByRole('region', { name: 'Seletor Alt + Tab' })
      .getByRole('listitem'),
  ).toHaveCount(1);
  await shortcuts.getByRole('button', { name: 'Win + S', exact: true }).click();
  await page.getByRole('textbox', { name: 'Pesquisar aplicativos' }).fill('bl');
  await page
    .getByRole('textbox', { name: 'Pesquisar aplicativos' })
    .press('Enter');
  await shortcuts
    .getByRole('button', { name: 'Win + Tab', exact: true })
    .click();
  await expect(view.getByRole('listitem')).toHaveCount(2);
  for (const preview of await view.locator('.window-preview').all()) {
    const box = await preview.boundingBox();
    expect(box?.width).toBeGreaterThanOrEqual(100);
    expect(box?.height).toBeGreaterThanOrEqual(60);
  }
  await view.getByRole('button', { name: 'Esc', exact: true }).click();
  await shortcuts
    .getByRole('button', { name: 'Alt + F4', exact: true })
    .click();
  await shortcuts
    .getByRole('button', { name: 'Alt + F4', exact: true })
    .click();
  await shortcuts
    .getByRole('button', { name: 'Win + Tab', exact: true })
    .click();
  await expect(view.getByText('Nenhum programa aberto.')).toBeVisible();
});

async function start(page: Page, activity: string, method: string) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Programas' }).click();
  await page.getByRole('button', { name: new RegExp(activity) }).click();
  await page
    .getByRole('group', { name: 'Método desta atividade' })
    .getByRole('button', { name: method, exact: true })
    .click();
}

test('Métodos mantêm o foco no controle escolhido e a sequência de Tab', async ({
  page,
}) => {
  for (const [activity, methods] of [
    ['Abrir um programa', ['Menu Iniciar', 'Win + S', 'Duplo clique']],
    ['Fechar um programa', ['Botão X', 'Alt + F4', 'Gerenciador de Tarefas']],
    ['Alternar programas', ['Alt + Tab', 'Win + Tab']],
  ] as const) {
    await start(page, activity, methods[0]);
    const picker = page.getByRole('group', { name: 'Método desta atividade' });
    for (let index = 1; index < methods.length; index++) {
      const method = picker.getByRole('button', {
        name: methods[index],
        exact: true,
      });
      await method.press('Enter');
      await expect(method).toBeFocused();
      await expect(method).toHaveAttribute('aria-pressed', 'true');
    }
    await page.keyboard.press('Tab');
    await expect(
      page.locator('summary').filter({ hasText: 'Mostrar dica' }),
    ).toBeFocused();
  }
});

test('Fechar: X encerra a janela e permite repetir', async ({ page }) => {
  await start(page, 'Fechar um programa', 'Botão X');
  await page
    .getByRole('button', { name: 'Fechar Bloco de Notas', exact: true })
    .click();
  await expect(
    page.getByRole('region', { name: 'Janela Bloco de Notas' }),
  ).toHaveCount(0);
  await expect(
    page
      .getByRole('group', { name: 'Barra de tarefas' })
      .getByRole('button', { name: /Bloco de Notas/ }),
  ).toHaveCount(0);
  await expect(page.getByRole('status')).toContainText(
    'Bloco de Notas fechado',
  );
  await page.getByRole('button', { name: 'Concluir atividade' }).click();
  await page.getByRole('button', { name: 'Repetir atividade' }).click();
  await expect(
    page.getByRole('region', { name: 'Janela Bloco de Notas' }),
  ).toBeVisible();
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page
    .getByRole('button', { name: 'Fechar Bloco de Notas', exact: true })
    .click();
  await expect(
    page.getByRole('region', { name: 'Janela Bloco de Notas' }),
  ).toHaveCount(0);
});

test('Fechar: Alt + F4 age somente na janela ativa', async ({ page }) => {
  await start(page, 'Fechar um programa', 'Alt + F4');
  const shortcut = page
    .getByRole('group', { name: 'Atalhos simulados' })
    .getByRole('button', { name: 'Alt + F4', exact: true });
  await page
    .getByRole('button', { name: 'Minimizar Bloco de Notas', exact: true })
    .click();
  await shortcut.click();
  await expect(page.getByRole('status')).toContainText('Nenhuma janela ativa');
  await page
    .getByRole('group', { name: 'Barra de tarefas' })
    .getByRole('button', { name: /Bloco de Notas/ })
    .click();
  await shortcut.press('Enter');
  await expect(
    page.getByRole('region', { name: 'Janela Bloco de Notas' }),
  ).toHaveCount(0);
  await shortcut.click();
  await expect(page.getByRole('status')).toContainText('Nenhuma janela ativa');
  await expect(
    page.getByRole('button', { name: 'Concluir atividade' }),
  ).toBeVisible();
});

test('Fechar: Gerenciador lista janelas reais e confirma programa sem resposta', async ({
  page,
}) => {
  await start(page, 'Fechar um programa', 'Gerenciador de Tarefas');
  await page
    .getByRole('button', { name: 'Ctrl + Shift + Esc', exact: true })
    .click();
  const manager = page.getByRole('region', {
    name: 'Gerenciador de Tarefas',
    exact: true,
  });
  const end = manager.getByRole('button', {
    name: 'Finalizar tarefa',
    exact: true,
  });
  await expect(manager.getByRole('radio')).toHaveCount(2);
  await expect(end).toBeDisabled();
  await manager
    .getByRole('radio', { name: /Bloco de Notas.*Não está respondendo/ })
    .check();
  await end.click();
  const confirm = page.getByRole('dialog', {
    name: 'Finalizar Bloco de Notas?',
  });
  await expect(confirm).toBeVisible();
  await confirm.getByRole('button', { name: 'Cancelar' }).press('Escape');
  await expect(confirm).toHaveCount(0);
  await expect(manager.getByRole('radio')).toHaveCount(2);
  await end.click();
  await confirm.getByRole('button', { name: 'Confirmar finalização' }).click();
  await expect(
    manager.getByRole('heading', { name: 'Gerenciador de Tarefas' }),
  ).toBeFocused();
  await expect(
    page.getByRole('region', { name: 'Janela Bloco de Notas' }),
  ).toHaveCount(0);
  await expect(manager.getByRole('radio')).toHaveCount(1);
  await expect(end).toBeDisabled();
  await expect(page.getByRole('status')).toContainText(
    'Bloco de Notas fechado',
  );
  await manager.getByRole('radio', { name: /Navegador.*Em execução/ }).check();
  await end.click();
  await expect(manager.getByText('Nenhum programa aberto.')).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(
    page
      .getByRole('group', { name: 'Barra de tarefas' })
      .getByRole('button', { name: /Navegador/ }),
  ).toHaveCount(0);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test('Abrir: Menu Iniciar, prefixo, resultados e janela maximizada', async ({
  page,
}) => {
  await start(page, 'Abrir um programa', 'Menu Iniciar');
  await page
    .getByRole('button', { name: 'Iniciar', exact: false })
    .last()
    .click();
  const search = page.getByRole('textbox', { name: 'Pesquisar aplicativos' });
  await expect(search).toBeFocused();
  await page
    .getByRole('button', { name: 'Configurações', exact: true })
    .click();
  await expect(page.getByRole('status').last()).toContainText(
    'não faz parte desta atividade',
  );
  await search.fill('xyz');
  await expect(
    page.getByText('Nenhum programa encontrado.', { exact: false }),
  ).toBeVisible();
  await search.fill('b');
  await expect(
    page.getByRole('button', {
      name: /Bloco de Notas.*Melhor correspondência/,
    }),
  ).toBeVisible();
  await search.fill('na');
  await expect(
    page.getByRole('button', { name: /Navegador.*Melhor correspondência/ }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', {
      name: /Bloco de Notas.*Melhor correspondência/,
    }),
  ).toHaveCount(0);
  await search.fill('BLOCO');
  await page
    .getByRole('button', { name: /Bloco de Notas.*Melhor correspondência/ })
    .click();
  const window = page.getByRole('region', {
    name: 'Janela Bloco de Notas',
    exact: true,
  });
  await expect(window).toContainText('Maximizada');
  await expect(window).toBeFocused();
  await page.getByRole('button', { name: 'Concluir atividade' }).click();
  await expect(
    page.getByRole('heading', { name: 'Atividade concluída' }),
  ).toBeFocused();
  await page.getByRole('button', { name: 'Repetir atividade' }).click();
  await expect(window).toHaveCount(0);
  await page.getByRole('button', { name: 'Voltar à seleção' }).click();
  await page.getByRole('button', { name: 'Início' }).click();
  await expect(
    page.getByRole('heading', { name: 'Aprender na prática' }),
  ).toBeVisible();
});

test('Abrir: Win + S mantém pesquisa disponível e aceita Enter', async ({
  page,
}) => {
  await start(page, 'Abrir um programa', 'Win + S');
  const shortcut = page
    .getByRole('group', { name: 'Atalhos simulados' })
    .getByRole('button', { name: 'Win + S', exact: true });
  await shortcut.press('Enter');
  const search = page.getByRole('textbox', { name: 'Pesquisar aplicativos' });
  await expect(search).toBeFocused();
  await search.fill('bl');
  await shortcut.click();
  await expect(search).toBeFocused();
  await expect(search).toHaveValue('bl');
  await search.press('Enter');
  await expect(
    page.getByRole('region', { name: 'Janela Bloco de Notas' }),
  ).toBeVisible();
  await shortcut.click();
  await expect(search).toBeFocused();
  await search.press('Escape');
  await expect(search).toHaveCount(0);
  await expect(
    page.getByRole('region', { name: 'Janela Bloco de Notas' }),
  ).toBeVisible();
});

test('Abrir: seleção, duplo clique e controles funcionais do Bloco de Notas', async ({
  page,
}) => {
  await start(page, 'Abrir um programa', 'Duplo clique');
  const icons = page.getByRole('group', { name: 'Ícones da área de trabalho' });
  const icon = icons.getByRole('button', { name: 'Bloco de Notas' });
  const window = page.getByRole('region', { name: 'Janela Bloco de Notas' });
  await icon.click();
  await expect(icon).toHaveAttribute('aria-pressed', 'true');
  await expect(icon).toContainText('Selecionado');
  await expect(window).toHaveCount(0);
  await icon.dblclick();
  await expect(window).toContainText('Maximizada');
  await page
    .getByRole('button', { name: 'Restaurar Bloco de Notas', exact: true })
    .click();
  await expect(window).toContainText('Restaurada');
  await page
    .getByRole('button', { name: 'Maximizar Bloco de Notas', exact: true })
    .click();
  await expect(window).toContainText('Maximizada');
  await page
    .getByRole('button', { name: 'Minimizar Bloco de Notas', exact: true })
    .click();
  await expect(window).toBeHidden();
  await page
    .getByRole('group', { name: 'Barra de tarefas' })
    .getByRole('button', { name: /Bloco de Notas/ })
    .click();
  await expect(window).toContainText('Maximizada');
  await page
    .getByRole('button', { name: 'Fechar Bloco de Notas', exact: true })
    .click();
  await expect(window).toHaveCount(0);
  await expect(page.getByRole('status')).toContainText(
    'Bloco de Notas fechado',
  );
  await icon.press('Space');
  await icon.press('Enter');
  await expect(window).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test('Módulo: concluir as três atividades de Programas mostra a tela de módulo concluído', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Programas' }).click();

  await page.getByRole('button', { name: /Abrir um programa/ }).click();
  await page
    .getByRole('group', { name: 'Método desta atividade' })
    .getByRole('button', { name: 'Menu Iniciar', exact: true })
    .click();
  await page
    .getByRole('button', { name: 'Iniciar', exact: false })
    .last()
    .click();
  await page.getByRole('textbox', { name: 'Pesquisar aplicativos' }).fill('bl');
  await page
    .getByRole('button', { name: /Bloco de Notas.*Melhor correspondência/ })
    .click();
  await page.getByRole('button', { name: 'Concluir atividade' }).click();
  await expect(
    page.getByRole('heading', { name: 'Atividade concluída' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Voltar à seleção' }).click();

  await page.getByRole('button', { name: /Fechar um programa/ }).click();
  await page
    .getByRole('group', { name: 'Método desta atividade' })
    .getByRole('button', { name: 'Botão X', exact: true })
    .click();
  await page
    .getByRole('button', { name: 'Fechar Bloco de Notas', exact: true })
    .click();
  await page.getByRole('button', { name: 'Concluir atividade' }).click();
  await expect(
    page.getByRole('heading', { name: 'Atividade concluída' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Voltar à seleção' }).click();

  await page.getByRole('button', { name: /Alternar programas/ }).click();
  await page
    .getByRole('group', { name: 'Método desta atividade' })
    .getByRole('button', { name: 'Alt + Tab', exact: true })
    .click();
  await page
    .getByRole('group', { name: 'Atalhos simulados' })
    .getByRole('button', { name: 'Alt + Tab', exact: true })
    .click();
  const selector = page.getByRole('region', { name: 'Seletor Alt + Tab' });
  const tab = selector.getByRole('button', { name: 'Tab', exact: true });
  await tab.press('Enter');
  await selector.getByRole('button', { name: 'Soltar Alt' }).press('Enter');
  await page.getByRole('button', { name: 'Concluir atividade' }).click();
  await expect(
    page.getByRole('heading', { name: 'Módulo concluído!' }),
  ).toBeFocused();
  await expect(
    page.getByRole('progressbar', {
      name: 'Progresso do módulo Programas',
    }),
  ).toHaveAttribute('aria-valuenow', '3');
  await expect(page.locator('.module-checklist li')).toHaveCount(3);
  await page.getByRole('button', { name: 'Repetir módulo' }).click();
  await expect(
    page.getByRole('heading', {
      name: 'Abrir, fechar e alternar entre programas',
    }),
  ).toBeFocused();
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
          completedActivityIds: ['open-program', 'close-program'],
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
  await page.getByRole('button', { name: 'Programas' }).click();
  await page.getByRole('button', { name: /Alternar programas/ }).click();
  await page
    .getByRole('group', { name: 'Método desta atividade' })
    .getByRole('button', { name: 'Alt + Tab', exact: true })
    .click();
  await page
    .getByRole('group', { name: 'Atalhos simulados' })
    .getByRole('button', { name: 'Alt + Tab', exact: true })
    .click();
  const selector = page.getByRole('region', { name: 'Seletor Alt + Tab' });
  const tab = selector.getByRole('button', { name: 'Tab', exact: true });
  await tab.press('Enter');
  await selector.getByRole('button', { name: 'Soltar Alt' }).press('Enter');
  await page.getByRole('button', { name: 'Concluir atividade' }).click();

  await expect(
    page.getByRole('heading', { name: 'Módulo concluído!' }),
  ).toBeVisible();
  await expect
    .poll(() => completion)
    .toEqual({
      sessionId: progressSessionId,
      activityId: 'switch-program',
    });
  expect(progressSessionId).toMatch(
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
  );
});
