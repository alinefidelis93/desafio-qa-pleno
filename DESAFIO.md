# Desafio técnico — QA Pleno

## A situação

A **v2 da Locação Online está agendada para produção na sexta-feira.**

A grande novidade é a **entrega no endereço**, pedida há meses pelas lojas. O
time de desenvolvimento entregou o release candidate e o changelog, o produto
aprovou a especificação e as lojas já foram avisadas.

Um colega do time adiantou uma suíte E2E para a v2, gerada com ajuda de IA, e
disse que "está tudo verde".

Falta alguém validar se a v2 pode subir. **Esse alguém é você.**

Contexto que importa: cada pedido do site vira uma **pré-locação no ERP da loja**.
É dali que a loja separa o equipamento, emite contrato e cobra. Pedido que o
cliente acha que fez, mas que a loja não recebeu, é cliente esperando betoneira na
obra que não vai chegar. Valor errado é cobrança errada ou discussão no balcão.

## O que você tem em mãos

| Arquivo | O que é |
|---|---|
| `README.md` | Regras vigentes (v1) e contratos de API do site e do ERP |
| `SPEC-entrega-no-endereco.md` | A especificação da feature nova, aprovada pelo produto |
| `CHANGELOG-v2.md` | O que o time de desenvolvimento diz que mudou |
| `suite-ia/` | A suíte E2E gerada com IA pelo colega |

E as duas versões, rodáveis lado a lado, cada uma com seu simulador do ERP:

```bash
node server.js v1   # produção hoje     -> http://localhost:3001 (ERP :4001)
node server.js v2   # release candidate -> http://localhost:3002 (ERP :4002)
```

Node 18 ou superior. A aplicação não tem dependências. Veja no README como fixar
a data de referência com `HOJE` — você vai precisar.

## O que entregar

Preencha os arquivos que já estão no repositório:

| Arquivo | O que se espera |
|---|---|
| `ESTRATEGIA.md` | Sua análise de risco, sua priorização e **o que você decidiu não testar, com justificativa** |
| `MATRIZ_COBERTURA.md` | Risco × cobertura: o que foi coberto, como, em que camada, e o que ficou descoberto |
| `bugs/` | Um arquivo por problema encontrado, no formato de `bugs/_TEMPLATE.md` |
| `regressao/` | Uma suíte automatizada que compare a v1 e a v2 (detalhes abaixo) |
| `REVISAO_SUITE_IA.md` | Sua revisão da suíte em `suite-ia/` |
| `USO_DE_IA.md` | Como você usou IA no desafio |
| `PERGUNTAS_AO_PO.md` | O que você precisou perguntar antes de assumir comportamento |
| `RELEASE_DECISION.md` | Seu go/no-go, justificado |

### Sobre a suíte de regressão (`regressao/`)

Ferramenta livre, mas a suíte precisa ter **as duas camadas**:

1. **E2E pela interface** — pelo menos o fluxo de checkout que você considera de
   maior risco, de ponta a ponta na tela. Playwright é o que usamos no time, mas
   Cypress, Selenium ou outro também valem.
2. **API / integração** — testes que validem o contrato do site **e o que de fato
   chega ao ERP** (a caixa de entrada `GET /v1/pre-locacoes` existe para isso).

Exigências:

- **Roda com um comando**, documentado em `regressao/README.md`, numa máquina
  limpa.
- **Roda contra as duas versões** e deixa claro o que muda entre v1 e v2.
- **Determinística**: não depende da data em que é executada nem da ordem dos
  testes.
- Deixe claro quais testes **falham na v2 de propósito** — porque encontraram um
  problema — e quais devem passar. Um teste que comprova um bug deve ficar
  vermelho na v2: não ajuste o esperado ao comportamento atual. A forma de
  sinalizar (tag no nome, anotação, projeto separado, `test.fail()`...) é escolha
  sua; explique no `regressao/README.md`.

O que avaliamos não é a ferramenta: é a escolha dos cenários, a confiabilidade, a
legibilidade e se a suíte de fato pega o que se propõe a pegar.

**Diferencial:** um workflow do GitHub Actions que rode sua suíte a cada push.
Diga o que você espera ver no pipeline: na v1, tudo verde; na v2, como os bugs
conhecidos aparecem sem esconder uma regressão nova.

### Sobre a suíte gerada por IA (`REVISAO_SUITE_IA.md`)

Revise `suite-ia/` como revisaria o MR de um colega: o que ela realmente garante,
o que ela diz que garante e não garante, e o que precisaria mudar para você
confiar nela. Você pode reaproveitar o que prestar na sua própria suíte em `regressao/`.

### Sobre o uso de IA (`USO_DE_IA.md`)

**Usar IA é permitido e esperado.** Não queremos saber se você usou, e sim
**como**: para quê, com que contexto, o que você conferiu, onde ela errou e como
você percebeu. Esconder o uso conta contra; declarar com critério conta a favor.

### Sobre o código

O código da aplicação está no repositório e **ler é permitido** — apontar a causa
provável conta a favor. Mas o **esperado** vem da documentação (README, SPEC),
nunca do código: o código mostra o que o sistema faz, não o que deveria fazer.

### Sobre os problemas encontrados

Para cada um, queremos **impacto concreto**. Não basta "o preço fica errado".
Quais equipamentos, em quais lojas, quanto em reais, quantas combinações do
catálogo? As APIs do site e do ERP respondem isso: consulte e mostre o número e o
comando.

### Sobre ambiguidade

Se a especificação, o changelog e o README não concordarem, **não adivinhe em
silêncio**. Registre em `PERGUNTAS_AO_PO.md`. Decidir sob incerteza também é
avaliado, e a decisão certa nem sempre é escolher um lado.

## Tempo

Estimamos **cerca de 4 horas de trabalho** para uma entrega sólida. Você tem
**5 dias corridos** para encaixar essas horas na sua rotina.

Não queremos que você gaste 20 horas. Se o tempo acabar, corte escopo com
critério e registre o corte na `ESTRATEGIA.md` — isso conta a favor. Uma
referência de divisão, não obrigatória:

| Etapa | Tempo |
|---|---|
| Ler a documentação, subir as versões e explorar | 45 min |
| Estratégia e priorização | 30 min |
| Investigar e reportar problemas | 1 h |
| Automação | 1 h 15 min |
| Revisão da suíte de IA, perguntas ao PO e decisão de release | 30 min |

## Prazo e forma de entrega

- **Prazo: 5 dias corridos** a partir do recebimento.
- Crie um **repositório próprio** no GitHub com o conteúdo deste (use "Use this
  template" ou clone e envie para um repositório novo). **Não faça fork** —
  forks ficam visíveis para outros candidatos.
- O repositório pode ser público, ou privado com acesso para quem te enviou o
  desafio.
- **Commits incrementais.** Queremos ver seu raciocínio em etapas, não um commit
  único no último dia.
- **Mensagens no padrão [Conventional Commits](https://www.conventionalcommits.org/pt-br/v1.0.0/)**
  (`tipo: descrição`), como usamos no time. Exemplos:
  `docs: adiciona análise de risco da entrega`,
  `test: cobre recusa de pré-locação pelo ERP`,
  `ci: roda a suíte de regressão no GitHub Actions`.
- No envio: nome completo, link do repositório e LinkedIn.

## Como avaliamos

| Eixo | O que olhamos |
|---|---|
| Estratégia e priorização | Você atacou primeiro o que causa mais prejuízo para cliente e loja? |
| Investigação e report | Reprodutível por outra pessoa, com impacto medido e causa provável |
| Suíte de regressão | Roda com um comando, compara v1 e v2, é determinística, cobre UI e integração, é legível |
| Olhar crítico sobre IA | Revisão da suíte gerada e uso declarado com critério |
| Decisão de release | Go/no-go coerente com o que você mesmo encontrou |
| Comunicação | Clareza para quem vai ler e decidir junto |
| Higiene de engenharia | Commits incrementais em Conventional Commits, organização, instruções de execução |

Não existe pontuação por quantidade de problemas. Três problemas bem
investigados, medidos e priorizados valem mais do que quinze itens rasos.

Depois da entrega, conversamos com você por cerca de 45 minutos sobre o que você
fez. Esteja pronto para rodar sua suíte ao vivo e explicar suas escolhas.
