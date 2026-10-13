import { expect, test } from '@playwright/test';

for (const module of ['Programas', 'Arquivos']) {
  test(`Progresso completo restaurado em ${module} permanece repetível`, async ({
    page,
  }) => {
    await page.route('http://127.0.0.1:3001/**', (route) =>
      route.fulfill({
        json: {
          completedActivityIds: [
            'open-program',
            'close-program',
            'switch-program',
            'new-file',
            'save-file',
            'rename-file',
            'delete-file',
          ],
        },
      }),
    );
    await page.goto('/');
    await page.getByRole('button', { name: module, exact: true }).click();
    const count = module === 'Programas' ? 3 : 4;
    await expect(
      page.getByRole('button').filter({ hasText: '✓ Concluída' }),
    ).toHaveCount(count);
    const activity =
      module === 'Programas' ? 'Fechar um programa' : 'Criar um documento';
    await page.getByRole('button', { name: new RegExp(activity) }).click();
    for (let repetition = 0; repetition < 2; repetition++) {
      if (module === 'Programas')
        await page
          .getByRole('button', { name: 'Fechar Bloco de Notas', exact: true })
          .click();
      else {
        await page
          .getByRole('button', { name: 'Arquivo', exact: true })
          .click();
        await page.getByRole('button', { name: 'Novo', exact: true }).click();
      }
      await page.getByRole('button', { name: 'Concluir atividade' }).click();
      await expect(
        page.getByRole('heading', { name: 'Atividade concluída' }),
      ).toBeFocused();
      await expect(
        page.getByRole('button', { name: 'Voltar à seleção', exact: true }),
      ).toBeVisible();
      if (repetition === 0)
        await page
          .getByRole('button', { name: 'Repetir atividade', exact: true })
          .click();
    }
    await page.getByRole('button', { name: 'Ver resumo do módulo' }).click();
    await expect(
      page.getByRole('heading', { name: 'Módulo concluído!' }),
    ).toBeFocused();
    await page.getByRole('button', { name: 'Repetir módulo' }).click();
    await expect(
      page.getByRole('button').filter({ hasText: '✓ Concluída' }),
    ).toHaveCount(count);
  });
}

for (const failure of ['read', 'write'] as const) {
  test(`Storage indisponível (${failure}) e API offline preservam os dois módulos e o UUID`, async ({
    page,
  }) => {
    const errors: string[] = [];
    const sessionIds: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.addInitScript((failure) => {
      if (failure === 'read') {
        Object.defineProperty(window, 'sessionStorage', {
          get() {
            throw new DOMException('Storage bloqueado', 'SecurityError');
          },
        });
      } else {
        Object.defineProperty(Storage.prototype, 'setItem', {
          value() {
            throw new DOMException('Storage cheio', 'QuotaExceededError');
          },
        });
      }
    }, failure);
    await page.route('http://127.0.0.1:3001/**', async (route) => {
      const url = new URL(route.request().url());
      if (url.pathname === '/progress')
        sessionIds.push(url.searchParams.get('sessionId')!);
      else if (url.pathname === '/completions')
        sessionIds.push(
          (route.request().postDataJSON() as { sessionId: string }).sessionId,
        );
      await route.abort();
    });
    await page.goto('/');
    for (const module of ['Programas', 'Arquivos']) {
      await page.getByRole('button', { name: module, exact: true }).click();
      const activity =
        module === 'Programas' ? 'Fechar um programa' : 'Criar um documento';
      await page.getByRole('button', { name: new RegExp(activity) }).click();
      for (let repetition = 0; repetition < 2; repetition++) {
        if (module === 'Programas')
          await page
            .getByRole('button', { name: 'Fechar Bloco de Notas', exact: true })
            .click();
        else {
          await page
            .getByRole('button', { name: 'Arquivo', exact: true })
            .click();
          await page.getByRole('button', { name: 'Novo', exact: true }).click();
        }
        await page.getByRole('button', { name: 'Concluir atividade' }).click();
        await expect(
          page.getByRole('heading', { name: 'Atividade concluída' }),
        ).toBeFocused();
        if (repetition === 0)
          await page
            .getByRole('button', { name: 'Repetir atividade', exact: true })
            .click();
      }
      await page
        .getByRole('button', { name: 'Voltar à seleção', exact: true })
        .click();
      await expect(
        page.getByRole('button', { name: new RegExp(activity) }),
      ).toContainText('✓ Concluída');
      await page.getByRole('button', { name: 'Início' }).click();
    }
    await expect.poll(() => sessionIds.length).toBe(6);
    expect(new Set(sessionIds).size).toBe(1);
    expect(sessionIds[0]).toMatch(/^[0-9a-f-]{36}$/i);
    expect(errors).toEqual([]);
  });
}

test('Progresso restaurado tardio se une à conclusão local sem apagar a repetição', async ({
  page,
}) => {
  let restore!: () => void;
  const pending = new Promise<void>((resolve) => {
    restore = resolve;
  });
  await page.route('http://127.0.0.1:3001/**', async (route) => {
    if (new URL(route.request().url()).pathname === '/progress') {
      await pending;
      await route.fulfill({
        json: { completedActivityIds: ['save-file', 'rename-file'] },
      });
    } else await route.fulfill({ json: { ok: true } });
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Arquivos', exact: true }).click();
  await page.getByRole('button', { name: /Criar um documento/ }).click();
  await page.getByRole('button', { name: 'Arquivo', exact: true }).click();
  await page.getByRole('button', { name: 'Novo', exact: true }).click();
  await page.getByRole('button', { name: 'Concluir atividade' }).click();
  await page
    .getByRole('button', { name: 'Repetir atividade', exact: true })
    .click();
  restore();
  await page.getByRole('button', { name: 'Voltar à seleção' }).click();
  await expect(
    page.getByRole('button').filter({ hasText: '✓ Concluída' }),
  ).toHaveCount(3);
  await expect(
    page.getByRole('button', { name: /Excluir um arquivo/ }),
  ).not.toContainText('✓ Concluída');
});
