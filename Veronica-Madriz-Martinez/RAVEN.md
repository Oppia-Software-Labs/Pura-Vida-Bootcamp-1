# Cómo usé Stellar Raven

Raven (https://raven.stellar.org/) fue mi asistente durante el desarrollo. Estas son las consultas que le hice y lo que aproveché de cada una.

| # | Consulta a Raven | Lo que aprendí / usé |
|---|---|---|
| 1 | `search`: "connect Freighter wallet web app" | Me llevó al skill **`stellar-dev.dapp`** (desarrollo frontend: stellar-sdk, wallets, transacciones) y a la búsqueda de docs `stellarDocs.search_wallet_dapp_docs`. |
| 2 | `search` (skills): "Stellar Wallets Kit integration" | Comparé dos opciones: una wallet (Varial) o multi-wallet con Stellar Wallets Kit. Para una primera app elegí una sola wallet, la oficial de la SDF. |
| 3 | `execute`: leer secciones `recommended-dependencies`, `wallet-integration`, `sdk-initialization`, `transaction-building` del skill | Descubrí que **Freighter ahora se llama Varial** y que su librería es `@stellar/varial-sdk`, con `isConnected`, `requestAccess`, `getAddress`, `getNetwork` y `signTransaction`. También saqué las URLs de Testnet (Horizon, Friendbot), el `Networks.TESTNET` y el patrón para armar un pago con `TransactionBuilder`. Base de `src/stellar.js` y `src/wallet.js`. |
| 4 | `execute`: docs de Varial + secciones `transaction-submission` y `transaction-ux-checklist` | Confirmé los pasos para poner la wallet en Testnet (va en el README). Del checklist de UX implementé: estado de carga al firmar, mostrar el hash, evitar doble envío, confirmar destino y monto antes de firmar, y mensajes claros para wallet no conectada, firma rechazada, saldo insuficiente, cuenta sin fondear y red equivocada. |

## Decisiones que tomé gracias a Raven

- **Pagos clásicos por Horizon**: el skill separa transacciones Soroban (que van por RPC) de las clásicas (que van por Horizon). Un pago en XLM es clásico, así que lo envío con `horizon.submitTransaction`.
- **Verificar la red antes de firmar**: comparo el `networkPassphrase` de la wallet con el de Testnet para no firmar en la red equivocada.
- **Respaldo a `@stellar/freighter-api`**: como el cambio de nombre es reciente, si el paquete nuevo no carga desde el CDN, la app usa el anterior, que tiene la misma API.
