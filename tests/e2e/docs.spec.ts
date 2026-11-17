import { expect, test, type Page } from '@playwright/test';

async function expectDialogFits(page: Page) {
  const dialog = page.getByRole('dialog');
  expect(
    await dialog.evaluate((element) => {
      const box = element.getBoundingClientRect();
      return (
        box.x >= 0 &&
        box.y >= 0 &&
        box.right <= innerWidth &&
        box.bottom <= innerHeight &&
        element.scrollWidth <= element.clientWidth
      );
    }),
  ).toBe(true);
  for (const control of await dialog.locator('input, select, button').all()) {
    await control.scrollIntoViewIfNeeded();
    const box = await control.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.y).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(page.viewportSize()!.width);
    expect(box!.y + box!.height).toBeLessThanOrEqual(
      page.viewportSize()!.height,
    );
  }
}

async function enter(page: Page, activity: string) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Google Docs', exact: true }).click();
  await page.getByRole('button', { name: new RegExp(activity) }).click();
  await expect(
    page.getByRole('heading', { level: 1, name: activity, exact: true }),
  ).toBeFocused();
}
async function exportDocument(page: Page, format = 'PDF') {
  await page
    .getByRole('button', { name: 'Fazer download', exact: true })
    .click();
  await page.getByRole('button', { name: format, exact: true }).click();
  await expect(
    page.getByText('Download concluído!', { exact: true }),
  ).toBeVisible();
}
async function toolsThroughSearch(page: Page) {
  await page
    .getByRole('combobox', { name: 'Zoom', exact: true })
    .selectOption('125');
  await page.getByRole('button', { name: 'Ctrl + F', exact: true }).click();
  await page
    .getByRole('textbox', { name: 'Localizar no documento', exact: true })
    .fill('projeto');
  await page.getByRole('button', { name: 'Continuar', exact: true }).click();
}
async function share(page: Page, permission: string) {
  await page.getByRole('button', { name: 'Compartilhar', exact: true }).click();
  await page.getByLabel('Pessoa ou e-mail').fill('mentora@exemplo.com');
  await page.getByLabel('Permissão').selectOption(permission);
  await page.getByRole('button', { name: 'Enviar', exact: true }).click();
}
test.beforeEach(async ({ page }) => {
  await page.route('http://127.0.0.1:3001/**', (route) => route.abort());
});
test.afterEach(async ({ page }) => {
  expect(await page.pageErrors()).toEqual([]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test('Interface: título diferente, observação de todos os menus, régua e ferramentas antes de concluir', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const posts: unknown[] = [];
  page.on('request', (request) => {
    if (request.method() === 'POST') posts.push(request.postDataJSON());
  });
  await enter(page, 'Conhecer a interface');
  const title = page.getByLabel('Título do documento', { exact: true });
  await expect(title).toHaveValue('Meu projeto Technovation');
  await expect(page.getByRole('tooltip')).toContainText(
    'O título identifica o documento.',
  );
  await page.getByRole('button', { name: 'Continuar', exact: true }).click();
  await expect(page.getByRole('status')).toHaveText(
    'Altere o título para continuar.',
  );
  await title.fill(' ');
  await page.getByRole('button', { name: 'Continuar', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Concluir atividade' }),
  ).toBeDisabled();
  await title.fill('<script>Meu projeto</script>');
  await expect(
    page.getByRole('heading', {
      name: '<script>Meu projeto</script> — Google Docs',
      exact: true,
    }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Continuar', exact: true }).click();
  await expect(page.getByRole('status')).toHaveText('Título alterado!');
  const instruction = page.getByRole('complementary', {
    name: 'Instruções da atividade',
  });
  for (const menu of [
    'Arquivo',
    'Editar',
    'Ver',
    'Inserir',
    'Formatar',
    'Ferramentas',
    'Ajuda',
  ]) {
    await expect(instruction).toContainText(`${menu}:`);
    await expect(page.getByRole('tooltip')).toContainText(`${menu}:`);
    await expect(
      page.getByRole('button', { name: 'Concluir atividade' }),
    ).toBeDisabled();
    await page.getByRole('button', { name: 'Continuar', exact: true }).click();
  }
  await expect(instruction).toContainText(
    'A régua ajuda a ajustar margens, recuos e tabulações.',
  );
  await page.getByRole('button', { name: 'Continuar', exact: true }).click();
  for (const tool of [
    'Desfazer',
    'Refazer',
    'Zoom',
    'Estilos',
    'Fonte',
    'Tamanho',
    'Negrito',
    'Itálico',
    'Sublinhado',
    'Alinhamento',
    'Listas',
  ]) {
    await expect(instruction).toContainText(`${tool}:`);
    await expect(
      page
        .getByRole('group', { name: 'Barra de ferramentas' })
        .getByRole('img', { name: tool, exact: true }),
    ).toBeVisible();
    await expect(page.getByRole('tooltip')).toContainText(`${tool}:`);
    await expect(
      page.getByRole('button', { name: 'Concluir atividade' }),
    ).toBeDisabled();
    await page.getByRole('button', { name: 'Continuar', exact: true }).click();
  }
  await expect(page.getByRole('tooltip')).toHaveCount(0);
  expect(posts).toEqual([]);
  await page.getByRole('button', { name: 'Concluir atividade' }).click();
  await expect(
    page.getByRole('heading', { name: 'Atividade concluída' }),
  ).toBeFocused();
  await expect
    .poll(() => posts)
    .toEqual([{ sessionId: expect.any(String), activityId: 'docs-interface' }]);
  await page
    .getByRole('button', { name: 'Repetir atividade', exact: true })
    .click();
  await expect(title).toHaveValue('Meu projeto Technovation');
  await expect(
    page.getByRole('button', { name: 'Concluir atividade' }),
  ).toBeDisabled();
  expect(errors).toEqual([]);
});

test('Inserção: link corrigível, grade real, célula, galeria e arraste que realmente redimensiona', async ({
  page,
}) => {
  const posts: unknown[] = [];
  page.on('request', (request) => {
    if (request.method() === 'POST') posts.push(request.postDataJSON());
  });
  await enter(page, 'Inserir elementos');
  const paper = page.getByRole('article', {
    name: 'Documento simulado',
    includeHidden: true,
  });
  const linkPosition = await paper
    .getByRole('img', { name: 'Ponto de inserção do link' })
    .evaluate((element) =>
      Array.from(element.parentElement!.children).indexOf(element),
    );
  await page.getByRole('button', { name: 'Link', exact: true }).click();
  let dialog = page.getByRole('dialog', { name: 'Inserir link', exact: true });
  await expectDialogFits(page);
  await expect(
    dialog.getByRole('textbox', { name: 'Texto', exact: true }),
  ).toBeFocused();
  await expect(dialog.getByRole('button', { name: 'Aplicar' })).toBeDisabled();
  await dialog
    .getByRole('textbox', { name: 'Texto', exact: true })
    .fill('<b>Meu link</b>');
  await dialog
    .getByRole('textbox', { name: 'Link', exact: true })
    .fill('javascript:alert(1)');
  await dialog.getByRole('button', { name: 'Aplicar' }).click();
  await expect(dialog.getByRole('alert')).toContainText('Use uma URL válida');
  await expect(
    dialog.getByRole('textbox', { name: 'Link', exact: true }),
  ).toHaveAttribute('aria-invalid', 'true');
  await dialog
    .getByRole('textbox', { name: 'Link', exact: true })
    .fill('https://exemplo.com');
  await page.keyboard.press('Escape');
  await expect(
    page.getByRole('button', { name: 'Link', exact: true }),
  ).toBeFocused();
  await page.getByRole('button', { name: 'Link', exact: true }).click();
  await expect(
    dialog.getByRole('textbox', { name: 'Texto', exact: true }),
  ).toHaveValue('<b>Meu link</b>');
  await dialog.getByRole('button', { name: 'Aplicar' }).click();
  await expect(
    page.getByRole('link', { name: '<b>Meu link</b>', exact: true }),
  ).toHaveAttribute('href', 'https://exemplo.com');
  await expect(page.getByRole('status')).toHaveText('Link inserido.');
  expect(
    await paper
      .getByRole('link', { name: '<b>Meu link</b>', exact: true })
      .evaluate((element) =>
        Array.from(element.parentElement!.parentElement!.children).indexOf(
          element.parentElement!,
        ),
      ),
  ).toBe(linkPosition);
  const tablePosition = await paper
    .getByRole('img', { name: 'Ponto de inserção da tabela' })
    .evaluate((element) =>
      Array.from(element.parentElement!.children).indexOf(element),
    );
  const location = page.url();
  await page
    .getByRole('link', { name: '<b>Meu link</b>', exact: true })
    .click();
  expect(page.url()).toBe(location);
  await page.getByRole('button', { name: 'Tabela', exact: true }).click();
  dialog = page.getByRole('dialog', {
    name: 'Escolher tamanho da tabela',
    exact: true,
  });
  await expectDialogFits(page);
  await expect(
    dialog
      .getByRole('group', { name: 'Dimensões da tabela' })
      .getByRole('button'),
  ).toHaveCount(25);
  await dialog
    .getByRole('button', { name: 'Tabela 2 por 4', exact: true })
    .hover();
  await expect(dialog.getByText('2 × 4', { exact: true })).toBeVisible();
  await dialog
    .getByRole('button', { name: 'Tabela 2 por 4', exact: true })
    .click();
  await expect(dialog.getByRole('status')).toHaveText(
    'Para esta atividade, selecione uma tabela 3 × 3.',
  );
  await expect(
    page.getByRole('button', { name: 'Concluir atividade' }),
  ).toBeDisabled();
  await dialog
    .getByRole('button', { name: 'Tabela 3 por 3', exact: true })
    .press('Enter');
  const table = page.getByRole('table', { name: 'Tabela inserida' });
  await expect(table.getByRole('row')).toHaveCount(3);
  await expect(table.getByRole('cell')).toHaveCount(9);
  expect(
    await table.evaluate((element) =>
      Array.from(element.parentElement!.children).indexOf(element),
    ),
  ).toBe(tablePosition);
  await page.getByLabel('Primeira célula').fill('Ideias <script>');
  await page.getByRole('button', { name: 'Inserir', exact: true }).click();
  await page.getByRole('button', { name: 'Imagem', exact: true }).click();
  dialog = page.getByRole('dialog', { name: 'Galeria de imagens' });
  await expectDialogFits(page);
  await expect(dialog.getByRole('button')).toHaveCount(4);
  await dialog.getByRole('button', { name: 'Cancelar', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Imagem', exact: true }),
  ).toBeFocused();
  await page.getByRole('button', { name: 'Imagem', exact: true }).click();
  await dialog
    .getByRole('button', { name: 'Logo do projeto', exact: true })
    .click();
  const image = page.getByRole('img', {
    name: 'Imagem inserida: Logo do projeto',
    exact: true,
  });
  await expect(image).toBeVisible();
  const handle = page.getByRole('button', { name: 'Redimensionar imagem' });
  await handle.click();
  await expect(
    page.getByRole('button', { name: 'Concluir atividade' }),
  ).toBeDisabled();
  await handle.scrollIntoViewIfNeeded();
  const before = await image.boundingBox();
  const box = await handle.boundingBox();
  if (!before || !box) throw new Error('Imagem ou alça ausente.');
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 - 20, box.y + box.height / 2, {
    steps: 3,
  });
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, {
    steps: 3,
  });
  await page.mouse.up();
  await expect
    .poll(async () => (await image.boundingBox())?.width)
    .toBe(before.width);
  await expect(
    page.getByRole('button', { name: 'Concluir atividade' }),
  ).toBeDisabled();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 - 45, box.y + box.height / 2, {
    steps: 6,
  });
  await page.mouse.up();
  await expect
    .poll(async () => (await image.boundingBox())?.width)
    .not.toBe(before.width);
  expect(posts).toEqual([]);
  await page.getByRole('button', { name: 'Concluir atividade' }).click();
  await expect
    .poll(() => posts)
    .toEqual([
      { sessionId: expect.any(String), activityId: 'docs-insert-elements' },
    ]);
  await page
    .getByRole('button', { name: 'Repetir atividade', exact: true })
    .click();
  await expect(page.getByRole('table')).toHaveCount(0);
  await expect(
    page.getByRole('link', { name: '<b>Meu link</b>', exact: true }),
  ).toHaveCount(0);
});

test('Inserção por teclado: HTTP válido, célula obrigatória, galeria e redimensionamento com setas', async ({
  page,
}) => {
  await enter(page, 'Inserir elementos');
  await page.getByRole('button', { name: 'Link', exact: true }).press('Enter');
  const dialog = page.getByRole('dialog', {
    name: 'Inserir link',
    exact: true,
  });
  await expectDialogFits(page);
  await dialog
    .getByRole('textbox', { name: 'Texto', exact: true })
    .fill('Referência');
  await dialog
    .getByRole('textbox', { name: 'Link', exact: true })
    .fill('http://exemplo.com');
  await dialog.getByRole('button', { name: 'Aplicar' }).press('Enter');
  await page
    .getByRole('button', { name: 'Tabela', exact: true })
    .press('Enter');
  await page
    .getByRole('button', { name: 'Tabela 3 por 3', exact: true })
    .press('Enter');
  await page
    .getByRole('button', { name: 'Inserir', exact: true })
    .press('Enter');
  await expect(
    page.getByRole('button', { name: 'Imagem', exact: true }),
  ).toBeDisabled();
  await page.getByLabel('Primeira célula').fill('Projeto');
  await page
    .getByRole('button', { name: 'Imagem', exact: true })
    .press('Enter');
  for (const name of ['Logo do projeto', 'Tecnologia', 'Ideia'])
    await expect(
      page.getByRole('dialog').getByRole('button', { name, exact: true }),
    ).toBeVisible();
  await page
    .getByRole('button', { name: 'Tecnologia', exact: true })
    .press('Enter');
  const image = page.getByRole('img', {
    name: 'Imagem inserida: Tecnologia',
    exact: true,
  });
  const before = await image.boundingBox();
  await page
    .getByRole('button', { name: 'Redimensionar imagem' })
    .press('ArrowLeft');
  await expect
    .poll(async () => (await image.boundingBox())?.width)
    .not.toBe(before?.width);
  await expect(
    page.getByRole('button', { name: 'Concluir atividade' }),
  ).toBeEnabled();
});

for (const format of ['PDF', 'DOCX', 'TXT']) {
  test(`Exportar ${format}: seleção, progresso e Downloads simulados sem download real`, async ({
    page,
  }) => {
    const clockTime = new Date('2026-01-01T00:00:00Z');
    await page.clock.install({ time: clockTime });
    await page.clock.pauseAt(new Date(clockTime.getTime() + 1000));
    let downloads = 0;
    page.on('download', () => downloads++);
    await enter(page, 'Exportar um documento');
    const location = page.url();
    await page.getByRole('button', { name: 'Arquivo', exact: true }).click();
    await expect(
      page.getByRole('button', { name: 'Fazer download' }),
    ).toHaveCount(0);
    await page.getByRole('button', { name: 'Arquivo', exact: true }).click();
    await page.getByRole('button', { name: 'Fazer download' }).click();
    for (const option of ['PDF', 'DOCX', 'TXT'])
      await expect(
        page.getByRole('button', { name: option, exact: true }),
      ).toBeVisible();
    await page.getByRole('button', { name: format, exact: true }).click();
    await expect(
      page.getByRole('progressbar', { name: 'Progresso da exportação' }),
    ).toHaveAttribute('value', '0');
    await expect(
      page.getByRole('button', { name: 'Concluir atividade' }),
    ).toBeDisabled();
    for (let tick = 0; tick < 4; tick++) await page.clock.runFor(120);
    await expect(
      page.getByText('Download concluído!', { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole('region', { name: 'Exportação simulada' }),
    ).toContainText(`Meu projeto Technovation.${format.toLowerCase()}`);
    await expect(
      page.getByRole('button', { name: 'Concluir atividade' }),
    ).toBeEnabled();
    expect(downloads).toBe(0);
    expect(page.url()).toBe(location);
  });
}

for (const permission of ['Leitor', 'Comentador', 'Editor']) {
  test(`Ferramentas: zoom, busca real, compartilhar como ${permission}, revisar, aplicar título e navegar no sumário`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    const posts: unknown[] = [];
    page.on('request', (request) => {
      if (request.method() === 'POST') posts.push(request.postDataJSON());
    });
    await enter(page, 'Usar ferramentas do editor');
    const paper = page.getByRole('article', {
      name: 'Documento simulado',
      includeHidden: true,
    });
    const before = await paper.evaluate(
      (element) => getComputedStyle(element).fontSize,
    );
    await page
      .getByRole('combobox', { name: 'Zoom', exact: true })
      .selectOption('90');
    await expect(page.getByRole('status')).toHaveText(
      'Zoom alterado para 90%.',
    );
    expect(
      await paper.evaluate((element) =>
        parseFloat(getComputedStyle(element).fontSize),
      ),
    ).toBeGreaterThanOrEqual(14);
    expect(
      await paper.evaluate((element) =>
        parseFloat(getComputedStyle(element).fontSize),
      ),
    ).toBeLessThan(parseFloat(before));
    await page
      .getByRole('combobox', { name: 'Zoom', exact: true })
      .selectOption('125');
    expect(
      await paper.evaluate((element) => getComputedStyle(element).fontSize),
    ).not.toBe(before);
    await page.getByRole('button', { name: 'Ctrl + F' }).click();
    let dialog = page.getByRole('dialog', {
      name: 'Localizar no documento',
      exact: true,
    });
    await expectDialogFits(page);
    await expect(dialog.getByRole('textbox')).toBeFocused();
    await dialog.getByRole('textbox').fill('inexistente');
    await expect(dialog.getByRole('status')).toHaveText('0 ocorrências');
    await expect(
      dialog.getByRole('button', { name: 'Continuar' }),
    ).toBeDisabled();
    await dialog.getByRole('textbox').fill('comunidade');
    await expect(dialog.getByRole('status')).toHaveText('2 ocorrências');
    await dialog.getByRole('textbox').fill('tecnlogia');
    await expect(dialog.getByRole('status')).toHaveText('1 ocorrência');
    for (const phrase of ['a tecnlogia', 'tecnlogia ajuda', 'tecn', 'logia']) {
      await dialog.getByRole('textbox').fill(phrase);
      await expect(dialog.getByRole('status')).toHaveText('1 ocorrência');
      const marks = paper.locator('mark');
      await expect(marks).toHaveCount(1);
      await expect(marks).toHaveText(new RegExp(phrase, 'i'));
      expect(
        await marks
          .locator('span')
          .evaluateAll((elements) =>
            elements.some(
              (element) =>
                getComputedStyle(element).textDecorationStyle === 'wavy',
            ),
          ),
      ).toBe(true);
    }
    await dialog.getByRole('textbox').fill('PROJETO');
    await expect(dialog.getByRole('status')).toHaveText('2 ocorrências');
    await dialog.getByRole('button', { name: 'Continuar' }).click();
    await expect(paper.locator('mark')).toHaveCount(2);
    await page
      .getByRole('button', { name: 'Compartilhar', exact: true })
      .click();
    dialog = page.getByRole('dialog', {
      name: 'Compartilhar documento',
      exact: true,
    });
    await expectDialogFits(page);
    await expect(dialog.getByLabel('Pessoa ou e-mail')).toBeFocused();
    await dialog.getByLabel('Permissão').selectOption(permission);
    await dialog.getByLabel('Pessoa ou e-mail').fill('errado');
    await dialog.getByRole('button', { name: 'Enviar', exact: true }).click();
    await expect(dialog.getByRole('alert')).toContainText(
      'Digite um e-mail válido',
    );
    await dialog.getByLabel('Pessoa ou e-mail').fill('mentora@exemplo.com');
    await page.keyboard.press('Escape');
    await expect(
      page.getByRole('button', { name: 'Compartilhar', exact: true }),
    ).toBeFocused();
    await page
      .getByRole('button', { name: 'Compartilhar', exact: true })
      .click();
    await expect(dialog.getByLabel('Permissão')).toHaveValue(permission);
    await expect(dialog.getByLabel('Pessoa ou e-mail')).toHaveValue(
      'mentora@exemplo.com',
    );
    await dialog.getByRole('button', { name: 'Enviar', exact: true }).click();
    await expect(
      page.getByText('Compartilhado', { exact: true }),
    ).toBeVisible();
    await expect(page.getByRole('status')).toHaveText('Convite enviado!');
    await page
      .getByRole('button', { name: 'Ferramentas', exact: true })
      .click();
    await page.getByRole('button', { name: 'Ortografia e gramática' }).click();
    dialog = page.getByRole('dialog', { name: 'Revisão ortográfica' });
    await expectDialogFits(page);
    await expect(dialog).toContainText('Sugestão: tecnologia');
    await dialog.getByRole('button', { name: 'Ignorar', exact: true }).click();
    await expect(paper.getByText('tecnlogia', { exact: true })).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Concluir atividade' }),
    ).toBeDisabled();
    await page.getByRole('button', { name: 'Ortografia e gramática' }).click();
    await dialog.getByRole('button', { name: 'Aceitar', exact: true }).click();
    await expect(paper.getByText('tecnologia', { exact: true })).toBeVisible();
    await expect(paper.getByText('tecnlogia', { exact: true })).toHaveCount(0);
    await expect(
      page.getByRole('combobox', { name: 'Estilo do parágrafo' }),
    ).toBeDisabled();
    await expect(page.getByRole('complementary')).toContainText(
      'Subtítulo organiza níveis abaixo do título.',
    );
    await expect(page.getByRole('tooltip')).toContainText(
      'Título identifica seções principais',
    );
    await page.getByRole('button', { name: 'Continuar', exact: true }).click();
    await expect(
      page.getByRole('combobox', { name: 'Estilo do parágrafo' }),
    ).toBeDisabled();
    await paper
      .getByRole('button', { name: 'Solução para a comunidade', exact: true })
      .click();
    await page
      .getByRole('combobox', { name: 'Estilo do parágrafo' })
      .selectOption('Subtítulo');
    await expect(page.getByRole('status')).toHaveText(
      'Nesta etapa, escolha Título para destacar o parágrafo selecionado.',
    );
    await expect(
      paper.getByRole('button', {
        name: 'Solução para a comunidade',
        exact: true,
      }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Concluir atividade' }),
    ).toBeDisabled();
    await page
      .getByRole('combobox', { name: 'Estilo do parágrafo' })
      .selectOption('Título');
    await expect(
      paper.getByRole('heading', {
        name: 'Solução para a comunidade',
        exact: true,
      }),
    ).toBeVisible();
    const tocPosition = await paper
      .getByRole('img', { name: 'Ponto de inserção do sumário' })
      .evaluate((element) =>
        Array.from(element.parentElement!.children).indexOf(element),
      );
    await page.getByRole('button', { name: 'Inserir', exact: true }).click();
    await page.getByRole('button', { name: 'Índice', exact: true }).click();
    const toc = page.getByRole('navigation', { name: 'Sumário do documento' });
    expect(
      await toc.evaluate((element) =>
        Array.from(element.parentElement!.children).indexOf(element),
      ),
    ).toBe(tocPosition);
    await expect(toc.getByRole('link')).toHaveCount(2);
    await toc
      .getByRole('link', { name: 'Solução para a comunidade', exact: true })
      .click();
    await expect(
      paper.getByRole('heading', {
        name: 'Solução para a comunidade',
        exact: true,
      }),
    ).toBeFocused();
    expect(posts).toEqual([]);
    await page.getByRole('button', { name: 'Concluir atividade' }).click();
    await expect
      .poll(() => posts)
      .toEqual([{ sessionId: expect.any(String), activityId: 'docs-tools' }]);
    expect(errors).toEqual([]);
  });
}

test('Progresso: restauração tardia, resumo só 4/4, repetição e documento efêmero', async ({
  page,
}) => {
  let restore!: () => void;
  const pending = new Promise<void>((resolve) => {
    restore = resolve;
  });
  const posts: unknown[] = [];
  let sessionId: string | null = null;
  await page.route('http://127.0.0.1:3001/**', async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname === '/progress') {
      sessionId = url.searchParams.get('sessionId');
      await pending;
      await route.fulfill({
        json: {
          completedActivityIds: [
            'docs-interface',
            'docs-insert-elements',
            'docs-tools',
          ],
        },
      });
    } else {
      posts.push(route.request().postDataJSON());
      await route.fulfill({ json: { ok: true } });
    }
  });
  await enter(page, 'Exportar um documento');
  await exportDocument(page);
  expect(posts).toEqual([]);
  await page.getByRole('button', { name: 'Concluir atividade' }).click();
  await expect(
    page.getByRole('heading', { name: 'Atividade concluída' }),
  ).toBeFocused();
  await expect(
    page.getByRole('button', { name: 'Ver resumo do módulo' }),
  ).toHaveCount(0);
  restore();
  await expect(
    page.getByRole('button', { name: 'Ver resumo do módulo' }),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Repetir atividade', exact: true })
    .click();
  await expect(page.getByRole('progressbar')).toHaveCount(0);
  await exportDocument(page, 'TXT');
  await page.getByRole('button', { name: 'Concluir atividade' }).click();
  await page.getByRole('button', { name: 'Ver resumo do módulo' }).click();
  await expect(
    page.getByRole('heading', { name: 'Módulo concluído!' }),
  ).toBeFocused();
  await expect(page.getByText('4 de 4', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Repetir módulo' }).click();
  await expect(
    page.getByRole('button').filter({ hasText: '✓ Concluída' }),
  ).toHaveCount(4);
  await expect
    .poll(() => posts)
    .toEqual([
      { sessionId, activityId: 'docs-export' },
      { sessionId, activityId: 'docs-export' },
    ]);
  await page.getByRole('button', { name: /Conhecer a interface/ }).click();
  await page.getByLabel('Título do documento').fill('Nome temporário');
  await page.getByRole('button', { name: 'Voltar à seleção' }).click();
  await page.getByRole('button', { name: 'Início' }).click();
  await page.getByRole('button', { name: 'Google Docs', exact: true }).click();
  await expect(
    page.getByRole('button').filter({ hasText: '✓ Concluída' }),
  ).toHaveCount(3);
  await page.getByRole('button', { name: /Conhecer a interface/ }).click();
  await expect(page.getByLabel('Título do documento')).toHaveValue(
    'Meu projeto Technovation',
  );
});

test('API e storage indisponíveis não bloqueiam a simulação nem enviam conteúdo de compartilhamento', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.addInitScript(() => {
    for (const key of ['localStorage', 'sessionStorage'])
      Object.defineProperty(window, key, {
        get() {
          throw new DOMException('Storage bloqueado', 'SecurityError');
        },
      });
  });
  await enter(page, 'Usar ferramentas do editor');
  await toolsThroughSearch(page);
  await share(page, 'Editor');
  await page.getByRole('button', { name: 'Voltar à seleção' }).click();
  await page.getByRole('button', { name: /Exportar um documento/ }).click();
  await exportDocument(page);
  await page.getByRole('button', { name: 'Concluir atividade' }).click();
  await expect(
    page.getByRole('heading', { name: 'Atividade concluída' }),
  ).toBeFocused();
  expect(errors).toEqual([]);
});
