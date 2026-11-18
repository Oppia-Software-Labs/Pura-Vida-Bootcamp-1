# Plazo

Depósito de garantía sin custodio sobre Stellar testnet: el dinero queda en un claimable balance con predicados de tiempo (`E` fin de contrato, `D` plazo, `E < D`) y la red decide quién puede reclamar. Práctica del Pura Vida Bootcamp; solo testnet, sin validez legal.

## Documentación

Lee antes de cambiar código:

- `context/approach.md`: la idea, el alcance y las decisiones cerradas.
- `context/structure.md`: stack, capas, carpetas, modelo de datos y flujos.
- `context/expertise.md`: tecnicismos de Stellar (claimable balances, predicados, Horizon vs RPC).

Los nombres de archivos y funciones de esos docs son propuestas orientativas. Los nombres de paquetes y métodos de Stellar o Varial se confirman con Stellar Raven antes de codificar, no se asumen.

## Comandos

Gestor: Bun.

- `bun run dev`: servidor de desarrollo.
- `bun run build`: `tsc -b` y build de Vite.
- `bun run lint`: oxlint.
- `bun run test`: Vitest (solo dominio).

## Arquitectura

SPA solo frontend, sin backend. El código vive en `source/`:

- `domain/`: lógica pura. No importa React, wallet ni red. Se prueba con Vitest.
- `stellar/` y `wallet/`: adaptadores a la red y a Varial (`@stellar/varial-sdk`, una sola wallet).
- `ui/`: pantallas, hooks y `friendlyError`.

Red fija en testnet, definida en un solo lugar (`source/config/network.ts`).

## Convenciones

- Comillas dobles por defecto.
- Identificadores y errores lanzados en inglés; solo el texto visible de la UI va en español. El código lanza errores en inglés y la UI los traduce.
- Estilos con Tailwind.
- Dinero siempre en stroops con `BigInt`; nunca `number` de JS.
- Nunca pedir, guardar ni registrar llaves secretas o frases semilla.

Las reglas detalladas están en `.claude/rules/` (idioma del código, cambios mínimos, mensajes de commit).
