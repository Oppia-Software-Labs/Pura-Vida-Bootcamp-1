# Notas de desarrollo con Stellar Raven MCP

Durante la construcción de **Pura Vida Stellar** se conectó y consultó el servidor MCP oficial de Stellar (`https://raven.stellar.org/mcp`) directamente desde el agente de desarrollo.

## Recursos consultados en Stellar Raven

1. **Skill `skills.stellar-dev.dapp`** (secciones `recommended-dependencies`, `sdk-initialization`, `wallet-integration`, `transaction-building`, `transaction-submission`, `transaction-ux-checklist`, `file:react.md`, `file:data-fetching.md`):
   - **SDK v16+/v17:** Confirmó que `@stellar/stellar-sdk` requiere Node.js 22+, incluye `@stellar/stellar-base` integrado, es ESM-first y utiliza `fetch` nativo.
   - **Stellar Wallets Kit v2 en JSR:** Indicó el cambio respecto a v1 (`@creit.tech/stellar-wallets-kit` en npm): en v2 el paquete vive en JSR como `@creit-tech/stellar-wallets-kit`, funciona como singleton estático (`StellarWalletsKit.init({ modules: defaultModules(), network: Networks.TESTNET })`) y simplifica la conexión en una sola llamada `StellarWalletsKit.authModal()`.
   - **Manejo de cuentas sin fondear:** Recomendó capturar `NotFoundError` de `@stellar/stellar-sdk` al llamar `horizon.loadAccount(address)` para ofrecer fondeo con Friendbot.
   - **Checklist UX de transacciones:** Se aplicaron estados de carga durante firma y envío, vista previa de destino y monto antes de firmar, prevención de doble envío, visualización inmediata del hash de transacción y decodificación de `error.response?.data?.extras?.result_codes`.
2. **Operaciones de `stellarDocs`** (`stellarDocs.search_wallet_dapp_docs`, `stellarDocs.search_rpc_horizon_data_docs`, `stellarDocs.search_docs`):
   - Verificación de endpoints de Horizon para cuentas (`/accounts/{account_id}`) y pagos recientes (`/accounts/{account_id}/payments` con `order=desc` y `limit=10`).
   - Confirmación del flujo de fondeo en Testnet vía `https://friendbot.stellar.org?addr=...`.
