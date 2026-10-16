'use strict';

const { somarDias, diaDaSemana } = require('../relogio');

// Feriados nacionais considerados pela operação. Lista mantida manualmente
// pelo time a cada virada de ano.
const FERIADOS = new Set([
  // 2026
  '2026-01-01', '2026-02-16', '2026-02-17', '2026-04-03', '2026-04-21',
  '2026-05-01', '2026-06-04', '2026-09-07', '2026-10-12', '2026-11-02',
  '2026-11-15', '2026-11-20', '2026-12-25',
  // 2027
  '2027-01-01', '2027-02-08', '2027-02-09', '2027-03-26', '2027-04-21',
  '2027-05-01', '2027-05-27', '2027-09-07', '2027-10-12', '2027-11-02',
  '2027-11-15', '2027-11-20', '2027-12-25',
]);

const JANELA_DIAS_UTEIS = 4;

function ehDiaUtil(iso) {
  const dia = diaDaSemana(iso);
  return dia !== 0 && dia !== 6 && !FERIADOS.has(iso);
}

// Próximos dias úteis a partir de amanhã, dentro da janela permitida.
function datasPermitidas(hoje) {
  const datas = [];
  let data = hoje;
  while (datas.length < JANELA_DIAS_UTEIS) {
    data = somarDias(data, 1);
    if (ehDiaUtil(data)) datas.push(data);
  }
  return datas;
}

module.exports = { ehDiaUtil, datasPermitidas };
