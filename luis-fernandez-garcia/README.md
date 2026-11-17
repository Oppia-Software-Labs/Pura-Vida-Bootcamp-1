# StellarTickets - Luis Fernández García

App básica de venta de entradas para eventos (recitales, festivales, teatro) sobre **Stellar Testnet**.

- Sección para **conectar wallet** (Freighter).
- Catálogo de eventos; la compra firma un pago en XLM con memo `TKT-<id>`.
- "Mis entradas" con enlace a la transacción en Stellar Expert.

## Uso de Stellar Raven
Raven (https://raven.stellar.org/, MCP oficial de Stellar) se usó como asistente para consultar la API de Horizon, el flujo de `Operation.payment`/`createAccount` y la integración con Freighter.

## Ejecutar
```
npm install
npm run dev
```
Requiere la extensión Freighter en red TESTNET con cuenta fondeada (friendbot).
