'use strict';

const PERIODOS = ['diario', 'semanal', 'quinzenal', 'mensal'];
const NOME_PERIODO = { diario: 'Diário', semanal: 'Semanal', quinzenal: 'Quinzenal', mensal: 'Mensal' };
const DIA_SEMANA = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];

const app = document.getElementById('app');
let lojas = [];
let checkout = lerSessao('checkout');

// ---------- utilitários ----------

async function api(metodo, caminho, corpo) {
  const resposta = await fetch(caminho, {
    method: metodo,
    headers: { 'Content-Type': 'application/json' },
    body: corpo === undefined ? undefined : JSON.stringify(corpo),
  });
  const dados = await resposta.json().catch(() => ({}));
  if (!resposta.ok) throw new Error(dados.erro || `Erro ${resposta.status}`);
  return dados;
}

function lerSessao(chave) {
  try {
    return JSON.parse(sessionStorage.getItem(chave));
  } catch {
    return null;
  }
}

function salvarCheckout() {
  sessionStorage.setItem('checkout', JSON.stringify(checkout));
}

function lojaAtual() {
  return localStorage.getItem('loja') || 'L01';
}

function nomeDaLoja(codLoja) {
  return (lojas.find((l) => l.codLoja === codLoja) || {}).nome || codLoja;
}

function brl(valor) {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function dataBr(iso) {
  const [ano, mes, dia] = iso.split('-');
  const semana = DIA_SEMANA[new Date(Date.UTC(+ano, mes - 1, +dia)).getUTCDay()];
  return `${dia}/${mes}/${ano} (${semana})`;
}

function esc(texto) {
  return String(texto ?? '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

function passos(atual) {
  const nomes = ['Período', 'Seus dados', 'Como receber', 'Resumo'];
  return `<ol class="passos" aria-label="Etapas do pedido">${nomes.map((nome, i) => (
    `<li class="${i === atual ? 'atual' : ''}"${i === atual ? ' aria-current="step"' : ''}>${nome}</li>`
  )).join('')}</ol>`;
}

async function itemDoCheckout() {
  const { itens } = await api('GET', `/api/catalogo?loja=${checkout.loja}`);
  return itens.find((i) => i.codigo === checkout.codigo);
}

// ---------- telas ----------

async function telaCatalogo() {
  const loja = lojaAtual();
  const { itens } = await api('GET', `/api/catalogo?loja=${loja}`);
  app.innerHTML = `
    <h1>Equipamentos para locação</h1>
    <p class="sub">Preços e disponibilidade da loja ${esc(nomeDaLoja(loja))}</p>
    <div class="grade">${itens.map(cartao).join('')}</div>`;

  app.querySelectorAll('.cartao button').forEach((botao) => {
    botao.addEventListener('click', () => {
      const item = itens.find((i) => i.codigo === botao.closest('.cartao').dataset.codigo);
      checkout = {
        loja,
        codigo: item.codigo,
        quantidade: 1,
        periodo: item.periodosDisponiveis[0],
        locacaoProtegida: false,
        cliente: { nome: '', documento: '', email: '' },
        modalidade: 'RETIRADA',
        endereco: null,
        freteId: null,
        dataProgramada: null,
      };
      salvarCheckout();
      location.hash = '#/checkout/periodo';
    });
  });
}

function cartao(item) {
  const precos = PERIODOS
    .filter((p) => item.precos[p] !== null)
    .map((p) => `<div><dt>${NOME_PERIODO[p]}</dt><dd>${brl(item.precos[p])}</dd></div>`)
    .join('');
  return `
    <article class="cartao" data-codigo="${esc(item.codigo)}">
      <h2>${esc(item.descricao)}</h2>
      <p class="codigo">${esc(item.codigo)}</p>
      <dl class="precos">${precos}</dl>
      <p class="estoque${item.disponivel ? '' : ' indisponivel'}">
        ${item.disponivel ? `${item.estoque} disponíveis` : 'Indisponível nesta loja'}
      </p>
      <button type="button" ${item.disponivel ? '' : 'disabled'}>Alugar</button>
    </article>`;
}

async function telaPeriodo() {
  const item = await itemDoCheckout();
  if (!item) return voltarAoCatalogo();

  app.innerHTML = `
    ${passos(0)}
    <h1>Período e opcionais</h1>
    <p class="sub">${esc(item.descricao)} · ${esc(nomeDaLoja(checkout.loja))}</p>
    <form id="form-periodo" novalidate>
      <fieldset>
        <legend>Período de locação</legend>
        ${item.periodosDisponiveis.map((p) => `
          <label class="opcao">
            <input type="radio" name="periodo" value="${p}" ${p === checkout.periodo ? 'checked' : ''}>
            ${NOME_PERIODO[p]} — ${brl(item.precos[p])}
          </label>`).join('')}
      </fieldset>
      <label>Quantidade
        <input type="number" id="quantidade" min="1" max="${item.estoque}" value="${checkout.quantidade}">
      </label>
      <label class="check">
        <input type="checkbox" id="locacao-protegida" ${checkout.locacaoProtegida ? 'checked' : ''}>
        Locação Protegida (+${Math.round(item.lpPercentual * 100)}% sobre o valor da locação)
      </label>
      <p class="erro" role="alert" id="erro"></p>
      <div class="acoes">
        <a href="#/" class="secundario">Voltar</a>
        <button type="submit">Continuar</button>
      </div>
    </form>`;

  document.getElementById('form-periodo').addEventListener('submit', (evento) => {
    evento.preventDefault();
    const quantidade = Number(document.getElementById('quantidade').value);
    if (!Number.isInteger(quantidade) || quantidade < 1 || quantidade > item.estoque) {
      document.getElementById('erro').textContent = `Informe uma quantidade entre 1 e ${item.estoque}.`;
      return;
    }
    checkout.periodo = app.querySelector('input[name="periodo"]:checked').value;
    checkout.quantidade = quantidade;
    checkout.locacaoProtegida = document.getElementById('locacao-protegida').checked;
    salvarCheckout();
    location.hash = '#/checkout/dados';
  });
}

function telaDados() {
  const c = checkout.cliente;
  app.innerHTML = `
    ${passos(1)}
    <h1>Seus dados</h1>
    <form id="form-dados">
      <label>Nome completo <input type="text" id="nome" value="${esc(c.nome)}" required></label>
      <label>CPF <input type="text" id="cpf" inputmode="numeric" value="${esc(c.documento)}" required></label>
      <label>E-mail <input type="email" id="email" value="${esc(c.email)}" required></label>
      <p class="erro" role="alert" id="erro"></p>
      <div class="acoes">
        <a href="#/checkout/periodo" class="secundario">Voltar</a>
        <button type="submit">Continuar</button>
      </div>
    </form>`;

  document.getElementById('form-dados').addEventListener('submit', (evento) => {
    evento.preventDefault();
    const documento = document.getElementById('cpf').value.replace(/\D/g, '');
    if (documento.length !== 11) {
      document.getElementById('erro').textContent = 'CPF deve ter 11 dígitos.';
      return;
    }
    checkout.cliente = {
      nome: document.getElementById('nome').value.trim(),
      documento,
      email: document.getElementById('email').value.trim(),
    };
    salvarCheckout();
    location.hash = '#/checkout/como-receber';
  });
}

async function telaComoReceber() {
  const { datas } = await api('GET', `/api/checkout/datas?loja=${checkout.loja}`);
  if (!datas.includes(checkout.dataProgramada)) checkout.dataProgramada = datas[0];

  app.innerHTML = `
    ${passos(2)}
    <h1>Como receber</h1>
    <form id="form-receber" novalidate>
      <fieldset>
        <legend>Modalidade</legend>
        <label class="opcao">
          <input type="radio" name="modalidade" value="RETIRADA" ${checkout.modalidade === 'RETIRADA' ? 'checked' : ''}>
          Retirar na loja ${esc(nomeDaLoja(checkout.loja))}
        </label>
        <label class="opcao">
          <input type="radio" name="modalidade" value="ENTREGA" ${checkout.modalidade === 'ENTREGA' ? 'checked' : ''}>
          Receber no endereço
        </label>
      </fieldset>

      <section id="bloco-entrega" hidden>
        <h2>Endereço de entrega</h2>
        <p id="endereco-atual"></p>
        <button type="button" id="abrir-endereco" class="secundario">Adicionar endereço</button>
        <fieldset id="opcoes-frete" hidden>
          <legend>Frete</legend>
          <div id="lista-frete"></div>
        </fieldset>
      </section>

      <label>Data de recebimento
        <select id="data">
          ${datas.map((d) => `<option value="${d}" ${d === checkout.dataProgramada ? 'selected' : ''}>${dataBr(d)}</option>`).join('')}
        </select>
      </label>

      <div id="modal-endereco" class="modal" role="dialog" aria-modal="true" aria-labelledby="titulo-endereco" hidden>
        <div class="modal-caixa">
          <h2 id="titulo-endereco">Novo endereço</h2>
          <label>CEP <input type="text" id="cep" inputmode="numeric" maxlength="9"></label>
          <label>Logradouro <input type="text" id="logradouro"></label>
          <label>Número <input type="text" id="numero"></label>
          <label>Cidade <input type="text" id="cidade"></label>
          <label>UF <input type="text" id="uf" maxlength="2"></label>
          <p class="erro" role="alert" id="erro-endereco"></p>
          <div class="acoes">
            <button type="button" id="cancelar-endereco" class="secundario">Cancelar</button>
            <button id="salvar-endereco">Salvar endereço</button>
          </div>
        </div>
      </div>

      <p class="erro" role="alert" id="erro"></p>
      <div class="acoes">
        <a href="#/checkout/dados" class="secundario">Voltar</a>
        <button type="submit">Continuar</button>
      </div>
    </form>`;

  const form = document.getElementById('form-receber');
  const blocoEntrega = document.getElementById('bloco-entrega');
  const modal = document.getElementById('modal-endereco');
  const campo = (id) => document.getElementById(id);

  function mostrarEndereco() {
    const e = checkout.endereco;
    campo('endereco-atual').textContent = e
      ? `${e.logradouro}, ${e.numero} — ${e.cidade}/${e.uf} — CEP ${e.cep}`
      : 'Nenhum endereço cadastrado.';
    campo('abrir-endereco').textContent = e ? 'Alterar endereço' : 'Adicionar endereço';
  }

  async function carregarFrete() {
    if (!checkout.endereco) {
      campo('opcoes-frete').hidden = true;
      return;
    }
    const { opcoes } = await api('GET', `/api/checkout/frete?loja=${checkout.loja}`);
    campo('lista-frete').innerHTML = opcoes.map((o) => `
      <label class="opcao">
        <input type="radio" name="frete" value="${o.id}" ${o.id === checkout.freteId ? 'checked' : ''}>
        ${esc(o.nome)} — ${brl(o.valor)}
      </label>`).join('');
    campo('opcoes-frete').hidden = false;
    campo('lista-frete').querySelectorAll('input').forEach((radio) => {
      radio.addEventListener('change', () => {
        checkout.freteId = radio.value;
        salvarCheckout();
      });
    });
  }

  function atualizarModalidade() {
    blocoEntrega.hidden = checkout.modalidade !== 'ENTREGA';
  }

  form.querySelectorAll('input[name="modalidade"]').forEach((radio) => {
    radio.addEventListener('change', () => {
      checkout.modalidade = radio.value;
      if (radio.value === 'RETIRADA') checkout.freteId = null;
      salvarCheckout();
      atualizarModalidade();
    });
  });

  campo('abrir-endereco').addEventListener('click', () => {
    const e = checkout.endereco || {};
    ['cep', 'logradouro', 'numero', 'cidade', 'uf'].forEach((id) => { campo(id).value = e[id] || ''; });
    campo('erro-endereco').textContent = '';
    modal.hidden = false;
    campo('cep').focus();
  });

  campo('cancelar-endereco').addEventListener('click', () => {
    modal.hidden = true;
  });

  campo('salvar-endereco').addEventListener('click', async () => {
    const endereco = {
      cep: campo('cep').value.replace(/\D/g, ''),
      logradouro: campo('logradouro').value.trim(),
      numero: campo('numero').value.trim(),
      cidade: campo('cidade').value.trim(),
      uf: campo('uf').value.trim().toUpperCase(),
    };
    if (endereco.cep.length !== 8 || !endereco.logradouro || !endereco.numero || !endereco.cidade || endereco.uf.length !== 2) {
      campo('erro-endereco').textContent = 'Preencha o endereço completo (CEP com 8 dígitos).';
      return;
    }
    checkout.endereco = endereco;
    checkout.freteId = null;
    salvarCheckout();
    modal.hidden = true;
    mostrarEndereco();
    await carregarFrete();
  });

  form.addEventListener('submit', (evento) => {
    evento.preventDefault();
    checkout.dataProgramada = campo('data').value;
    if (checkout.modalidade === 'ENTREGA' && !checkout.endereco) {
      campo('erro').textContent = 'Informe o endereço de entrega.';
      return;
    }
    salvarCheckout();
    location.hash = '#/checkout/resumo';
  });

  mostrarEndereco();
  atualizarModalidade();
  await carregarFrete();
}

async function telaResumo() {
  const r = await api('POST', '/api/checkout/resumo', {
    loja: checkout.loja,
    codigo: checkout.codigo,
    quantidade: checkout.quantidade,
    periodo: checkout.periodo,
    locacaoProtegida: checkout.locacaoProtegida,
    modalidade: checkout.modalidade,
    freteId: checkout.freteId,
  });
  const item = r.itens[0];
  const e = checkout.endereco;
  const recebimento = r.modalidade === 'ENTREGA'
    ? `Entrega em ${esc(e.logradouro)}, ${esc(e.numero)} — ${esc(e.cidade)}/${esc(e.uf)}`
    : `Retirada na loja ${esc(r.loja.nome)}`;

  app.innerHTML = `
    ${passos(3)}
    <h1>Resumo do pedido</h1>
    <form id="form-resumo" novalidate>
      <table>
        <thead><tr><th>Equipamento</th><th>Período</th><th class="valor">Qtd.</th><th class="valor">Valor unitário</th><th class="valor">Subtotal</th></tr></thead>
        <tbody><tr>
          <td>${esc(item.descricao)}</td>
          <td>${NOME_PERIODO[r.periodo]}</td>
          <td class="valor">${item.quantidade}</td>
          <td class="valor">${brl(item.valorUnitario)}</td>
          <td class="valor">${brl(item.subtotal)}</td>
        </tr></tbody>
      </table>
      <dl class="totais">
        <dt>Equipamentos</dt><dd id="valor-equipamentos">${brl(r.subtotalEquipamentos)}</dd>
        ${r.locacaoProtegida ? `<dt>Locação Protegida (${Math.round(r.lpPercentual * 100)}%)</dt><dd id="valor-lp">${brl(r.valorLocacaoProtegida)}</dd>` : ''}
        ${r.modalidade === 'ENTREGA' ? `<dt>Frete${r.frete ? ` (${esc(r.frete.nome)})` : ''}</dt><dd id="valor-frete">${brl(r.taxaEntrega)}</dd>` : ''}
        <dt class="total">Total</dt><dd class="total" id="valor-total">${brl(r.total)}</dd>
      </dl>
      <p>${recebimento} · ${dataBr(checkout.dataProgramada)}</p>
      <p>Cliente: ${esc(checkout.cliente.nome)} · CPF ${esc(checkout.cliente.documento)}</p>
      <label class="check"><input type="checkbox" id="termos"> Li e aceito os termos de locação</label>
      <p class="erro" role="alert" id="erro"></p>
      <div class="acoes">
        <a href="#/checkout/como-receber" class="secundario">Voltar</a>
        <button type="submit">Confirmar locação</button>
      </div>
    </form>`;

  document.getElementById('form-resumo').addEventListener('submit', async (evento) => {
    evento.preventDefault();
    const erro = document.getElementById('erro');
    if (!document.getElementById('termos').checked) {
      erro.textContent = 'É necessário aceitar os termos de locação.';
      return;
    }
    try {
      const pedido = await api('POST', '/api/pedidos', {
        loja: checkout.loja,
        codigo: checkout.codigo,
        quantidade: checkout.quantidade,
        periodo: checkout.periodo,
        locacaoProtegida: checkout.locacaoProtegida,
        modalidade: checkout.modalidade,
        freteId: checkout.freteId,
        endereco: checkout.modalidade === 'ENTREGA' ? checkout.endereco : null,
        cliente: checkout.cliente,
        dataProgramada: checkout.dataProgramada,
        aceiteTermos: true,
      });
      checkout = null;
      sessionStorage.removeItem('checkout');
      location.hash = `#/pedido/${pedido.id}`;
    } catch (falha) {
      erro.textContent = falha.message;
    }
  });
}

async function telaPedido(id) {
  const pedido = await api('GET', `/api/pedidos/${id}`);
  app.innerHTML = `
    <section class="painel" id="confirmacao">
      <h1>Pedido #${pedido.id} enviado para a loja</h1>
      <p>A loja ${esc(pedido.loja.nome)} vai confirmar a disponibilidade e entrar em contato pelo e-mail ${esc(pedido.cliente.email)}.</p>
      <p>Total: <strong>${brl(pedido.total)}</strong></p>
      <a href="#/" class="secundario">Voltar ao catálogo</a>
    </section>`;
}

function voltarAoCatalogo() {
  location.hash = '#/';
}

// ---------- roteamento ----------

async function rotear() {
  const rota = location.hash.replace(/^#/, '') || '/';
  try {
    if (rota === '/') return await telaCatalogo();
    const pedido = rota.match(/^\/pedido\/(\d+)$/);
    if (pedido) return await telaPedido(pedido[1]);
    if (!checkout) return voltarAoCatalogo();
    if (rota === '/checkout/periodo') return await telaPeriodo();
    if (rota === '/checkout/dados') return telaDados();
    if (rota === '/checkout/como-receber') return await telaComoReceber();
    if (rota === '/checkout/resumo') return await telaResumo();
    return voltarAoCatalogo();
  } catch (falha) {
    app.innerHTML = `<p class="erro" role="alert">${esc(falha.message)}</p><a href="#/" class="secundario">Voltar ao catálogo</a>`;
  }
}

async function iniciar() {
  const [{ versao }, dadosLojas] = await Promise.all([api('GET', '/api/versao'), api('GET', '/api/lojas')]);
  lojas = dadosLojas.itens;
  document.getElementById('versao').textContent = versao;

  const seletor = document.getElementById('loja');
  seletor.innerHTML = lojas.map((l) => `<option value="${l.codLoja}">${esc(l.nome)}</option>`).join('');
  seletor.value = lojaAtual();
  seletor.addEventListener('change', () => {
    localStorage.setItem('loja', seletor.value);
    checkout = null;
    sessionStorage.removeItem('checkout');
    if (location.hash === '' || location.hash === '#/') rotear();
    else location.hash = '#/';
  });

  document.getElementById('resetar').addEventListener('click', async () => {
    await api('POST', '/_reset');
    checkout = null;
    sessionStorage.clear();
    if (location.hash === '' || location.hash === '#/') rotear();
    else location.hash = '#/';
  });

  window.addEventListener('hashchange', rotear);
  rotear();
}

iniciar();
