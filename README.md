# Locação Online — Andaime Azul Locações

Site de locação de equipamentos para obra da **Andaime Azul**, uma rede de lojas
franqueadas. O cliente escolhe a loja, o equipamento e o período, e o site envia
uma **pré-locação** para o **ERP das lojas** — o sistema que cada loja usa para
emitir contrato, separar o equipamento e controlar estoque.

Este documento descreve as **regras vigentes em produção (v1)** e os **contratos
de API** como estão hoje. É a referência do que é considerado correto.

> Empresa, lojas, pessoas e dados deste repositório são fictícios.

---

## Por onde começar

Leia nesta ordem:

1. **[DESAFIO.md](./DESAFIO.md)** — o que você precisa entregar, o prazo e a
   decisão que está nas suas mãos.
2. **Este README** — regras da v1 e contratos de API.
3. **[SPEC-entrega-no-endereco.md](./SPEC-entrega-no-endereco.md)** — a
   especificação da feature nova da v2, aprovada pelo produto.
4. **[CHANGELOG-v2.md](./CHANGELOG-v2.md)** — o que o time de desenvolvimento
   informou que mudou na v2.
5. **[suite-ia/](./suite-ia/)** — a suíte automatizada que um colega gerou com
   IA para a v2.

## O que você vai entregar

Cada arquivo abaixo já está no repositório, com as seções prontas para
preencher. O detalhamento de cada um está no [DESAFIO.md](./DESAFIO.md).

| Arquivo | O que colocar nele |
|---------|--------------------|
| [ESTRATEGIA.md](./ESTRATEGIA.md) | Análise de risco, priorização e o que decidiu **não** testar |
| [MATRIZ_COBERTURA.md](./MATRIZ_COBERTURA.md) | Risco × cobertura e cobertura por regra de negócio |
| [bugs/](./bugs/) | Um arquivo por problema, seguindo o [modelo](./bugs/_TEMPLATE.md) |
| [regressao/](./regressao/) | Sua suíte automatizada comparando v1 e v2: E2E do checkout + API/integração ([leia primeiro](./regressao/README.md)) |
| [REVISAO_SUITE_IA.md](./REVISAO_SUITE_IA.md) | Sua revisão da suíte gerada por IA em `suite-ia/` |
| [USO_DE_IA.md](./USO_DE_IA.md) | Como você usou IA neste desafio — e onde ela errou |
| [PERGUNTAS_AO_PO.md](./PERGUNTAS_AO_PO.md) | O que ficou ambíguo e precisa de definição antes de virar "esperado" |
| [RELEASE_DECISION.md](./RELEASE_DECISION.md) | Sua decisão de **GO / NO-GO** sobre a v2, justificada |

---

## Como rodar

Requer apenas **Node.js 18 ou superior**. A aplicação não tem dependências para
instalar.

### Já tem o Node instalado?

```bash
node --version
```

Se aparecer `v18` ou maior, está pronto. Se aparecer `command not found`
(macOS/Linux) ou `não é reconhecido como um comando` (Windows), instale por um
destes caminhos:

| Sistema | Como instalar |
|---------|---------------|
| Qualquer um | Baixe a versão **LTS** em <https://nodejs.org/pt-br/download> |
| Windows (terminal) | `winget install OpenJS.NodeJS.LTS` |
| macOS (Homebrew) | `brew install node` |
| Linux, ou quem prefere alternar versões | [nvm](https://github.com/nvm-sh/nvm) e depois `nvm install --lts` |

> Se a máquina for corporativa e bloquear a instalação, avise quem te enviou o
> desafio — a gente resolve.

### Subindo as duas versões

```bash
node server.js v1   # produção hoje     -> site http://localhost:3001  | ERP http://localhost:4001
node server.js v2   # release candidate -> site http://localhost:3002  | ERP http://localhost:4002
```

As duas podem rodar ao mesmo tempo, em terminais separados. Cada processo sobe o
**site** e o **seu próprio simulador do ERP das lojas**, com dados em memória: o
que você faz numa versão não afeta a outra.

O cabeçalho da tela mostra qual versão está respondendo.

### Fixando a data de referência

As regras de data dependem do dia de hoje. Para testes reprodutíveis, fixe a
data com a variável de ambiente `HOJE`:

```bash
HOJE=2026-11-18 node server.js v2            # macOS / Linux / Git Bash
$env:HOJE="2026-11-18"; node server.js v2    # Windows PowerShell
```

Sem `HOJE`, vale a data do sistema. A data em uso aparece em `GET /api/versao` e
no log de inicialização.

## Dados

- **3 lojas** (`L01`, `L02`, `L03`) e **8 equipamentos**, com preço e estoque por
  loja. Preço e estoque são do ERP: o site sempre os consulta lá.
- Pedidos e pré-locações começam vazios e ficam em memória.
- Reiniciar o processo volta ao estado inicial. Sem reiniciar: botão **Resetar
  dados** na tela, ou `POST /_reset` no site (limpa site e ERP daquela versão).

---

## Regras de negócio (v1)

### Loja

O cliente escolhe a loja no cabeçalho. **Catálogo, preço e estoque são sempre da
loja escolhida** — cada franquia tem sua própria tabela de preços. Trocar de loja
descarta o pedido em andamento.

### Período e preço

A locação é contratada por um período: **diário, semanal, quinzenal ou mensal**.

- O valor unitário é o **preço do período na tabela da loja**. Não é a diária
  multiplicada pelo número de dias: o preço semanal é o que está na tabela para o
  período semanal.
- **Período sem preço cadastrado na loja não é oferecido** para aquele
  equipamento. Se o ERP não tem preço quinzenal de um equipamento numa loja, o
  cliente não consegue escolher quinzenal ali.
- Subtotal dos equipamentos = valor unitário × quantidade.

### Locação Protegida

Opcional. Cobre danos acidentais ao equipamento durante a locação.

- O percentual vem do ERP, por equipamento e loja (campo `lpPercentual`).
- **Valor da Locação Protegida = percentual × subtotal dos equipamentos.**

### Estoque

A quantidade pedida precisa estar entre 1 e o estoque disponível **da loja
escolhida**. Equipamento com estoque zero aparece como "Indisponível nesta loja".

### Data de retirada

- O cliente escolhe uma data entre os **próximos 4 dias úteis**, a partir de
  amanhã.
- Dia útil: segunda a sexta, exceto **feriados nacionais**. Feriados
  considerados pela operação:

| Ano | Feriados |
|---|---|
| 2026 | 01/01, 16/02 e 17/02 (Carnaval), 03/04 (Sexta-feira Santa), 21/04, 01/05, 04/06 (Corpus Christi), 07/09, 12/10, 02/11, 15/11, 20/11 (Consciência Negra), 25/12 |
| 2027 | 01/01, 08/02 e 09/02 (Carnaval), 26/03 (Sexta-feira Santa), 21/04, 01/05, 27/05 (Corpus Christi), 07/09, 12/10, 02/11, 15/11, 20/11 (Consciência Negra), 25/12 |

### Como receber

Na v1 o cliente sempre **retira o equipamento na loja**. Não há frete.

### Total

```
subtotal          = valor unitário do período × quantidade
locação protegida = subtotal × lpPercentual   (se contratada)
total             = subtotal + locação protegida
```

Valores em reais com duas casas, arredondamento comercial (a partir de cinco
milésimos, arredonda para cima).

Exemplos conferidos com a operação:

| Loja | Equipamento | Período | Qtd. | Locação Protegida | Conta | Total |
|---|---|---|---|---|---|---|
| L01 | EQ-1001 Betoneira 400 L | quinzenal | 1 | sim (10%) | 629,30 + 62,93 | R$ 692,23 |
| L02 | EQ-1006 Serra mármore | semanal | 2 | não | 168,00 × 2 | R$ 336,00 |
| L01 | EQ-1004 Compactador de solo | mensal | 1 | sim (12%) | 1.548,00 + 185,76 | R$ 1.733,76 |
| L03 | EQ-1007 Escora metálica | diário | 10 | sim (5%) | 60,00 + 3,00 | R$ 63,00 |

### Envio para a loja

Ao confirmar, o site cria o pedido e envia a **pré-locação** para o ERP.

- ERP aceitou (`201`): pedido fica `enviado_loja`, com o `idPreLocacao` gerado
  pelo ERP. A tela confirma o envio.
- ERP recusou ou não respondeu: pedido fica `falha_integracao`, com o motivo em
  `integracao.erro`. A tela avisa o cliente que o pedido **não** chegou à loja e
  que a equipe vai entrar em contato. **Nunca** confirmamos ao cliente um pedido
  que a loja não recebeu.

---

## Contrato da API do site

Respostas em JSON (`charset=utf-8`). Erros de validação respondem `422` com
`{ "erro": "..." }`.

### `GET /api/versao`

```json
{ "versao": "v1", "hoje": "2026-11-18", "entrega": false }
```

### `GET /api/lojas`

```json
{ "itens": [{ "codLoja": "L01", "nome": "Andaime Azul Centro", "cidade": "São Paulo", "uf": "SP", "entrega": false }] }
```

### `GET /api/catalogo?loja={codLoja}`

```json
{
  "loja": { "codLoja": "L01", "nome": "Andaime Azul Centro" },
  "itens": [
    {
      "codigo": "EQ-1003",
      "descricao": "Andaime tubular (painel 1,0 x 1,5 m)",
      "precos": { "diario": null, "semanal": 42, "quinzenal": 63, "mensal": 98 },
      "periodosDisponiveis": ["semanal", "quinzenal", "mensal"],
      "lpPercentual": 0.08,
      "estoque": 120,
      "disponivel": true
    }
  ]
}
```

`precos` traz `null` no período sem preço na loja; `periodosDisponiveis` lista só
os períodos que o cliente pode escolher. Loja inexistente: `404`.

### `GET /api/checkout/datas`

```json
{ "hoje": "2026-11-18", "datas": ["2026-11-19", "2026-11-23", "2026-11-24", "2026-11-25"] }
```

### `POST /api/checkout/resumo`

Calcula o pedido sem gravar nada. É o que a tela de resumo exibe.

```json
{ "loja": "L01", "codigo": "EQ-1001", "quantidade": 1, "periodo": "quinzenal", "locacaoProtegida": true, "modalidade": "RETIRADA" }
```

Resposta `200`:

```json
{
  "loja": { "codLoja": "L01", "nome": "Andaime Azul Centro" },
  "periodo": "quinzenal",
  "modalidade": "RETIRADA",
  "itens": [{ "codigo": "EQ-1001", "descricao": "Betoneira 400 L", "quantidade": 1, "valorUnitario": 629.3, "subtotal": 629.3 }],
  "subtotalEquipamentos": 629.3,
  "locacaoProtegida": true,
  "lpPercentual": 0.1,
  "valorLocacaoProtegida": 62.93,
  "frete": null,
  "taxaEntrega": 0,
  "total": 692.23
}
```

### `POST /api/pedidos`

Mesmo corpo do resumo, mais os dados do cliente, a data e o aceite dos termos:

```json
{
  "loja": "L01", "codigo": "EQ-1001", "quantidade": 1, "periodo": "quinzenal",
  "locacaoProtegida": true, "modalidade": "RETIRADA",
  "cliente": { "nome": "Ana Souza", "documento": "12345678901", "email": "ana@exemplo.com" },
  "dataProgramada": "2026-11-19",
  "aceiteTermos": true
}
```

- `201` — devolve o pedido: os campos do resumo, mais `id`, `status`
  (`enviado_loja` ou `falha_integracao`), `cliente`, `endereco`,
  `dataProgramada`, `criadoEm` e `integracao` (`{ idPreLocacao, erro }`).
- `422` — validação: loja, equipamento, quantidade/estoque, período, cliente
  (CPF com 11 dígitos), data fora da janela, termos não aceitos.

### `GET /api/pedidos` · `GET /api/pedidos/{id}`

Lista (`{ total, itens }`) e detalhe de pedidos. Pedido inexistente: `404`.

### `POST /_reset`

Restaura o estado inicial do site e do ERP daquela versão.

---

## Contrato de integração com o ERP das lojas

Cada versão sobe seu próprio simulador do ERP (porta `4001` para a v1, `4002`
para a v2). Ele se comporta como o ERP real: valida a pré-locação contra a
**tabela de preços e o estoque da loja** e recusa o que não bate.

Toda chamada exige o cabeçalho `x-api-key: chave-local-desafio` (chave fictícia,
só deste ambiente). Sem ele: `401`.

### `GET /v1/lojas`

Lojas da rede.

### `GET /v1/equipamentos-valores?codLoja={codLoja}`

Tabela de preço e estoque da loja. `idPeriodo`: 1 = diário, 2 = semanal,
3 = quinzenal, 4 = mensal. Período sem preço simplesmente não aparece em
`precosDetalhados`.

```json
{
  "codLoja": "L01",
  "itens": [{
    "codigoEquipamento": "EQ-1001",
    "descricao": "Betoneira 400 L",
    "precosDetalhados": [{ "idPeriodo": 1, "valor": 89.9 }, { "idPeriodo": 2, "valor": 359.6 }],
    "porcentagemLocacaoProtegida": 0.1,
    "qtdDisponivel": 4
  }]
}
```

### `POST /v1/pre-locacoes`

O que o site envia ao confirmar um pedido:

```json
{
  "idPedidoSite": 1,
  "codLoja": "L01",
  "cliente": { "nome": "Ana Souza", "documento": "12345678901", "email": "ana@exemplo.com" },
  "periodo": "QUINZENAL",
  "modalidade": "RETIRADA",
  "dataProgramada": "2026-11-19",
  "endereco": null,
  "itens": [{ "codigo": "EQ-1001", "quantidade": 1, "valorUnitario": 629.3 }],
  "usarLocacaoProtegida": true,
  "valorLocacaoProtegida": 62.93,
  "taxaEntrega": 0,
  "valorTotal": 692.23
}
```

| Campo | Regra |
|---|---|
| `periodo` | `DIARIO`, `SEMANAL`, `QUINZENAL` ou `MENSAL` |
| `modalidade` | `RETIRADA` ou `ENTREGA` |
| `endereco` | obrigatório quando `ENTREGA`: `cep`, `logradouro`, `numero`, `cidade`, `uf` |
| `dataProgramada` | `AAAA-MM-DD` |
| `itens[].valorUnitario` | igual ao preço da tabela da loja para o período |
| `itens[].quantidade` | entre 1 e o estoque da loja |
| `valorTotal` | soma dos itens + `valorLocacaoProtegida` + `taxaEntrega` |

- `201` — `{ "idPreLocacao": "PL-0001", "status": "recebida" }`
- `422` — `{ "erro": "<motivo>" }`

### `GET /v1/pre-locacoes`

Caixa de entrada do ERP: **toda** tentativa recebida, aceita ou recusada, com o
payload original. Aceita `?status=recebida` ou `?status=rejeitada`.

```json
{
  "total": 1,
  "itens": [{
    "idPreLocacao": null,
    "status": "rejeitada",
    "motivo": "valorTotal divergente: ...",
    "recebidaEm": "2026-11-18T13:05:12.345Z",
    "payload": { "...": "..." }
  }]
}
```

---

## Estrutura do projeto

```
server.js                 sobe site + ERP de uma versão
src/site.js               rotas HTTP do site
src/erp/                  simulador do ERP das lojas (servidor, carga de dados, cliente HTTP)
src/catalogo/v1.js|v2.js  catálogo e preços por loja
src/calendario/v1.js|v2.js  dias úteis e feriados
src/frete/v1.js|v2.js     opções de frete por loja
src/checkout/             resumo, criação do pedido e envio da pré-locação
public/v1|v2/             tela de cada versão
suite-ia/                 suíte E2E gerada por IA (objeto de revisão)
```
