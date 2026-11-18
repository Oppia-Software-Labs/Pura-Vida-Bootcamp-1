# Mate Stellar

**Entregable 1 · Pura Vida Bootcamp · Juan Facundo Ayala**

Una app para convidar un mate: una propina en XLM que viaja por Stellar
Testnet, firmada desde la wallet de quien la envía. No usa fondos reales.

## Qué hace

1. **Conectar wallet.** Un botón abre el selector de Stellar Wallets Kit
   (Varial/Freighter, xBull, Albedo, Lobstr y otras). La app nunca ve la clave
   privada.
2. **Ver el saldo.** Muestra el saldo en XLM, cuánto se puede enviar y cuánto
   queda como reserva mínima. Si la cuenta no existe en Testnet, un botón la
   activa con Friendbot.
3. **Convidar un mate.** Formulario con destinatario, monto y mensaje. La
   transacción se arma en la app, se firma en la wallet y se envía a Horizon.
   Si el destinatario no existe en la red, se crea la cuenta con el envío.
4. **Últimos mates.** Lista los movimientos recientes de la cuenta, con
   mensaje, fecha y link al comprobante en el explorador.

## Cómo correrla

Requiere Node.js 22 o superior.

```bash
cd juan-facundo-ayala
npm install
npm run dev
```

Abrí `http://localhost:5173` en un navegador que tenga una wallet de Stellar
instalada y configurada en **Testnet**.

Otros comandos: `npm run build` (compila para producción), `npm run lint`
y `npm run format` (ordena el código con Prettier).

## Cómo se usó Stellar Raven

Raven fue el asistente de consulta durante todo el desarrollo. Cada parte de
la app salió de una consulta concreta:

| Consulta a Raven                            | Qué aportó                                                                                                         | Dónde quedó                   |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | ----------------------------- |
| Cómo conectar una wallet desde un frontend  | La API actual de Stellar Wallets Kit v2 (singleton estático, `defaultModules()`, `authModal()`), distinta de la v1 | `src/lib/wallet.ts`           |
| Cómo armar y enviar un pago                 | El patrón `TransactionBuilder` + `Operation.payment` y el envío por Horizon                                        | `src/lib/mate.ts`             |
| Checklist de experiencia de una transacción | Mostrar cada paso, evitar el doble envío y traducir los errores                                                    | `src/components/MateForm.tsx` |
| Saldo mínimo y reservas                     | La fórmula: 2 reservas base más una por subentrada, a 0,5 XLM cada una                                             | `src/lib/account.ts`          |
| Friendbot                                   | Entrega 10.000 XLM de prueba y tiene límite de pedidos                                                             | `src/lib/account.ts`          |
| Límite del memo y códigos de error          | Memo de texto de hasta 28 bytes; `op_underfunded`, `tx_bad_seq` y otros                                            | `src/lib/mate.ts`             |
| Endpoint de pagos de una cuenta             | `GET /accounts/{id}/payments` con `order`, `limit` y `join`                                                        | `src/lib/history.ts`          |

Raven también avisó que la wallet Freighter ahora se distribuye como Varial,
y por eso la app la nombra así.

## Tecnologías

- Vite + React + TypeScript
- `@stellar/stellar-sdk` para armar transacciones y leer Horizon
- `@creit.tech/stellar-wallets-kit` para la conexión multi-wallet
- Tailwind CSS + shadcn/ui para la interfaz

## Estructura

```
src/
  lib/         lógica de Stellar (wallet, cuenta, envío, historial)
  hooks/       estado de la wallet y de la cuenta
  components/  secciones de la app y componentes de interfaz (ui/)
```

## Pruebas realizadas

- Saldo, Friendbot, envío de un pago, creación de cuenta e historial se
  probaron contra Testnet con cuentas descartables.
- El selector de wallets abre y cierra correctamente.
- La firma con una extensión de wallet real depende del navegador de cada
  persona y hay que probarla ahí.
