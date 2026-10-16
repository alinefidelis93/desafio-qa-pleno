'use strict';

const { PERIODOS, lerPrecos } = require('./comum');

// Tabela de preço muda pouco: mantemos em cache por 10 minutos para não
// consultar o ERP a cada página. Estoque continua vindo sempre do ERP.
const VALIDADE_MS = 10 * 60 * 1000;
const cache = new Map();

// Período sem preço cadastrado usa a diária como referência, para não
// esconder opções do cliente.
function completarPrecos(precos) {
  const completo = {};
  for (const periodo of PERIODOS) {
    completo[periodo] = precos[periodo] ?? precos.diario ?? 0;
  }
  return completo;
}

function tabelaDePreco(item, agora) {
  const emCache = cache.get(item.codigoEquipamento);
  if (emCache && agora - emCache.em < VALIDADE_MS) return emCache;
  const nova = {
    precos: completarPrecos(lerPrecos(item)),
    lpPercentual: item.porcentagemLocacaoProtegida,
    em: agora,
  };
  cache.set(item.codigoEquipamento, nova);
  return nova;
}

async function listar(erp, codLoja) {
  const itens = await erp.valores(codLoja);
  const agora = Date.now();
  return itens.map((item) => {
    const tabela = tabelaDePreco(item, agora);
    return {
      codigo: item.codigoEquipamento,
      descricao: item.descricao,
      precos: tabela.precos,
      periodosDisponiveis: PERIODOS,
      lpPercentual: tabela.lpPercentual,
      estoque: item.qtdDisponivel,
      disponivel: item.qtdDisponivel > 0,
    };
  });
}

function limparCache() {
  cache.clear();
}

module.exports = { listar, limparCache };
