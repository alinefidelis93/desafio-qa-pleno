'use strict';

// Data de referência do sistema. Em produção é o dia corrente; para testes,
// pode ser fixada com a variável de ambiente HOJE=AAAA-MM-DD.
function hoje() {
  const fixa = process.env.HOJE;
  if (fixa) {
    if (!dataValida(fixa)) throw new Error('HOJE deve ser uma data válida no formato AAAA-MM-DD');
    return fixa;
  }
  const agora = new Date();
  return formatar(new Date(Date.UTC(agora.getFullYear(), agora.getMonth(), agora.getDate())));
}

function paraData(iso) {
  const [ano, mes, dia] = iso.split('-').map(Number);
  return new Date(Date.UTC(ano, mes - 1, dia));
}

function formatar(data) {
  return data.toISOString().slice(0, 10);
}

function somarDias(iso, dias) {
  const data = paraData(iso);
  data.setUTCDate(data.getUTCDate() + dias);
  return formatar(data);
}

// 0 = domingo ... 6 = sábado
function diaDaSemana(iso) {
  return paraData(iso).getUTCDay();
}

function dataValida(iso) {
  return typeof iso === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(iso) && formatar(paraData(iso)) === iso;
}

module.exports = { hoje, paraData, formatar, somarDias, diaDaSemana, dataValida };
