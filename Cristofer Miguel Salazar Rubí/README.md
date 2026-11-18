# Pura Vida Wallet

Aplicación básica construida sobre Stellar para el **Entregable 1 del Pura Vida Bootcamp**.

Conecta una wallet de Stellar, muestra el saldo de la cuenta en **Testnet**, permite fondearla con Friendbot y enviar XLM firmando la transacción desde la wallet.

## Requisito mínimo cumplido

La sección **“Conecta tu wallet”** está en el hero de la app (`#wallet`). Usa **Stellar Wallets Kit** y permite elegir entre:

- Albedo
- Varial (anteriormente Freighter)
- xBull
- Rabet
- LOBSTR

La app nunca recibe llaves privadas: solo la dirección pública y la transacción firmada.

## Funcionalidad

- Conexión y desconexión de wallet.
- Detección de red incorrecta (si la wallet no está en Testnet).
- Consulta de saldo nativo XLM y otros assets.
- Fondeo de cuentas nuevas con Friendbot.
- Envío de XLM con validación de dirección, monto y saldo.
- Firma de la transacción en la wallet y envío a Horizon Testnet.
- Confirmación con hash y enlace a Stellar Expert.
- Historial reciente de pagos, depósitos y creación de cuenta.
- Estados de carga, errores claros y prevención de doble envío.

## Stack

- React 19 + TypeScript + Vite
- `@stellar/stellar-sdk` para Horizon y transacciones clásicas
- `@creit.tech/stellar-wallets-kit` v2 para la conexión multi-wallet
- CSS propio, sin framework de UI

## Cómo correrla

```bash
npm install
npm run dev
```

Abre la URL que imprime Vite. Para producción:

```bash
npm run build
npm run preview
```

No requiere variables de entorno: la app apunta a Horizon Testnet y Friendbot públicos.

## Uso de Stellar Raven

Stellar Raven (`https://raven.stellar.org/`) se usó como asistente durante el desarrollo. Las consultas principales fueron sobre la skill oficial de dApps de Stellar:

- Integración de wallets con Stellar Wallets Kit v2 (API estática, `authModal`, `signTransaction`).
- Inicialización del SDK y configuración de Testnet/Horizon.
- Construcción de pagos clásicos con `TransactionBuilder` y `Operation.payment`.
- Envío y confirmación de transacciones clásicas por Horizon.
- Checklist de UX para transacciones: estados de carga, hash visible, errores de saldo/red/firma y bloqueo de doble envío.

Con esa base se implementaron `src/lib/stellar.ts`, `src/hooks/useStellarWallet.ts` y el flujo de pago de `src/components/PaymentForm.tsx`.

## Estructura

```text
src/
  components/
    ActivityList.tsx      Historial de movimientos
    Icons.tsx             Iconos SVG inline
    PaymentForm.tsx       Construcción, firma y envío de XLM
    WalletSection.tsx     Conexión, saldo y fondeo
  hooks/
    useAccount.ts         Consulta de cuenta en Horizon
    useStellarWallet.ts   Estado y firma de la wallet
  lib/
    stellar.ts            Configuración, validaciones y helpers
  App.tsx
  index.css
```

## Red

Todo ocurre en **Stellar Testnet**. Los XLM de prueba no tienen valor real. No uses direcciones ni fondos de Mainnet.

## Autor

**Cristofer Miguel Salazar Rubí**
