# Stellar Testnet Wallet

App web hecha con **Vite + React** que se conecta a la wallet **Freighter** mediante
[Stellar Wallets Kit](https://jsr.io/@creit-tech/stellar-wallets-kit) y trabaja sobre la **testnet** de Stellar.

## Qué hace

- **Conectar Freighter**: un botón abre la extensión y pide permiso para leer tu cuenta.
- **Mostrar dirección y saldos**: muestra tu dirección pública y tus saldos de **XLM** y **USDC** (USDC de Circle en testnet, issuer `GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5`). Si tu cuenta no tiene fondos, ofrece un enlace a Friendbot.
- **Enviar XLM**: un formulario arma un pago en testnet, lo firmas en Freighter y se envía a Horizon. Si la cuenta de destino todavía no existe, se crea con `createAccount` (mínimo 1 XLM). Al terminar se muestra un enlace a la transacción en Stellar Expert.

> Nota: en Stellar Wallets Kit v2, Freighter aparece como **Varial** (nuevo nombre de la extensión), por eso el código usa `VarialModule` / `VARIAL_ID`.

## Requisitos

- Node.js 22 o superior
- La extensión de navegador Freighter (Varial) instalada y configurada en **Testnet**
- Una cuenta de testnet con fondos (puedes usar [Friendbot](https://lab.stellar.org/account/fund))

## Cómo correrla

```bash
npm install
npm run dev
```

Abre la URL que muestra Vite (por defecto http://localhost:5173).

Para generar la versión de producción:

```bash
npm run build
npm run preview
```

## Transacción de prueba

Envío de 5 XLM hecho desde la app en testnet (creó la cuenta de destino):

- Hash: `bd862950e6ec237889b0f60ffd25b8b044cf7118ff6a75e16e44c7dcd7fad6cb`
- [Ver en Stellar Expert (testnet)](https://stellar.expert/explorer/testnet/tx/bd862950e6ec237889b0f60ffd25b8b044cf7118ff6a75e16e44c7dcd7fad6cb)

## Estructura

- `src/stellar.js`: inicialización de Stellar Wallets Kit, lectura de saldos (Horizon) y envío de XLM.
- `src/App.jsx`: interfaz (conexión, saldos, formulario de envío).

## Créditos

Esta app se hizo con ayuda de **Stellar Raven**, que se usó para consultar la documentación oficial de Stellar
y las guías de integración de wallets (Stellar Wallets Kit, Freighter, construcción y envío de transacciones).
