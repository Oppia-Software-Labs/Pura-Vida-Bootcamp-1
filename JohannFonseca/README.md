# ⚡ SplitXLM — Divisor de Cuentas y Links de Pago Automático en Stellar

**Autor:** JohannFonseca  
**Entregable 1:** Pura Vida Bootcamp (Campamento 01 · Grantfox)  
**Red:** Stellar Testnet  
**Asistente de Desarrollo:** [Stellar Raven MCP](https://raven.stellar.org/)

---

## 💡 ¿Qué problema resuelve SplitXLM?

Cuando sales con amigos o compañeros de equipo y alguien paga la cuenta completa, cobrarle a cada persona suele requerir pedir números de cuenta bancaria, copiar datos manualmente y confirmar comprobantes uno por uno.

**SplitXLM** automatiza todo el proceso sobre la blockchain de **Stellar**:
1. **Conecta tu Wallet de Stellar** (soporta la extensión oficial **Freighter Wallet** y también incluye una **Wallet Testnet Instantánea** fondeada automáticamente con *Friendbot* para probar en 1 clic).
2. **Divide la cuenta automáticamente:** Ingresas el concepto (ej. *"Pizza & Birras con el Squad"*), el monto total en **XLM** y los nombres de tus amigos.
3. **Genera Links Mágicos de Cobro + URI SEP-0007 (`web+stellar:pay`):** Cada amigo recibe un link único que ya contiene la wallet destino, su monto exacto calculado y un `MEMO_TEXT` identificador (`SPLIT:<id>:<amigo>`).
4. **Pago en 1 clic sin entrar al banco:** Cuando el amigo abre el link, la aplicación se abre directamente en **Modo Pago** con su factura lista; solo firma con su wallet de Stellar y el pago se liquida en ~5 segundos.
5. **Verificación On-Chain en Vivo:** El panel del creador consulta **Horizon Testnet** en tiempo real, lee los memos de las transacciones recibidas y marca automáticamente quién ya pagó (`✅ PAGADO ON-CHAIN`) con enlace directo al recibo en `stellar.expert`.

---

## 🛠️ Tecnologías y Uso de Stellar Raven MCP

Durante el desarrollo se utilizó **Stellar Raven** (`https://raven.stellar.org/`), el MCP oficial de Stellar, para estructurar y validar:
- Conexión de Wallets con `@stellar/freighter-api` (`isConnected`, `requestAccess`, `getAddress`, `signTransaction`).
- Construcción y firma de transacciones `Operation.payment` con `Asset.native()` y `Memo.text()` utilizando `@stellar/stellar-sdk` (`Horizon.Server`, `TransactionBuilder`, `BASE_FEE`).
- Fondeo automático de cuentas nuevas en Testnet mediante `https://friendbot.stellar.org`.
- Generación de enlaces de pago compatibles con el estándar **SEP-0007** (`web+stellar:pay`).

---

## 🚀 Cómo ejecutar el proyecto localmente

```bash
cd JohannFonseca
npm install
npm run dev
```

Para compilar la versión de producción:

```bash
npm run build
```
