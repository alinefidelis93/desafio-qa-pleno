'use strict';

// Tabela de frete cadastrada por loja.
const TABELAS = {
  L01: [
    { id: 'normal', nome: 'Entrega normal', valor: 35.0 },
    { id: 'rapida', nome: 'Entrega rápida', valor: 60.0 },
  ],
  L02: [
    { id: 'normal', nome: 'Entrega normal', valor: 45.0 },
    { id: 'rapida', nome: 'Entrega rápida', valor: 80.0 },
  ],
};

// Lojas ainda sem tabela recebem o frete padrão, para a tela não ficar sem opção.
const PADRAO = [
  { id: 'normal', nome: 'Entrega normal', valor: 20.0 },
  { id: 'rapida', nome: 'Entrega rápida', valor: 40.0 },
];

function opcoes(codLoja) {
  return TABELAS[codLoja] || PADRAO;
}

function lojaFazEntrega(codLoja) {
  return opcoes(codLoja).length > 0;
}

module.exports = { opcoes, lojaFazEntrega };
