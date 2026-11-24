# Uso de Stellar Raven

Usé [Stellar Raven](https://raven.stellar.org/) como servidor MCP conectado a mi asistente de código (Claude Code) mientras desarrollaba la app. Estas son las consultas que hice y lo que saqué de cada una.

## 1. Cómo integrar una wallet en un frontend

- **`search`**: `"connect wallet Stellar Wallets Kit Freighter frontend"`
- **Resultado:** la skill `skills.stellar-dev.dapp` y la operación `stellarDocs.search_wallet_dapp_docs`.
- **`execute`**: leí las secciones `recommended-dependencies`, `wallet-integration`, `sdk-initialization`, `transaction-building` y `transaction-submission` de la skill.

Qué apliqué:
- `@stellar/stellar-sdk` v16+ requiere Node 22, es ESM-first y ya incluye `stellar-base`, así que no hay que instalarlo aparte.
- **Stellar Wallets Kit v2** es un singleton estático: `StellarWalletsKit.init({ modules: defaultModules(), network: Networks.TESTNET })` se llama una vez, y `authModal()` abre el selector y devuelve la dirección (`src/lib/wallet.ts`, `src/hooks/useWallet.ts`).
- Configuración de Testnet (Horizon `https://horizon-testnet.stellar.org`, `Networks.TESTNET`, Friendbot) en `src/lib/stellar.ts`.
- El patrón de pago clásico `TransactionBuilder` + `Operation.payment` + `setTimeout(180)`, que se envía por Horizon porque no es una transacción de contrato (`src/lib/tip.ts`).

## 2. Friendbot, saldos e historial de pagos

- **`execute`**: `stellarDocs.search_docs({ query: "fund testnet account friendbot" })` y `stellarDocs.search_wallet_dapp_docs({ query: "list payments for account horizon" })`.
- **Resultado:** las páginas *Fund testnet account*, *Querying Data → fetchAccountBalances* y *Build a Payment App with the JS SDK*.

Qué apliqué: el fondeo con Friendbot (`useAccount.ts`), el saldo con `horizon.loadAccount` y el historial con `horizon.payments().forAccount()` (`HistorySection.tsx`).

## 3. Checklist de UX para transacciones

La sección `transaction-ux-checklist` de la skill guió el flujo de envío:

| Ítem del checklist | Implementación |
|---|---|
| Estado de carga durante la firma | El botón muestra “Esperando tu firma en la wallet…” |
| Mostrar el hash al enviar | Enlace a Stellar Expert |
| Errores claros (wallet no conectada, firma rechazada, saldo insuficiente, cuenta sin fondos, red equivocada, tx expirada) | `explainError()` en `tip.ts`, aviso de red en `WalletSection` y el botón de Friendbot |
| Evitar doble envío | Formulario deshabilitado mientras `busy` |
| Mostrar destino y monto antes de firmar | Paso “Revisar propina” → confirmación |

## Verificación

- Probé `buildTipTx` + `submitSigned` contra **Testnet real** con dos cuentas temporales: la primera propina creó la cuenta destino (`createAccount`) y la segunda fue un `payment` con memo. El saldo final del destino fue de 7.5 XLM.
- Abrí el build en Chrome headless: el modal de Stellar Wallets Kit abre con Albedo, xBull, Varial y las demás wallets, sin errores en consola.
