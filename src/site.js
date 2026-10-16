'use strict';

const http = require('http');
const path = require('path');
const { json, lerCorpo, arquivo } = require('./http');

const PUBLICO = path.join(__dirname, '..', 'public');

function criarSite(ctx) {
  const { versao } = ctx;

  async function lojasComEntrega() {
    const lojas = await ctx.erp.lojas();
    return lojas.map((l) => ({ ...l, entrega: ctx.frete.lojaFazEntrega(l.codLoja) }));
  }

  async function exigirLoja(codLoja) {
    const lojas = await ctx.erp.lojas();
    return lojas.find((l) => l.codLoja === codLoja) || null;
  }

  async function tratar(req, res) {
    const url = new URL(req.url, 'http://localhost');
    const rota = `${req.method} ${url.pathname}`;

    if (rota === 'GET /') return arquivo(res, path.join(PUBLICO, versao, 'index.html'));
    if (rota === 'GET /app.js') return arquivo(res, path.join(PUBLICO, versao, 'app.js'));
    if (rota === 'GET /style.css') return arquivo(res, path.join(PUBLICO, 'comum', 'style.css'));

    if (rota === 'GET /api/versao') {
      return json(res, 200, { versao, hoje: ctx.hoje(), entrega: versao !== 'v1' });
    }

    if (rota === 'GET /api/lojas') return json(res, 200, { itens: await lojasComEntrega() });

    if (rota === 'GET /api/catalogo') {
      const loja = await exigirLoja(url.searchParams.get('loja'));
      if (!loja) return json(res, 404, { erro: 'Loja não encontrada' });
      const itens = await ctx.catalogo.listar(ctx.erp, loja.codLoja);
      return json(res, 200, { loja: { codLoja: loja.codLoja, nome: loja.nome }, itens });
    }

    if (rota === 'GET /api/checkout/datas') {
      const hoje = ctx.hoje();
      return json(res, 200, { hoje, datas: ctx.calendario.datasPermitidas(hoje) });
    }

    if (rota === 'GET /api/checkout/frete' && versao !== 'v1') {
      const loja = await exigirLoja(url.searchParams.get('loja'));
      if (!loja) return json(res, 404, { erro: 'Loja não encontrada' });
      return json(res, 200, { opcoes: ctx.frete.opcoes(loja.codLoja) });
    }

    if (rota === 'POST /api/checkout/resumo') {
      return json(res, 200, await ctx.checkout.resumo(ctx, await lerCorpo(req)));
    }

    if (rota === 'POST /api/pedidos') {
      return json(res, 201, await ctx.checkout.criarPedido(ctx, await lerCorpo(req)));
    }

    if (rota === 'GET /api/pedidos') {
      return json(res, 200, { total: ctx.store.pedidos.length, itens: ctx.store.pedidos });
    }

    const detalhe = rota.match(/^GET \/api\/pedidos\/(\d+)$/);
    if (detalhe) {
      const pedido = ctx.store.pedidos.find((p) => p.id === Number(detalhe[1]));
      if (!pedido) return json(res, 404, { erro: 'Pedido não encontrado' });
      return json(res, 200, pedido);
    }

    if (rota === 'POST /_reset') {
      ctx.resetar();
      return json(res, 200, { ok: true });
    }

    return json(res, 404, { erro: 'Rota não encontrada' });
  }

  return http.createServer((req, res) => {
    tratar(req, res).catch((erro) => {
      const status = erro.status || 500;
      json(res, status, { erro: status === 500 ? 'Erro interno' : erro.message });
      if (status === 500) console.error(erro);
    });
  });
}

module.exports = { criarSite };
