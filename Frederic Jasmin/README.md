# Pura Vida Wallet

Mi primera app sobre Stellar para el Pura Vida Bootcamp (Tarea 1). Autor: **Frederic Jasmin**.

Funciona en la **testnet** de Stellar, así que no mueve dinero real.

## Qué hace

- **Conectar wallet:** abre el modal de Stellar Wallets Kit para conectar Freighter, xBull, Albedo, Lobstr, Hana y otras wallets.
- **Ver saldo:** lee el saldo de XLM de la cuenta conectada desde Horizon testnet.
- **Cargar XLM de prueba:** pide 10.000 XLM a Friendbot para crear o fondear la cuenta.
- **Enviar XLM:** arma la transacción, la firma la wallet del usuario y se envía a Horizon. Si la cuenta destino todavía no existe, usa `createAccount` (mínimo 1 XLM). Muestra el link a Stellar Expert.

## Stack

- Vite + React
- [`@stellar/stellar-sdk`](https://github.com/stellar/js-stellar-sdk) (Horizon, TransactionBuilder)
- [`@creit.tech/stellar-wallets-kit`](https://stellarwalletskit.dev) (conexión y firma con la wallet)

## Cómo correrla

```bash
cd "Frederic Jasmin"
npm install
npm run dev
```

Abrí http://localhost:5173, poné tu wallet (por ejemplo Freighter) en **Testnet** y tocá **Conectar wallet**.

## Estructura

```text
src/
  lib/wallet.js           conexión, desconexión y firma con Stellar Wallets Kit
  lib/stellar.js          Horizon: saldo, Friendbot y envío de pagos
  components/SendForm.jsx formulario para enviar XLM
  App.jsx                 pantalla principal
```
