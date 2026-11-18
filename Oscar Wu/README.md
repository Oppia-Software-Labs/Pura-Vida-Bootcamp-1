# EasyPay

**Cobra aunque no tengas internet.** Proyecto del Task 1 del Pura Vida Bootcamp (Stellar), por Oscar Wu.

## Qué es

EasyPay es el concepto de una app de cobros para negocios pequeños (pulperías, ferias, zonas con mala señal). La idea: el pago se guarda localmente cuando no hay internet y, al volver la señal, se sincroniza en bloque a Stellar.

Este repositorio contiene la **demo visual** de ese flujo más una **conexión real de wallet** de Stellar.

## Qué es real y qué es demo

| Parte | Estado | Detalle |
|---|---|---|
| Conectar wallet | **REAL** | Usa `@creit.tech/stellar-wallets-kit` en **testnet**. Abre el modal del kit, el usuario elige su wallet y se obtiene su clave pública (validada con `@stellar/stellar-sdk`). |
| Saldo de XLM | **REAL** | Se consulta a Horizon testnet con `@stellar/stellar-sdk`. Si la cuenta no está fondeada, se indica. |
| Pantalla de cobro | **DEMO** | Solo agrega una tarjeta a una lista en memoria de React. No se firma ni se envía ninguna transacción. |
| Cola offline | **DEMO / no existe** | No hay IndexedDB, Service Worker ni persistencia. Si recargas la página, la lista se pierde. |
| "Simular reconexión" | **DEMO** | Espera 1.5 s y cambia el estado de los pagos de "pendiente" a "sincronizado". No se envía nada a Stellar. |

Una cola offline funcional requeriría persistencia local, firma de transacciones, manejo de secuencias y reintentos. Nada de eso está implementado.

## Stack

- Vite + React + TypeScript
- `@creit.tech/stellar-wallets-kit` (publicado en npm con ese nombre; en JSR es `@creit-tech/stellar-wallets-kit`)
- `@stellar/stellar-sdk`

## Cómo correrlo

Requiere Node 20+.

```bash
cd "Oscar Wu/easypay"
npm install
npm run dev
```

Abre la URL que muestre Vite. Para probar la conexión real necesitas una wallet compatible (por ejemplo Freighter, xBull o Albedo) configurada en **testnet**.

```bash
npm run build   # compila para producción
```

## Estructura

```
easypay/src/
  wallet.ts        # REAL: conexión de wallet, saldo en testnet
  payments.ts      # DEMO: tipos y helpers de los cobros simulados
  ChargeScreen.tsx # DEMO: formulario de cobro y lista
  SyncBar.tsx      # DEMO: contadores y botón de reconexión
  App.tsx
```
