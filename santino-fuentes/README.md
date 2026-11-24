# Aguinaldo

App de la Tarea 1 del Pura Vida Bootcamp. Un **aguinaldo** es un pago en XLM de Testnet que el destinatario no puede tocar hasta una fecha. Si no lo reclama a tiempo, quien lo envió lo recupera.

No hay backend ni claves privadas. La firma sale de Freighter / Varial (u otra wallet del kit).

## Qué hay que ver

1. Sección **Conectar wallet**.
2. Crear un aguinaldo (monto, destinatario, “se abre en 60 segundos”).
3. Reclamarlo cuando se abre, o recuperarlo si pasa la ventana.

Para probarlo con una sola wallet, dejá el destinatario vacío: se usa tu misma cuenta.

## Cómo correrla

```bash
cd santino-fuentes
npm install
npm run dev
```

Abrí la URL de Vite. En la extensión Freighter/Varial poné red **Testnet**. Si la cuenta no existe, el botón **Pedir XLM de prueba** llama a Friendbot.

## Cómo está hecho en Stellar

Operaciones clásicas, no un contrato Soroban:

- `createClaimableBalance` con **dos claimants** (CAP-23)
- Destinatario: `AND(NOT(BEFORE_ABSOLUTE_TIME(unlock)), BEFORE_ABSOLUTE_TIME(expiry))`
- Quien envía: `NOT(BEFORE_ABSOLUTE_TIME(expiry))` para no dejar fondos trabados
- Solo **XLM nativo** (no hace falta trustline)
- Listado: `GET /claimable_balances?claimant=G...` en Horizon Testnet
- La wallet firma el XDR; el envío va por Horizon

Docs: [Claimable balances](https://developers.stellar.org/docs/build/guides/transactions/claimable-balances)

## Cómo usé Stellar Raven

MCP `https://raven.stellar.org/mcp`. Consultas durante el desarrollo:

- Skill `skills.stellar-dev.dapp`: dependencias, Wallets Kit v2 (`authModal`, `signTransaction`), Horizon para txs clásicas
- `stellarDocs.get_doc_page` de `/docs/build/guides/transactions/claimable-balances`
- `stellarDocs.get_doc_page` de `/docs/data/apis/horizon/api-reference/list-all-claimable-balances` (`claimant`)

## Autor

Santino Fuentes · carpeta `santino-fuentes/` · rama `feature/santino-fuentes`
