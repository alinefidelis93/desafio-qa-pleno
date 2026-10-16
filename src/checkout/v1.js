'use strict';

const { erro422 } = require('../http');
const { paraCentavos, aplicarPercentual } = require('../dinheiro');
const {
  carregarLojaEItem, validarCliente, validarData, validarTermos,
  formatarResumo, registrarPedido, montarPreLocacao,
} = require('./comum');

const PERIODO_ERP = { diario: 'DIARIO', semanal: 'SEMANAL', quinzenal: 'QUINZENAL', mensal: 'MENSAL' };

async function resumo(ctx, corpo) {
  const { loja, item } = await carregarLojaEItem(ctx, corpo);
  const modalidade = corpo.modalidade ?? 'RETIRADA';
  if (modalidade !== 'RETIRADA') throw erro422('Modalidade indisponível');

  const unitario = paraCentavos(item.precos[corpo.periodo]);
  const subtotal = unitario * corpo.quantidade;
  // Locação Protegida incide sobre o valor dos equipamentos no período.
  const valorLp = corpo.locacaoProtegida === true ? aplicarPercentual(subtotal, item.lpPercentual) : 0;

  return formatarResumo({ loja, item, corpo, modalidade, frete: null, unitario, subtotal, valorLp, taxa: 0 });
}

async function criarPedido(ctx, corpo) {
  const dadosResumo = await resumo(ctx, corpo);
  const cliente = validarCliente(corpo.cliente);
  validarData(ctx, corpo.dataProgramada);
  validarTermos(corpo.aceiteTermos);

  const pedido = registrarPedido(ctx, dadosResumo, {
    cliente,
    endereco: null,
    dataProgramada: corpo.dataProgramada,
  });

  try {
    const { status, dados } = await ctx.erp.enviarPreLocacao(montarPreLocacao(pedido, PERIODO_ERP));
    if (status === 201) {
      pedido.status = 'enviado_loja';
      pedido.integracao = { idPreLocacao: dados.idPreLocacao, erro: null };
    } else {
      pedido.status = 'falha_integracao';
      pedido.integracao = { idPreLocacao: null, erro: dados.erro || `ERP respondeu ${status}` };
    }
  } catch {
    pedido.status = 'falha_integracao';
    pedido.integracao = { idPreLocacao: null, erro: 'ERP indisponível' };
  }
  return pedido;
}

module.exports = { resumo, criarPedido };
