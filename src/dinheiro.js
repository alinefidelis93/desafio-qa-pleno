'use strict';

// Valores trafegam em reais (number com duas casas) na API e na tela,
// mas todo cálculo é feito em centavos inteiros.

function paraCentavos(reais) {
  return Math.round(reais * 100);
}

function paraReais(centavos) {
  return centavos / 100;
}

// Aplica um percentual (fração decimal) com arredondamento comercial.
function aplicarPercentual(centavos, fracao) {
  return Math.round(centavos * fracao);
}

module.exports = { paraCentavos, paraReais, aplicarPercentual };
