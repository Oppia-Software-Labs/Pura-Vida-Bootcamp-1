# Plazo — Roadmap

Fases de construcción con el estado de cada tarea. Cierre de la entrega: **miércoles 18 de noviembre, 19:00**.

Estado: ✅ hecho · 🔄 en curso · ⬜ pendiente

| Fase | Qué entrega | Estado |
|---|---|---|
| 0 | Base del proyecto y documentación | ✅ |
| 1 | Conectar wallet (requisito mínimo) | ✅ |
| 2 | Entity con tests | ✅ |
| 3 | Crear depósito | ✅ |
| 4 | Listar y reclamar | ✅ |
| 5 | Cierre y entrega | ⬜ siguiente |
| 6 | Reto: tope de reparaciones | ⬜ opcional |

Los mensajes de commit sugeridos para cada fase están en [`context/structure.md`](context/structure.md#9-plan-de-commits).

## Fase 0 · Base y documentación ✅

- ✅ Proyecto Vite + React + TypeScript con Bun.
- ✅ Tailwind CSS, Vitest (tests junto al código) y oxlint.
- ✅ Dependencias: `@stellar/stellar-sdk` y `@stellar/varial-sdk`.
- ✅ Docs de `context/`: approach, structure y expertise.
- ✅ `README.md`, `CLAUDE.md`, ícono y `.gitattributes`.
- ✅ Decisiones cerradas: nombre, activo, idioma, tope, descubrimiento y entrega.

## Fase 1 · Conectar wallet ✅

Pantalla 1. Cumple el requisito mínimo de la tarea.

- ✅ Confirmar con Raven los nombres y imports de `@stellar/varial-sdk`.
- ✅ `source/config/network.ts` con la red testnet.
- ✅ `source/bloc/wallet/varial.ts`: conectar y firmar.
- ✅ Hook `useWallet` y pantalla `ConnectWallet`.
- ✅ Mostrar dirección, saldo de XLM e indicador de red.
- ✅ Verificar que Horizon responde en testnet con una llamada simple.

## Fase 2 · Entity con tests ✅

Lógica pura en `source/bloc/entity/`, sin React, wallet ni red. Cada archivo con su `*.test.ts` al lado.

- ✅ `types.ts`: `Deposit`, `DepositPlan`, `Role`, `Status`.
- ✅ `money.ts`: conversión a stroops con `BigInt` y división con tope.
- ✅ `predicates.ts` y `evaluate.ts`: predicados del arrendador y del inquilino, y `evalPred`.
- ✅ `status.ts`: estado y acción disponible por rol.
- ✅ `plan.ts`: validar el formulario y devolver un `DepositPlan`.
- ✅ Tests de los bordes: `t == E` y `t == D`.

## Fase 3 · Crear depósito ✅

Pantalla 2.

- ✅ `buildCreateDeposit`: transacción con el inquilino como claimant, devuelve XDR.
- ✅ `submit`: enviar el XDR firmado y extraer el `balanceId`.
- ✅ Pantalla `CreateDeposit` con modo demo (`E` y `D` en minutos).
- ✅ Vista previa en lenguaje natural antes de firmar.
- ✅ `friendlyError`: errores en inglés traducidos a mensajes en español.
- ✅ Mostrar el link `?deposit=<id>` y guardar el id en `localStorage`.

## Fase 4 · Listar y reclamar ✅

Pantalla 3 y detalle por link.

- ✅ `listDepositsFor` con Horizon, por claimant.
- ✅ `getDepositById` con RPC, para el link `?deposit=<id>`.
- ✅ Hooks `useDeposits` y `useNow` (cuenta regresiva).
- ✅ `DepositCard`: rol, monto, estado y botón o cuenta regresiva.
- ✅ `buildClaim` y flujo de reclamo con firma.
- ✅ Manejo de `CANNOT_CLAIM` y `DOES_NOT_EXIST`.

## Fase 5 · Cierre y entrega ⬜

- ⬜ Prueba completa en testnet con dos cuentas fondeadas con Friendbot.
- ⬜ Corrida A: `E` = +2 min, `D` = +5 min; reclama el arrendador en su ventana.
- ⬜ Corrida B: nadie reclama; después de `D` recupera el inquilino.
- ⬜ Completar el `README.md`: nombre completo y sección de uso de Raven.
- ⬜ Copiar el proyecto a la carpeta con el nombre completo en el fork.
- ⬜ Rama `feature/<nombre>`, al menos 5 commits propios y PR a `main` del repo original.
- ⬜ Pegar el link del PR en la plataforma.

## Fase 6 · Reto (si da tiempo) ⬜

Se sacrifica primero si el tiempo aprieta.

- ⬜ Tope de reparaciones: dos balances en una sola transacción.
- ⬜ Control del tope en la pantalla de crear depósito.
- ⬜ Activo de prueba en lugar de XLM nativo (trustlines). Hoy queda fuera de alcance.
