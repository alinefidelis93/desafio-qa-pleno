'use strict';

// A v1 não faz entrega: o cliente sempre retira o equipamento na loja.
function opcoes() {
  return [];
}

function lojaFazEntrega() {
  return false;
}

module.exports = { opcoes, lojaFazEntrega };
