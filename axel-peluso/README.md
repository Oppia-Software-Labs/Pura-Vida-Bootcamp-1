# Stellar Testnet Wallet

App web hecha con **Vite + React** que se conecta a la wallet **Freighter** mediante
[Stellar Wallets Kit](https://jsr.io/@creit-tech/stellar-wallets-kit) y trabaja sobre la **testnet** de Stellar.

## Funciones

- **Conectar Freighter**: un botón abre la extensión y pide permiso para leer tu cuenta.
- **Dirección y saldos**: muestra tu dirección pública (con botón para copiarla) y tus saldos de **XLM** y **USDC**.
  Si la cuenta no tiene fondos, ofrece un enlace a Friendbot.
- **Trustline de USDC**: botón para agregar la trustline del USDC de Circle en testnet
  (issuer `GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5`), firmada con Freighter.
  El botón solo aparece si la cuenta todavía no tiene esa trustline.
- **Aviso de red**: si Freighter no está en **Testnet** aparece un aviso con los pasos para cambiarla,
  y los botones que firman transacciones se deshabilitan hasta que la red sea la correcta.
- **Enviar XLM**: formulario para enviar XLM. Si la cuenta de destino no existe, se crea con `createAccount`
  (mínimo 1 XLM). Al terminar se muestra un enlace a la transacción en Stellar Expert.
- **Historial**: los últimos 5 pagos de la cuenta conectada (fecha, tipo, monto y destino), cada uno con
  su enlace a [Stellar Expert testnet](https://stellar.expert/explorer/testnet).
- **Mensajes de error claros** para los casos más comunes: wallet no instalada, firma rechazada por el
  usuario, saldo insuficiente (teniendo en cuenta la reserva mínima) y dirección inválida.

> Nota: en Stellar Wallets Kit v2, Freighter aparece como **Varial** (nuevo nombre de la extensión), por eso el código usa `VarialModule` / `VARIAL_ID`.

## Requisitos

- Node.js 22 o superior
- La extensión de navegador Freighter (Varial) instalada
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

## Cómo usarla paso a paso

1. Instala Freighter, crea o importa una cuenta y cambia la red a **Testnet**
   (selector de red de la extensión → Testnet).
2. Abre la app y pulsa **Conectar Freighter**; acepta la solicitud de acceso en la extensión.
3. Si la cuenta no tiene fondos, pulsa **Fondear con Friendbot** y luego **Actualizar**.
4. (Opcional) Pulsa **Agregar trustline USDC** y firma en Freighter para poder recibir USDC de testnet.
5. En **Enviar XLM**, escribe la dirección de destino (`G…`) y el monto, pulsa **Enviar** y firma en Freighter.
6. Revisa el resultado con el enlace **Ver transacción** y consulta tus movimientos en **Últimos pagos**.
7. Pulsa **Desconectar** cuando termines.

## Transacción de prueba

Envío de 5 XLM hecho desde la app en testnet (creó la cuenta de destino):

- Hash: `bd862950e6ec237889b0f60ffd25b8b044cf7118ff6a75e16e44c7dcd7fad6cb`
- [Ver en Stellar Expert (testnet)](https://stellar.expert/explorer/testnet/tx/bd862950e6ec237889b0f60ffd25b8b044cf7118ff6a75e16e44c7dcd7fad6cb)

## Estructura

- `src/stellar.js`: inicialización de Stellar Wallets Kit, detección de red, saldos e historial (Horizon),
  trustline de USDC y envío de XLM.
- `src/errors.js`: traducción de errores de Freighter y Horizon a mensajes claros.
- `src/App.jsx`: interfaz (conexión, aviso de red, saldos, trustline, envío e historial).

## Créditos

Esta app se hizo con ayuda de **Stellar Raven**, que se usó para consultar la documentación oficial de Stellar
y las guías de integración de wallets (Stellar Wallets Kit, Freighter, trustlines con `changeTrust`,
el endpoint de pagos de Horizon, códigos de resultado de transacciones y construcción y envío de transacciones).
