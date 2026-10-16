'use strict';

// Carga fixa do ERP das lojas: lojas, equipamentos, tabela de preços por
// período e estoque. Preço ausente (null) = período não cadastrado na loja.

const LOJAS = [
  { codLoja: 'L01', nome: 'Andaime Azul Centro', cidade: 'São Paulo', uf: 'SP' },
  { codLoja: 'L02', nome: 'Andaime Azul Campinas', cidade: 'Campinas', uf: 'SP' },
  { codLoja: 'L03', nome: 'Andaime Azul Ribeirão Preto', cidade: 'Ribeirão Preto', uf: 'SP' },
];

const EQUIPAMENTOS = {
  'EQ-1001': 'Betoneira 400 L',
  'EQ-1002': 'Martelete rompedor 10 kg',
  'EQ-1003': 'Andaime tubular (painel 1,0 x 1,5 m)',
  'EQ-1004': 'Compactador de solo (sapo)',
  'EQ-1005': 'Gerador a gasolina 5,5 kVA',
  'EQ-1006': 'Serra mármore 1.300 W',
  'EQ-1007': 'Escora metálica 3 m',
  'EQ-1008': 'Lavadora de alta pressão',
};

// [diário, semanal, quinzenal, mensal], % Locação Protegida, estoque
const TABELA = {
  L01: {
    'EQ-1001': [[89.9, 359.6, 629.3, 1078.8], 0.10, 4],
    'EQ-1002': [[74.5, 298.0, 521.5, 894.0], 0.12, 6],
    'EQ-1003': [[null, 42.0, 63.0, 98.0], 0.08, 120],
    'EQ-1004': [[129.0, 516.0, 903.0, 1548.0], 0.12, 2],
    'EQ-1005': [[159.9, 639.6, 1119.3, 1918.8], 0.10, 3],
    'EQ-1006': [[39.9, 159.6, 279.3, 478.8], 0.10, 8],
    'EQ-1007': [[6.5, 26.0, null, 58.5], 0.05, 300],
    'EQ-1008': [[69.9, 279.6, 489.3, 838.8], 0.10, 5],
  },
  L02: {
    'EQ-1001': [[94.9, 379.6, 664.3, 1138.8], 0.10, 3],
    'EQ-1002': [[79.0, 316.0, 553.0, 948.0], 0.12, 4],
    'EQ-1003': [[null, null, 66.0, 104.0], 0.08, 80],
    'EQ-1004': [[135.0, 540.0, 945.0, 1620.0], 0.12, 2],
    'EQ-1005': [[165.0, 660.0, 1155.0, null], 0.10, 1],
    'EQ-1006': [[42.0, 168.0, 294.0, 504.0], 0.10, 5],
    'EQ-1007': [[7.0, 28.0, 49.0, 63.0], 0.05, 150],
    'EQ-1008': [[72.0, 288.0, 504.0, 864.0], 0.10, 0],
  },
  L03: {
    'EQ-1001': [[84.9, 339.6, 594.3, 1018.8], 0.10, 2],
    'EQ-1002': [[69.9, 279.6, null, 838.8], 0.12, 3],
    'EQ-1003': [[null, 39.0, 59.0, 92.0], 0.08, 60],
    'EQ-1004': [[119.0, 476.0, 833.0, 1428.0], 0.12, 0],
    'EQ-1005': [[149.9, 599.6, 1049.3, 1798.8], 0.10, 2],
    'EQ-1006': [[37.9, 151.6, 265.3, 454.8], 0.10, 6],
    'EQ-1007': [[6.0, 24.0, 42.0, 54.0], 0.05, 200],
  },
};

module.exports = { LOJAS, EQUIPAMENTOS, TABELA };
