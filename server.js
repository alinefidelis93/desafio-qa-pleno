'use strict';

const { criarSite } = require('./src/site');
const { iniciarErp, resetar: resetarErp, CHAVE_API } = require('./src/erp/servidor');
const { criarClienteErp } = require('./src/erp/cliente');
const relogio = require('./src/relogio');
const store = require('./src/store');

const PORTAS = {
  v1: { site: 3001, erp: 4001 },
  v2: { site: 3002, erp: 4002 },
};

const versao = process.argv[2];
if (!PORTAS[versao]) {
  console.error('Uso: node server.js v1 | v2');
  process.exit(1);
}

async function main() {
  const portas = PORTAS[versao];
  const hoje = relogio.hoje(); // valida HOJE logo na subida

  const catalogo = require(`./src/catalogo/${versao}`);
  const ctx = {
    versao,
    hoje: relogio.hoje,
    store,
    catalogo,
    calendario: require(`./src/calendario/${versao}`),
    frete: require(`./src/frete/${versao}`),
    checkout: require(`./src/checkout/${versao}`),
    erp: criarClienteErp(`http://localhost:${portas.erp}`, CHAVE_API),
    resetar() {
      store.resetar();
      catalogo.limparCache();
      resetarErp();
    },
  };

  await iniciarErp(portas.erp);
  const site = criarSite(ctx);
  site.once('error', (erro) => {
    console.error(erro.code === 'EADDRINUSE' ? `Porta ${portas.site} já está em uso.` : erro.message);
    process.exit(1);
  });
  site.listen(portas.site, () => {
    console.log(`Locação Online ${versao}  -> http://localhost:${portas.site}`);
    console.log(`ERP das lojas (${versao}) -> http://localhost:${portas.erp}`);
    console.log(`Data de referência: ${hoje}${process.env.HOJE ? ' (fixada por HOJE)' : ''}`);
  });
}

main().catch((erro) => {
  console.error(erro.code === 'EADDRINUSE'
    ? `Porta ${erro.port} já está em uso. A versão ${versao} já está rodando em outro terminal?`
    : erro.message);
  process.exit(1);
});
