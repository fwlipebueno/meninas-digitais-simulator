import { expect, test } from '@playwright/test';

test('apresenta os quatro módulos, seu estado e acesso por teclado', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await expect(page).toHaveTitle(/Simulador de informática básica/);
  await expect(
    page.getByRole('heading', { name: 'Aprender na prática' }),
  ).toBeVisible();
  const modules = page.getByRole('region', { name: 'Módulos de aprendizagem' });
  await expect(modules.getByRole('listitem')).toHaveCount(4);
  for (const name of ['Programas', 'Arquivos', 'E-mail', 'Google Docs']) {
    await expect(
      modules.getByRole('heading', { name, exact: true }),
    ).toBeVisible();
  }
  await expect(
    modules.getByText(
      'As atividades ainda não estão disponíveis nesta versão.',
    ),
  ).toBeVisible();
  await expect(
    page.getByRole('img', { name: 'Meninas Digitais UTFPR-CP' }),
  ).toBeVisible();
  await page.keyboard.press('Tab');
  await expect(
    page.getByRole('link', { name: 'Ir para o conteúdo' }),
  ).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('main')).toBeFocused();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
});
