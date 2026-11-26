# Stellar Raven en este proyecto

**Stellar Raven** es el servidor MCP oficial de Stellar (https://raven.stellar.org). Un MCP
(*Model Context Protocol*) conecta un asistente de IA (Cursor, Claude Code, Codex, VS Code, OpenCode...)
con fuentes externas. Raven le da al asistente la documentación oficial de Stellar, datos en vivo del
ecosistema y *playbooks* probados, con dos herramientas: `search` y `execute`.

## Conexión

- Endpoint: `https://raven.stellar.org/mcp` (HTTP + inicio de sesión OAuth en el navegador).
- Cursor: Settings > MCP > Add new MCP server > URL `https://raven.stellar.org/mcp`.
- Claude Code: `claude mcp add --transport http stellar-raven "https://raven.stellar.org/mcp"` y luego `/mcp` > Authenticate.
- Playground en el navegador: https://raven.stellar.org/playground

## Consultas a Raven por módulo de la app

| # | Consulta | Parte de la app |
|---|----------|-----------------|
| 1 | Cómo conectar una wallet Varial/Freighter a una app web en testnet | `js/wallet.js` |
| 2 | Cómo fondear una cuenta nueva con Friendbot y qué es la reserva mínima | `fondearConFriendbot` en `js/stellar.js` |
| 3 | Cómo construir y firmar un pago de XLM con el SDK de JavaScript | `construirPago` / `firmar` |
| 4 | Qué pasa al enviar XLM a una cuenta que no existe (`createAccount` vs `payment`) | `construirPago` |
| 5 | Cómo leer el historial de pagos de una cuenta con Horizon | `ultimosPagos` |
| 6 | Qué códigos de error devuelve Horizon cuando una transacción falla | `enviarTransaccion` |