'use strict';

const { erro422 } = require('../http');
const { paraCentavos, aplicarPercentual } = require('../dinheiro');
const {
  carregarLojaEItem, validarCliente, validarEndereco, validarData, validarTermos,
  formatarResumo, registrarPedido, montarPreLocacao,
} = require('./comum');

const PERIODO_ERP = { diario: 'DIARIO', semanal: 'SEMANAL', quinzenal: 'QUINZENA', mensal: 'MENSAL' };
const MODALIDADES = ['RETIRADA', 'ENTREGA'];

async function resumo(ctx, corpo) {
  const { loja, item } = await carregarLojaEItem(ctx, corpo);
  const modalidade = corpo.modalidade ?? 'RETIRADA';
  if (!MODALIDADES.includes(modalidade)) throw erro422('Modalidade indisponível');

  let frete = null;
  if (modalidade === 'ENTREGA' && corpo.freteId) {
    frete = ctx.frete.opcoes(loja.codLoja).find((o) => o.id === corpo.freteId);
    if (!frete) throw erro422('Opção de frete inválida');
  }

  const unitario = paraCentavos(item.precos[corpo.periodo]);
  const subtotal = unitario * corpo.quantidade;
  const taxa = frete ? paraCentavos(frete.valor) : 0;
  // Locação Protegida incide sobre o valor da locação.
  const valorLp = corpo.locacaoProtegida === true ? aplicarPercentual(subtotal + taxa, item.lpPercentual) : 0;

  return formatarResumo({ loja, item, corpo, modalidade, frete, unitario, subtotal, valorLp, taxa });
}

async function criarPedido(ctx, corpo) {
  const dadosResumo = await resumo(ctx, corpo);
  const cliente = validarCliente(corpo.cliente);
  const endereco = dadosResumo.modalidade === 'ENTREGA' ? validarEndereco(corpo.endereco) : null;
  validarData(ctx, corpo.dataProgramada);
  validarTermos(corpo.aceiteTermos);

  const pedido = registrarPedido(ctx, dadosResumo, {
    cliente,
    endereco,
    dataProgramada: corpo.dataProgramada,
  });

  // Envio ao ERP em segundo plano: a confirmação não fica presa esperando a loja.
  pedido.status = 'enviado_loja';
  ctx.erp.enviarPreLocacao(montarPreLocacao(pedido, PERIODO_ERP))
    .then(({ dados }) => {
      pedido.integracao.idPreLocacao = dados.idPreLocacao ?? null;
    })
    .catch(() => {});
  return pedido;
}

module.exports = { resumo, criarPedido };
