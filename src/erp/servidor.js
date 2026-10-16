'use strict';

// Simulador do ERP das lojas. Na operação real, é o sistema que cada loja usa
// para gerir contratos, preços e estoque; o site só conversa com ele por API.

const http = require('http');
const { json, lerCorpo } = require('../http');
const { paraCentavos } = require('../dinheiro');
const { dataValida } = require('../relogio');
const { LOJAS, EQUIPAMENTOS, TABELA } = require('./seed');

const CHAVE_API = 'chave-local-desafio';
const PERIODOS_ERP = ['DIARIO', 'SEMANAL', 'QUINZENAL', 'MENSAL'];
const MODALIDADES = ['RETIRADA', 'ENTREGA'];

const estado = { preLocacoes: [], proximoId: 1 };

function resetar() {
  estado.preLocacoes = [];
  estado.proximoId = 1;
}

function valoresDaLoja(codLoja) {
  const tabela = TABELA[codLoja];
  if (!tabela) return null;
  return Object.entries(tabela).map(([codigo, [precos, lp, estoque]]) => ({
    codigoEquipamento: codigo,
    descricao: EQUIPAMENTOS[codigo],
    precosDetalhados: precos
      .map((valor, i) => ({ idPeriodo: i + 1, valor }))
      .filter((p) => p.valor !== null),
    porcentagemLocacaoProtegida: lp,
    qtdDisponivel: estoque,
  }));
}

function validarPreLocacao(p) {
  if (!p || typeof p !== 'object') return 'corpo ausente';
  const loja = LOJAS.find((l) => l.codLoja === p.codLoja);
  if (!loja) return `codLoja desconhecido: ${p.codLoja}`;
  if (!PERIODOS_ERP.includes(p.periodo)) return `periodo inválido: ${p.periodo}`;
  if (!MODALIDADES.includes(p.modalidade)) return `modalidade inválida: ${p.modalidade}`;
  if (!dataValida(p.dataProgramada)) return 'dataProgramada deve estar no formato AAAA-MM-DD';

  const c = p.cliente || {};
  if (!c.nome) return 'cliente.nome obrigatório';
  if (!/^\d{11}$/.test(c.documento || '')) return 'cliente.documento deve ter 11 dígitos';

  if (p.modalidade === 'ENTREGA') {
    const e = p.endereco || {};
    const faltando = ['cep', 'logradouro', 'numero', 'cidade', 'uf'].filter((campo) => !e[campo]);
    if (faltando.length) return `endereco incompleto: ${faltando.join(', ')}`;
  }

  if (typeof p.taxaEntrega !== 'number' || p.taxaEntrega < 0) return 'taxaEntrega inválida';
  if (typeof p.usarLocacaoProtegida !== 'boolean') return 'usarLocacaoProtegida deve ser booleano';
  if (!p.usarLocacaoProtegida && p.valorLocacaoProtegida !== 0) {
    return 'valorLocacaoProtegida deve ser 0 quando usarLocacaoProtegida = false';
  }

  if (!Array.isArray(p.itens) || p.itens.length === 0) return 'itens obrigatório';
  const idPeriodo = PERIODOS_ERP.indexOf(p.periodo);
  let somaItens = 0;
  for (const item of p.itens) {
    const linha = TABELA[p.codLoja][item.codigo];
    if (!linha) return `equipamento ${item.codigo} não pertence à loja ${p.codLoja}`;
    const [precos, , estoque] = linha;
    if (!Number.isInteger(item.quantidade) || item.quantidade < 1) return `quantidade inválida para ${item.codigo}`;
    if (item.quantidade > estoque) return `estoque insuficiente para ${item.codigo} na loja ${p.codLoja}`;
    const precoTabela = precos[idPeriodo];
    if (precoTabela === null) return `equipamento ${item.codigo} sem preço para o período ${p.periodo} na loja ${p.codLoja}`;
    if (paraCentavos(item.valorUnitario) !== paraCentavos(precoTabela)) {
      return `valorUnitario divergente para ${item.codigo}: enviado ${item.valorUnitario}, tabela ${precoTabela}`;
    }
    somaItens += paraCentavos(item.valorUnitario) * item.quantidade;
  }

  const esperado = somaItens + paraCentavos(p.valorLocacaoProtegida) + paraCentavos(p.taxaEntrega);
  if (paraCentavos(p.valorTotal) !== esperado) {
    return `valorTotal divergente: enviado ${p.valorTotal}, soma das parcelas ${esperado / 100}`;
  }
  return null;
}

function autorizado(req) {
  return req.headers['x-api-key'] === CHAVE_API;
}

async function tratar(req, res) {
  const url = new URL(req.url, 'http://localhost');
  const rota = `${req.method} ${url.pathname}`;

  if (rota === 'POST /_reset') {
    resetar();
    return json(res, 200, { ok: true });
  }

  if (!autorizado(req)) return json(res, 401, { erro: 'x-api-key ausente ou inválida' });

  if (rota === 'GET /v1/lojas') return json(res, 200, { itens: LOJAS });

  if (rota === 'GET /v1/equipamentos-valores') {
    const codLoja = url.searchParams.get('codLoja');
    const itens = valoresDaLoja(codLoja);
    if (!itens) return json(res, 404, { erro: `Loja não encontrada: ${codLoja}` });
    return json(res, 200, { codLoja, itens });
  }

  if (rota === 'POST /v1/pre-locacoes') {
    let corpo;
    try {
      corpo = await lerCorpo(req);
    } catch (erro) {
      return json(res, 400, { erro: erro.message });
    }
    const motivo = validarPreLocacao(corpo);
    const registro = {
      idPreLocacao: motivo ? null : `PL-${String(estado.proximoId).padStart(4, '0')}`,
      status: motivo ? 'rejeitada' : 'recebida',
      motivo,
      recebidaEm: new Date().toISOString(),
      payload: corpo,
    };
    if (!motivo) estado.proximoId += 1;
    estado.preLocacoes.push(registro);
    if (motivo) return json(res, 422, { erro: motivo });
    return json(res, 201, { idPreLocacao: registro.idPreLocacao, status: registro.status });
  }

  if (rota === 'GET /v1/pre-locacoes') {
    const status = url.searchParams.get('status');
    const itens = estado.preLocacoes.filter((r) => !status || r.status === status);
    return json(res, 200, { total: itens.length, itens });
  }

  return json(res, 404, { erro: 'Rota não encontrada' });
}

function iniciarErp(porta) {
  const servidor = http.createServer((req, res) => {
    tratar(req, res).catch((erro) => json(res, 500, { erro: erro.message }));
  });
  return new Promise((resolve, reject) => {
    servidor.once('error', reject);
    servidor.listen(porta, () => resolve(servidor));
  });
}

module.exports = { iniciarErp, resetar, CHAVE_API };
