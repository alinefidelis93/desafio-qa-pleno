import { test, expect } from '@playwright/test';

test.describe('Catálogo', () => {
  test('deve exibir os equipamentos com os preços corretos por loja', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(2000);

    const cards = page.locator('.cartao');
    expect(await cards.count()).toBeGreaterThan(0);
    await expect(cards.first()).toContainText('R$');
  });

  test('deve exibir equipamento indisponível na loja', async ({ page }) => {
    await page.goto('/');
    await page.selectOption('#loja', 'L02');
    await page.waitForTimeout(2000);

    await expect(page.locator('.cartao:nth-child(8) button')).toBeDisabled();
  });
});
