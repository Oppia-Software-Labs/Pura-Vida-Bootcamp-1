# Plazo

A custodian-free security deposit on Stellar testnet: the money sits in a claimable balance with time predicates (`E` end of contract, `D` deadline, `E < D`), and the network decides who can claim. A Pura Vida Bootcamp exercise; testnet only, no legal validity.

## Documentation

Read before changing code (the docs are written in Spanish):

- `context/approach.md`: the idea, the scope and the closed decisions.
- `context/structure.md`: stack, layers, folders, data model and flows.
- `context/expertise.md`: Stellar concepts (claimable balances, predicates, Horizon vs RPC).

File and function names in those docs are guiding proposals, not a contract. Confirm package and method names for Stellar or Varial with Stellar Raven before coding; do not assume them.

## Commands

Package manager: Bun.

- `bun run dev`: dev server.
- `bun run build`: `tsc -b` plus the Vite build.
- `bun run lint`: oxlint.
- `bun run test`: Vitest (domain only).

## Architecture

Frontend-only SPA, no backend. Code lives in `source/`:

- `domain/`: pure logic. It does not import React, the wallet or the network.
- `stellar/` and `wallet/`: adapters to the network and to Varial (`@stellar/varial-sdk`, a single wallet).
- `ui/`: screens, hooks and `friendlyError`.

The network is fixed to testnet and defined in one place (`source/config/network.ts`).

## Tests

- Vitest, configured in `vitest.config.ts`; only pure domain logic is tested, with no network or wallet.
- Tests live next to the code they cover, as `*.test.ts` files (for example `source/domain/evaluate.test.ts`).

## Conventions

- Double quotes by default.
- Identifiers and thrown errors are in English; only the visible UI text is Spanish. Code throws English errors and the UI translates them.
- Styling with Tailwind.
- Money is always stroops as `BigInt`; never a JS `number`.
- Never ask for, store or log secret keys or seed phrases.

Detailed rules are in `.claude/rules/` (code language, lean changes, commit messages).
