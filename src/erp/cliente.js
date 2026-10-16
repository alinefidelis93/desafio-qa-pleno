'use strict';

// Cliente HTTP que o site usa para falar com o ERP das lojas.

function criarClienteErp(baseUrl, chave) {
  async function chamar(metodo, caminho, corpo) {
    const resposta = await fetch(baseUrl + caminho, {
      method: metodo,
      headers: { 'x-api-key': chave, 'Content-Type': 'application/json' },
      body: corpo === undefined ? undefined : JSON.stringify(corpo),
    });
    const dados = await resposta.json().catch(() => ({}));
    return { status: resposta.status, dados };
  }

  async function exigir200(metodo, caminho) {
    const { status, dados } = await chamar(metodo, caminho);
    if (status !== 200) {
      const erro = new Error(`ERP respondeu ${status} em ${caminho}`);
      erro.status = 502;
      throw erro;
    }
    return dados;
  }

  return {
    async lojas() {
      return (await exigir200('GET', '/v1/lojas')).itens;
    },
    async valores(codLoja) {
      return (await exigir200('GET', `/v1/equipamentos-valores?codLoja=${encodeURIComponent(codLoja)}`)).itens;
    },
    async enviarPreLocacao(payload) {
      return chamar('POST', '/v1/pre-locacoes', payload);
    },
  };
}

module.exports = { criarClienteErp };
