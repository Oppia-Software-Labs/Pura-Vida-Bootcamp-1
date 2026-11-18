# Baula Stellar · Entrega 1

**Nombre completo:** Victor Andres Villalta Alvarado (`Victor Villalta`)

## Qué hace

**Baula Stellar** es una aplicación web interactiva en español que enseña a usar Stellar en cuatro niveles, acompañando a una tortuga baula desde el nido hasta el mar:

1. **Nivel 1 · El nido:** Conceptos esenciales de Stellar, claves públicas/secretas y Testnet.
2. **Nivel 2 · La arena (Conexión de Wallet):** Conexión funcional con la wallet **Freighter** (`@stellar/freighter-api`), verificación automática de red **Testnet**, visualización y copia de la dirección pública.
3. **Nivel 3 · La caminata (Cuenta y Horizon):** Consulta en vivo de saldo XLM, activos adicionales y últimas 5 transacciones en Horizon Testnet, además de fondeo directo con **Friendbot** para cuentas nuevas.
4. **Nivel 4 · El mar (Pago en Testnet):** Construcción, cálculo de comisión y reserva mínima, firma de la transacción XDR con Freighter y confirmación del pago en Horizon Testnet con enlace al explorador.

Incluye además el asistente contextual **Pregúntale a Raven** en cada nivel, con integración del protocolo MCP de **Stellar Raven** (`https://raven.stellar.org/mcp`) y respuestas de respaldo con fuentes oficiales de Stellar.

## Cómo ejecutarla

1. Entrá a la carpeta `Victor Villalta` con Node.js 22.18 o superior:
   ```powershell
   cd "Victor Villalta"
   npm install
   Copy-Item .env.example .env.local
   npm run dev
   ```
2. Abrí `http://localhost:3000` y seleccioná **Testnet** en tu wallet Freighter.
3. Si tu cuenta todavía no existe en Testnet, fondeala con el botón **Fondear con Friendbot** en el nivel 3.

## Uso de Stellar Raven

Utilicé **Stellar Raven** (`https://raven.stellar.org/`) para consultar las guías oficiales de dApps, la integración con `@stellar/freighter-api`, las consultas a Horizon Testnet y el flujo de firma de transacciones XDR con `@stellar/stellar-sdk`. Además, la ruta `/api/raven` implementa un cliente MCP (`search` y `execute`) hacia Stellar Raven junto con respuestas guiadas de respaldo por nivel.

## Verificación

- `npm run typecheck` y `npm run build` completados sin errores.
- 13 pruebas automatizadas de flujo de wallet, Horizon Testnet, Friendbot, pagos XDR y asistente Raven.
