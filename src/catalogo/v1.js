'use strict';

const { PERIODOS, lerPrecos } = require('./comum');

async function listar(erp, codLoja) {
  const itens = await erp.valores(codLoja);
  return itens.map((item) => {
    const precos = lerPrecos(item);
    return {
      codigo: item.codigoEquipamento,
      descricao: item.descricao,
      precos,
      periodosDisponiveis: PERIODOS.filter((p) => precos[p] !== null),
      lpPercentual: item.porcentagemLocacaoProtegida,
      estoque: item.qtdDisponivel,
      disponivel: item.qtdDisponivel > 0,
    };
  });
}

function limparCache() {}

module.exports = { listar, limparCache };
