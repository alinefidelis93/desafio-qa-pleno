# Suíte E2E — Locação Online v2

Suíte gerada com IA a partir da SPEC de entrega no endereço e das telas da v2.
Cobre **100% do checkout**: catálogo, retirada na loja, entrega no endereço e API.

Rodei aqui e está tudo verde ✅

## Como rodar

```bash
cd suite-ia
npm install
npx playwright install chromium
BASE_URL=http://localhost:3002 npx playwright test
```

## Cobertura

| Arquivo | O que cobre |
|---|---|
| `catalogo.spec.ts` | Preços por loja e equipamentos indisponíveis |
| `checkout-retirada.spec.ts` | Fluxo completo com retirada na loja |
| `checkout-entrega.spec.ts` | Fluxo completo com entrega no endereço e frete |
| `api.spec.ts` | Criação de pedido, consulta e integração com o ERP |
