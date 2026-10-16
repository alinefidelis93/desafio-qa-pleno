# Changelog — versão 2.0

Release candidate preparado pelo time de desenvolvimento. Abaixo, o que mudou em
relação à versão que está em produção hoje.

**Responsável pelo build:** Time Canais Digitais
**Data de corte:** 2026-11-11
**Janela de subida prevista:** sexta-feira

---

## Novidades

### Entrega no endereço

Implementada a entrega descrita em `SPEC-entrega-no-endereco.md`: modalidade
"Receber no endereço", janela de cadastro de endereço, escolha de frete pela
tabela da loja e envio de `modalidade`, `endereco` e `taxaEntrega` ao ERP.

Para lojas que ainda não cadastraram tabela de frete, a v2 aplica um **frete
padrão** (R$ 20,00 normal / R$ 40,00 rápida), para que a tela não fique sem
opção de entrega.

## Melhorias

### Cache de preços do catálogo

A tabela de preços passa a ficar em cache por 10 minutos, reduzindo as chamadas
ao ERP em horário de pico. O estoque continua sendo consultado a cada acesso.

### Feriados calculados automaticamente

A lista manual de feriados, que precisava ser atualizada a cada ano, foi
substituída por cálculo automático (datas fixas + feriados móveis a partir da
Páscoa).

### Períodos sem preço

Equipamentos com algum período sem preço cadastrado passam a usar a diária como
referência, para não esconder opções do cliente no catálogo.

### Confirmação mais rápida

O envio da pré-locação ao ERP passou a ser feito em segundo plano. O cliente
recebe a confirmação na hora, sem ficar esperando a resposta da loja.

### Padronização dos períodos enviados ao ERP

Revisados os nomes de período enviados na pré-locação.

---

## Sem alterações nesta versão

- Regras de estoque.
- Contrato das rotas de catálogo, resumo e pedidos (apenas campos de entrega
  acrescentados).
- Carga de dados do ERP.
