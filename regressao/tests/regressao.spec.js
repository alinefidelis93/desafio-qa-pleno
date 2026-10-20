'use strict';

const { test, expect } = require('@playwright/test');

const CHAVE_ERP = 'chave-local-desafio';

function urlErp(testInfo) {
  return testInfo.project.name === 'v1'
    ? 'http://127.0.0.1:4001'
    : 'http://127.0.0.1:4002';
}

async function resetar(request) {
  const resposta = await request.post('/_reset');
  expect(resposta.ok()).toBeTruthy();
}

async function datasPermitidas(request) {
  const resposta = await request.get('/api/checkout/datas?loja=L01');
  expect(resposta.ok()).toBeTruthy();

  const dados = await resposta.json();
  expect(dados.datas.length).toBeGreaterThan(0);
  return dados.datas;
}

async function payloadPedido(request, ajustes = {}) {
  const datas = await datasPermitidas(request);

  return {
    loja: 'L01',
    codigo: 'EQ-1001',
    quantidade: 1,
    periodo: 'semanal',
    locacaoProtegida: false,
    modalidade: 'RETIRADA',
    cliente: {
      nome: 'Cliente Teste QA',
      documento: '12345678901',
      email: 'qa@example.com',
    },
    dataProgramada: datas[0],
    aceiteTermos: true,
    ...ajustes,
  };
}

async function textoCaixaErp(request, testInfo) {
  const resposta = await request.get(
    `${urlErp(testInfo)}/v1/pre-locacoes`,
    { headers: { 'x-api-key': CHAVE_ERP } },
  );

  expect(resposta.ok()).toBeTruthy();
  return resposta.text();
}

test.beforeEach(async ({ request }) => {
  await resetar(request);
});

test('API — versão e data de referência fixa', async ({ request }, testInfo) => {
  const resposta = await request.get('/api/versao');

  expect(resposta.status()).toBe(200);

  const dados = await resposta.json();
  expect(dados.versao).toBe(testInfo.project.name);
  expect(dados.hoje).toBe('2026-10-19');
});

test('API — período sem preço não deve estar disponível e estoque zero não deve permitir locação', async ({ request }, testInfo) => {
  test.fail(testInfo.project.name === "v2", "BUG-005: fallback de preço em período sem cadastro.");
  const respostaL01 = await request.get('/api/catalogo?loja=L01');
  expect(respostaL01.ok()).toBeTruthy();

  const catalogoL01 = await respostaL01.json();
  const andaimeL01 = catalogoL01.itens.find((item) => item.codigo === 'EQ-1003');

  expect(andaimeL01).toBeTruthy();
  expect(andaimeL01.precos.diario).toBeNull();
  expect(andaimeL01.periodosDisponiveis).not.toContain('diario');

  const respostaL02 = await request.get('/api/catalogo?loja=L02');
  expect(respostaL02.ok()).toBeTruthy();

  const catalogoL02 = await respostaL02.json();
  const lavadoraL02 = catalogoL02.itens.find((item) => item.codigo === 'EQ-1008');

  expect(lavadoraL02).toBeTruthy();
  expect(lavadoraL02.estoque).toBe(0);
  expect(lavadoraL02.disponivel).toBe(false);
});

test('API — resumo de retirada calcula subtotal, proteção e total', async ({ request }) => {
  const resposta = await request.post('/api/checkout/resumo', {
    data: {
      loja: 'L01',
      codigo: 'EQ-1001',
      quantidade: 1,
      periodo: 'semanal',
      locacaoProtegida: true,
      modalidade: 'RETIRADA',
    },
  });

  expect(resposta.status()).toBe(200);

  const resumo = await resposta.json();
  expect(resumo.subtotalEquipamentos).toBe(359.60);
  expect(resumo.valorLocacaoProtegida).toBe(35.96);
  expect(resumo.taxaEntrega).toBe(0);
  expect(resumo.total).toBe(395.56);
});

test('Integração — pedido semanal é registrado na caixa de entrada do ERP', async ({ request }, testInfo) => {
  const payload = await payloadPedido(request);
  const respostaPedido = await request.post('/api/pedidos', { data: payload });

  expect(respostaPedido.status()).toBe(201);

  const pedido = await respostaPedido.json();
  expect(pedido.status).toBe('enviado_loja');

  await expect.poll(
    () => textoCaixaErp(request, testInfo),
    { timeout: 7000, intervals: [100, 250, 500, 1000] },
  ).toContain('"SEMANAL"');

  const caixa = await textoCaixaErp(request, testInfo);
  expect(caixa).toContain('"RETIRADA"');
  expect(caixa).toContain('"EQ-1001"');
});

test('BUG-001 — ERP deve receber o período quinzenal como QUINZENAL', async ({ request }, testInfo) => {
  test.fail(
    testInfo.project.name === 'v2',
    'Falha esperada na v2: o mapeamento envia QUINZENA em vez de QUINZENAL.',
  );

  const payload = await payloadPedido(request, { periodo: 'quinzenal' });
  const respostaPedido = await request.post('/api/pedidos', { data: payload });

  expect(respostaPedido.status()).toBe(201);

  await expect.poll(
    () => textoCaixaErp(request, testInfo),
    { timeout: 7000, intervals: [100, 250, 500, 1000] },
  ).toContain('"QUINZENAL"');
});

test('BUG-002 — Locação Protegida não deve incidir sobre o frete', async ({ request }, testInfo) => {
  test.skip(testInfo.project.name !== 'v2', 'Entrega é funcionalidade exclusiva da v2.');
  test.fail(true, 'Falha esperada na v2: o cálculo inclui o frete na base da proteção.');

  const respostaFrete = await request.get('/api/checkout/frete?loja=L01');
  expect(respostaFrete.ok()).toBeTruthy();

  const { opcoes } = await respostaFrete.json();
  const freteNormal = opcoes.find((opcao) => Number(opcao.valor) === 35);

  expect(freteNormal).toBeTruthy();

  const respostaResumo = await request.post('/api/checkout/resumo', {
    data: {
      loja: 'L01',
      codigo: 'EQ-1001',
      quantidade: 1,
      periodo: 'semanal',
      locacaoProtegida: true,
      modalidade: 'ENTREGA',
      freteId: freteNormal.id,
    },
  });

  expect(respostaResumo.status()).toBe(200);

  const resumo = await respostaResumo.json();
  expect(resumo.subtotalEquipamentos).toBe(359.60);
  expect(resumo.taxaEntrega).toBe(35);
  expect(resumo.valorLocacaoProtegida).toBe(35.96);
  expect(resumo.total).toBe(430.56);
});

test('BUG-003 — loja L03 não deve oferecer opções de entrega', async ({ request }, testInfo) => {
  test.skip(testInfo.project.name !== 'v2', 'Entrega é funcionalidade exclusiva da v2.');
  test.fail(true, 'Falha esperada na v2: a loja sem tabela recebe frete padrão indevido.');

  const resposta = await request.get('/api/checkout/frete?loja=L03');
  expect(resposta.ok()).toBeTruthy();

  const dados = await resposta.json();
  expect(dados.opcoes).toEqual([]);
});

test('BUG-004 — pedido rejeitado pelo ERP não pode continuar como enviado à loja', async ({ request }, testInfo) => {
  test.skip(testInfo.project.name !== 'v2', 'O comportamento assíncrono investigado está na v2.');
  test.fail(true, 'Falha esperada na v2: o status é confirmado antes do resultado da integração.');

  const payload = await payloadPedido(request, { periodo: 'quinzenal' });
  const respostaPedido = await request.post('/api/pedidos', { data: payload });

  expect(respostaPedido.status()).toBe(201);

  const pedidoCriado = await respostaPedido.json();

  // Aguarda a tentativa de integração aparecer no ERP.
  await expect.poll(
    () => textoCaixaErp(request, testInfo),
    { timeout: 7000, intervals: [100, 250, 500, 1000] },
  ).toContain('"QUINZENA"');

  const respostaConsulta = await request.get(`/api/pedidos/${pedidoCriado.id}`);
  expect(respostaConsulta.ok()).toBeTruthy();

  const pedidoAtualizado = await respostaConsulta.json();
  expect(pedidoAtualizado.status).toBe('falha_integracao');
});

test('E2E — checkout completo por retirada confirma os valores e envia ao ERP', async ({ page, request }, testInfo) => {
  await page.goto('/');

  // Isola a sessão do navegador e força a loja usada pelo cenário.
  await page.evaluate(() => {
    localStorage.setItem('loja', 'L01');
    sessionStorage.clear();
  });
  await page.reload();

  await page.locator('.cartao[data-codigo="EQ-1001"] button').click();

  await page.locator('input[name="periodo"][value="semanal"]').check();
  await page.locator('#quantidade').fill('1');
  await page.locator('#locacao-protegida').check();
  await page.locator('#form-periodo button[type="submit"]').click();

  await page.locator('#nome').fill('Cliente Teste QA');
  await page.locator('#cpf').fill('12345678901');
  await page.locator('#email').fill('qa@example.com');
  await page.locator('#form-dados button[type="submit"]').click();

  await page.locator('#data').selectOption({ index: 0 });
  await page.locator('#form-receber button[type="submit"]').click();

  await expect(page.locator('#valor-equipamentos')).toContainText('359,60');
  await expect(page.locator('#valor-lp')).toContainText('35,96');
  await expect(page.locator('#valor-total')).toContainText('395,56');

  await page.locator('#termos').check();
  await page.locator('#form-resumo button[type="submit"]').click();

  await expect(page.locator('#confirmacao h1')).toContainText('enviado para a loja');
  await expect(page.locator('#confirmacao')).toContainText('395,56');

  await expect.poll(
    () => textoCaixaErp(request, testInfo),
    { timeout: 7000, intervals: [100, 250, 500, 1000] },
  ).toContain('"SEMANAL"');
});
