# Pura Vida · Stellar Wallet

App basica en Stellar hecha con React + TypeScript + Vite.

## Qué hace

- Conecta una wallet de Stellar con el modal oficial de **Stellar Wallets Kit v2** (Freighter, Varial y otras).
- Muestra la dirección pública conectada y permite copiarla.
- Consulta el saldo XLM y los últimos pagos de la cuenta en **Stellar Testnet** usando Horizon.
- Si la cuenta aún no existe en Testnet, ofrece financiarla con Friendbot.

## Ejecutar

```bash
pnpm install
pnpm run dev
```

Abre la URL que muestra Vite. Para comprobar la entrega:

```bash
pnpm run lint
pnpm run build
```

## Cómo se usó Stellar Raven

Durante el desarrollo se consultó el MCP oficial de Stellar en `https://raven.stellar.org/mcp`.
Con sus herramientas `search` y `execute` se identificó la skill `skills.stellar-dev.dapp`,
de la que se tomaron las decisiones técnicas aplicadas aquí:

- `@stellar/stellar-sdk` para Horizon y direcciones de red.
- Stellar Wallets Kit v2 (`@creit.tech/stellar-wallets-kit`), con `defaultModules()` y `authModal()`. Raven recomienda JSR; se usa el paquete npm equivalente v2.8.0 porque resuelve mejor en el bundle de Vite.
- Lectura de saldo con `horizon.loadAccount()` y manejo del cuenta-no-financiada como `NotFoundError`.

Raven es una herramienta de apoyo para desarrollar; esta app no almacena credenciales ni llaves privadas.
