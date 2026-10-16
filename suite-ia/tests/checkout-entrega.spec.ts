import { test, expect } from '@playwright/test';

test('cliente consegue receber o equipamento no endereço com frete', async ({ page }) => {
  await page.goto('/');
  await page.waitForTimeout(2000);

  await page.locator('.cartao').first().locator('button').click();
  await page.waitForTimeout(1000);
  await page.click('text=Continuar');

  await page.fill('#nome', 'Teste QA');
  await page.fill('#cpf', '12345678901');
  await page.fill('#email', 'teste@teste.com');
  await page.click('text=Continuar');
  await page.waitForTimeout(1000);

  // Passo 3: entrega no endereço
  await page.check('input[value="ENTREGA"]');
  await page.click('#abrir-endereco');
  await page.fill('#cep', '01310100');
  await page.fill('#logradouro', 'Avenida Paulista');
  await page.fill('#numero', '1000');
  await page.fill('#cidade', 'São Paulo');
  await page.fill('#uf', 'SP');
  await page.click('#salvar-endereco');
  await page.waitForTimeout(1500);

  // Após salvar o endereço o fluxo avança para o resumo com o frete calculado ✅
  await expect(page).toHaveURL(/resumo/);
  await expect(page.locator('#valor-frete')).toBeVisible();

  await page.check('#termos');
  await page.click('text=Confirmar locação');
  await page.waitForTimeout(2000);

  await expect(page.locator('#confirmacao')).toContainText('enviado para a loja');
});
