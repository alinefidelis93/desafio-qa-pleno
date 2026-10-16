'use strict';

const PERIODOS = ['diario', 'semanal', 'quinzenal', 'mensal'];

// idPeriodo do ERP -> período do site
const POR_ID_ERP = { 1: 'diario', 2: 'semanal', 3: 'quinzenal', 4: 'mensal' };

function lerPrecos(itemErp) {
  const precos = { diario: null, semanal: null, quinzenal: null, mensal: null };
  for (const { idPeriodo, valor } of itemErp.precosDetalhados) {
    precos[POR_ID_ERP[idPeriodo]] = valor;
  }
  return precos;
}

module.exports = { PERIODOS, lerPrecos };
