# Especificação — Entrega no endereço

**Produto:** Locação Online
**Solicitante:** Diretoria de Operações das Lojas
**Responsável pela spec:** Product Owner — Marina Teles
**Versão de destino:** 2.0
**Status:** Aprovada para desenvolvimento

---

## 1. Contexto

Hoje todo pedido do site termina em retirada na loja. Boa parte dos clientes de
obra pede, por telefone, que o equipamento seja entregue no canteiro, e a loja
recria o pedido à mão no ERP com a taxa de entrega. Isso gera retrabalho, erro de
digitação de valor e pedido que nunca chega a ser registrado.

A v2 permite escolher, no próprio checkout, **receber o equipamento no endereço**,
com o frete da tabela da loja já somado ao pedido e enviado ao ERP.

## 2. Regras

### 2.1 Modalidade

No passo "Como receber", o cliente escolhe entre:

- **Retirar na loja** — como hoje, sem frete.
- **Receber no endereço** — exige endereço completo e escolha do frete.

### 2.2 Endereço

O endereço é cadastrado numa janela própria ("Novo endereço"), com **CEP (8
dígitos), logradouro, número, cidade e UF**, todos obrigatórios. Depois de salvar
o endereço, o cliente **escolhe o frete** antes de seguir para o resumo.

### 2.3 Frete

- Cada loja tem sua **tabela de frete** com duas opções: **Entrega normal** e
  **Entrega rápida**, cada uma com valor fixo. O valor não depende do CEP nesta
  versão.
- O cliente precisa escolher uma das opções. **Não existe pedido com entrega sem
  frete escolhido.**
- **Lojas sem tabela de frete cadastrada continuam oferecendo apenas retirada.**
  Hoje só L01 e L02 têm tabela.

| Loja | Entrega normal | Entrega rápida |
|---|---|---|
| L01 | R$ 35,00 | R$ 60,00 |
| L02 | R$ 45,00 | R$ 80,00 |

### 2.4 Data

A data de entrega segue a mesma regra da retirada: próximos 4 dias úteis.

### 2.5 Valores

- O frete entra no pedido como **taxa de entrega** e é somado ao total.
- A Locação Protegida continua sendo calculada sobre o valor da locação, como hoje.

### 2.6 Envio ao ERP

A pré-locação de entrega vai com `modalidade: "ENTREGA"`, o `endereco` completo
e `taxaEntrega` com o valor do frete escolhido. O restante do contrato não muda.

## 3. Critérios de aceite

1. Na L01, o cliente escolhe "Receber no endereço", cadastra o endereço, escolhe
   "Entrega normal" e o resumo mostra frete de R$ 35,00 somado ao total.
2. EQ-1001 (Betoneira) na L01, semanal, 1 unidade, sem Locação Protegida, com
   Entrega normal: total **R$ 394,60** (359,60 + 35,00).
3. Sem escolher o frete, o cliente não avança para o resumo.
4. Na L03, a opção "Receber no endereço" não é oferecida.
5. A pré-locação recebida pelo ERP traz `modalidade`, `endereco` e `taxaEntrega`
   corretos.
6. Pedidos de retirada continuam funcionando exatamente como na v1.

## 4. Fora de escopo

- Frete calculado por CEP ou distância.
- Mais de um endereço por cliente ou endereço salvo para próximas compras.
- Agendamento de horário de entrega.
