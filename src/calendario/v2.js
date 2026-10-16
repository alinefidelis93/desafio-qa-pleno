'use strict';

const { somarDias, diaDaSemana } = require('../relogio');

// Feriados calculados a partir do ano: acabou a lista manual para manter.
const FIXOS = ['01-01', '04-21', '05-01', '09-07', '10-12', '11-02', '11-15', '12-25'];

const JANELA_DIAS_UTEIS = 4;

// Domingo de Páscoa (algoritmo de Meeus/Jones/Butcher).
function pascoa(ano) {
  const a = ano % 19;
  const b = Math.floor(ano / 100);
  const c = ano % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mes = Math.floor((h + l - 7 * m + 114) / 31);
  const dia = ((h + l - 7 * m + 114) % 31) + 1;
  return `${ano}-${String(mes).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
}

const porAno = new Map();

function feriados(ano) {
  if (!porAno.has(ano)) {
    const domingoDePascoa = pascoa(ano);
    porAno.set(ano, new Set([
      ...FIXOS.map((mesDia) => `${ano}-${mesDia}`),
      somarDias(domingoDePascoa, -48), // carnaval (segunda)
      somarDias(domingoDePascoa, -47), // carnaval (terça)
      somarDias(domingoDePascoa, -2), // sexta-feira santa
      somarDias(domingoDePascoa, 60), // corpus christi
    ]));
  }
  return porAno.get(ano);
}

function ehDiaUtil(iso) {
  const dia = diaDaSemana(iso);
  return dia !== 0 && dia !== 6 && !feriados(Number(iso.slice(0, 4))).has(iso);
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
