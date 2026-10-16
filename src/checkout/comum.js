'use strict';

const { erro422 } = require('../http');
const { paraReais } = require('../dinheiro');

async function carregarLojaEItem(ctx, corpo) {
  const lojas = await ctx.erp.lojas();
  const loja = lojas.find((l) => l.codLoja === corpo.loja);
  if (!loja) throw erro422('Loja inválida');

  const catalogo = await ctx.catalogo.listar(ctx.erp, loja.codLoja);
  const item = catalogo.find((i) => i.codigo === corpo.codigo);
  if (!item) throw erro422('Equipamento não encontrado na loja');

  if (!Number.isInteger(corpo.quantidade) || corpo.quantidade < 1) throw erro422('Quantidade inválida');
  if (corpo.quantidade > item.estoque) {
    throw erro422(`Quantidade indisponível na loja (máximo ${item.estoque})`);
  }
  if (!item.periodosDisponiveis.includes(corpo.periodo)) {
    throw erro422('Período indisponível para este equipamento');
  }
  return { loja, item };
}

function validarCliente(cliente) {
  const c = cliente || {};
  const nome = String(c.nome || '').trim();
  if (!nome) throw erro422('Informe o nome do cliente');
  if (!/^\d{11}$/.test(c.documento || '')) throw erro422('CPF deve ter 11 dígitos, somente números');
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(c.email || '')) throw erro422('E-mail inválido');
  return { nome, documento: c.documento, email: c.email };
}

function validarEndereco(endereco) {
  const e = endereco || {};
  const completo = /^\d{8}$/.test(e.cep || '')
    && String(e.logradouro || '').trim()
    && String(e.numero || '').trim()
    && String(e.cidade || '').trim()
    && /^[A-Z]{2}$/.test(e.uf || '');
  if (!completo) throw erro422('Endereço de entrega incompleto');
  return {
    cep: e.cep,
    logradouro: e.logradouro.trim(),
    numero: String(e.numero).trim(),
    cidade: e.cidade.trim(),
    uf: e.uf,
  };
}

function validarData(ctx, data) {
  if (!ctx.calendario.datasPermitidas(ctx.hoje()).includes(data)) {
    throw erro422('Data de recebimento fora da janela permitida');
  }
}

function validarTermos(aceite) {
  if (aceite !== true) throw erro422('É necessário aceitar os termos de locação');
}

function formatarResumo({ loja, item, corpo, modalidade, frete, unitario, subtotal, valorLp, taxa }) {
  return {
    loja: { codLoja: loja.codLoja, nome: loja.nome },
    periodo: corpo.periodo,
    modalidade,
    itens: [{
      codigo: item.codigo,
      descricao: item.descricao,
      quantidade: corpo.quantidade,
      valorUnitario: paraReais(unitario),
      subtotal: paraReais(subtotal),
    }],
    subtotalEquipamentos: paraReais(subtotal),
    locacaoProtegida: corpo.locacaoProtegida === true,
    lpPercentual: item.lpPercentual,
    valorLocacaoProtegida: paraReais(valorLp),
    frete: frete ? { id: frete.id, nome: frete.nome, valor: frete.valor } : null,
    taxaEntrega: paraReais(taxa),
    total: paraReais(subtotal + valorLp + taxa),
  };
}

function registrarPedido(ctx, resumo, dados) {
  const pedido = {
    id: ctx.store.proximoId,
    criadoEm: new Date().toISOString(),
    status: 'pendente',
    ...resumo,
    cliente: dados.cliente,
    endereco: dados.endereco,
    dataProgramada: dados.dataProgramada,
    integracao: { idPreLocacao: null, erro: null },
  };
  ctx.store.proximoId += 1;
  ctx.store.pedidos.push(pedido);
  return pedido;
}

function montarPreLocacao(pedido, periodoErp) {
  return {
    idPedidoSite: pedido.id,
    codLoja: pedido.loja.codLoja,
    cliente: { ...pedido.cliente },
    periodo: periodoErp[pedido.periodo],
    modalidade: pedido.modalidade,
    dataProgramada: pedido.dataProgramada,
    endereco: pedido.endereco,
    itens: pedido.itens.map((i) => ({ codigo: i.codigo, quantidade: i.quantidade, valorUnitario: i.valorUnitario })),
    usarLocacaoProtegida: pedido.locacaoProtegida,
    valorLocacaoProtegida: pedido.valorLocacaoProtegida,
    taxaEntrega: pedido.taxaEntrega,
    valorTotal: pedido.total,
  };
}

module.exports = {
  carregarLojaEItem,
  validarCliente,
  validarEndereco,
  validarData,
  validarTermos,
  formatarResumo,
  registrarPedido,
  montarPreLocacao,
};
