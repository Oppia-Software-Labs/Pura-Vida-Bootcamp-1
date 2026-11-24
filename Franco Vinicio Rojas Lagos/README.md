# Pura Vida Stellar · Testnet Wallet Dashboard

**Autor:** Franco Vinicio Rojas Lagos  
**Entregable 1:** Pura Vida Bootcamp (Oppia Software Labs)  
**Asistente MCP utilizado:** [Stellar Raven](https://raven.stellar.org/) (`https://raven.stellar.org/mcp`)

## Descripción

Aplicación web básica sobre **Stellar Testnet** construida apoyándome en **Stellar Raven** como asistente de desarrollo. Permite conectar wallets del ecosistema Stellar, inspeccionar cuentas en Horizon Testnet, fondear cuentas nuevas con Friendbot, enviar pagos en XLM y consultar el historial reciente de movimientos.

## Funcionalidades

1. **Conexión de Wallet de Stellar (requisito mínimo):**
   - Integración multi-wallet mediante **Stellar Wallets Kit v2** (`@creit-tech/stellar-wallets-kit` instalado desde JSR), con soporte para Freighter / Varial, xBull, Albedo, Lobstr, Hana y más.
   - Modo secundario **Explorador (solo lectura)** para inspeccionar cualquier llave pública `G...` o generar una dirección de prueba en Testnet sin requerir extensión instalada.
2. **Consulta de Balances y Fondeo con Friendbot:**
   - Lectura en vivo desde `https://horizon-testnet.stellar.org` usando `@stellar/stellar-sdk` v17.
   - Manejo tipado de `NotFoundError` cuando la cuenta aún no está activada en Testnet, con botón de 1 clic para solicitar **10,000 XLM** a **Friendbot**.
   - Cálculo de reserva mínima estimada, saldo disponible y listado de trustlines/assets adicionales.
3. **Envío de Pagos en XLM:**
   - Construcción de transacciones con `TransactionBuilder`, `Operation.payment` y `Memo.text` opcional.
   - Vista previa de destino, monto y comisión base antes de firmar, estados claros paso a paso y enlace directo a **Stellar Expert (Testnet)**.
   - Traducción amigable de códigos de error de Horizon (`op_underfunded`, `op_no_destination`, `tx_bad_auth`, etc.).
4. **Historial de Pagos Recientes:**
   - Consulta de los últimos 10 pagos de la cuenta en Horizon en orden descendente con tabla responsiva adaptable a móvil.

## Cómo ejecutar localmente

Requisitos: **Node.js 22+** y **pnpm** (o `npm`).

```bash
cd "Franco Vinicio Rojas Lagos"
pnpm install
pnpm dev
```

Para generar el build de producción:

```bash
pnpm build
```

## Uso de Stellar Raven MCP

Ver [RAVEN.md](./RAVEN.md) para el detalle de las consultas, skills oficiales y decisiones técnicas guiadas por **Stellar Raven**.
