import { test, expect } from '@playwright/test';

test('cliente consegue alugar equipamento com retirada na loja', async ({ page }) => {
  await page.goto('/');
  await page.waitForTimeout(2000);

  // Escolhe o primeiro equipamento do catálogo
  await page.locator('.cartao').first().locator('button').click();
  await page.waitForTimeout(1000);

  // Passo 1: período padrão
  await page.click('text=Continuar');

  // Passo 2: dados do cliente
  await page.fill('#nome', 'Teste QA');
  await page.fill('#cpf', '12345678901');
  await page.fill('#email', 'teste@teste.com');
  await page.click('text=Continuar');
  await page.waitForTimeout(1000);

  // Passo 3: retirada na loja
  await page.selectOption('#data', '2026-11-19');
  await page.click('text=Continuar');
  await page.waitForTimeout(1000);

  // Passo 4: confirma
  await page.check('#termos');
  await page.click('text=Confirmar locação');
  await page.waitForTimeout(2000);

  expect(page.locator('#confirmacao')).toBeTruthy();
  expect(page.locator('h1')).toBeTruthy();
});
