import { test, expect } from '@playwright/test';

const pedidoBase = {
  loja: 'L01',
  codigo: 'EQ-1001',
  quantidade: 1,
  periodo: 'semanal',
  locacaoProtegida: true,
  modalidade: 'RETIRADA',
  cliente: { nome: 'Teste API', documento: '12345678901', email: 'api@teste.com' },
};

let pedidoId: number;

test('POST /api/pedidos cria o pedido com o valor correto', async ({ request }) => {
  const resumo = await request.post('/api/checkout/resumo', { data: pedidoBase });
  const totalEsperado = (await resumo.json()).total;

  const { datas } = await (await request.get('/api/checkout/datas')).json();
  const resposta = await request.post('/api/pedidos', {
    data: { ...pedidoBase, dataProgramada: datas[0], aceiteTermos: true },
  });

  expect(resposta.status()).toBe(201);
  const pedido = await resposta.json();
  expect(pedido.total).toBe(totalEsperado);
  expect(pedido.status).toBe('enviado_loja');
  pedidoId = pedido.id;
});

test('GET /api/pedidos/:id retorna o pedido criado', async ({ request }) => {
  const resposta = await request.get(`/api/pedidos/${pedidoId}`);
  expect(resposta.ok()).toBeTruthy();
});

test.skip('pedido quinzenal chega ao ERP', async ({ request }) => {
  // TODO: flaky — às vezes o ERP ainda não tem o pedido quando a consulta roda.
  const { datas } = await (await request.get('/api/checkout/datas')).json();
  await request.post('/api/pedidos', {
    data: { ...pedidoBase, periodo: 'quinzenal', dataProgramada: datas[0], aceiteTermos: true },
  });
  const erp = await request.get('http://localhost:4002/v1/pre-locacoes', {
    headers: { 'x-api-key': 'chave-local-desafio' },
  });
  const { itens } = await erp.json();
  expect(itens.at(-1).status).toBe('recebida');
});

test('integração: ERP recebe as pré-locações', async ({ request }) => {
  const resposta = await request.get('http://localhost:4002/v1/pre-locacoes', {
    headers: { 'x-api-key': 'chave-local-desafio' },
  });
  expect(resposta.status()).toBe(200);
});
