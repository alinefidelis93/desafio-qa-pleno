'use strict';

// Pedidos do site, em memória. Reiniciar o processo volta ao estado inicial.
const store = {
  pedidos: [],
  proximoId: 1,
  resetar() {
    this.pedidos = [];
    this.proximoId = 1;
  },
};

module.exports = store;
