# Stellar Testnet dApp — Luis Alonso Jiménez Ramírez

Aplicación web construida con **Vite + React (JavaScript)** para conectar una wallet de Stellar (**Freighter / Varial**) en **Stellar Testnet** y consultar el saldo real en XLM.

Este proyecto fue desarrollado apoyándose en **Stellar Raven** (servidor MCP oficial del ecosistema Stellar) como referencia para la selección de paquetes oficiales, patrones de integración de wallet y consulta de datos en Horizon Testnet.

## ¿Qué hace la aplicación?

- Detecta si la extensión de navegador **Freighter / Varial** está instalada y solicita acceso mediante `@stellar/varial-sdk`.
- Muestra la **llave pública (`G...`)**, la **red activa** y avisa si la wallet no está configurada en **Stellar Testnet**.
- Permite **conectar y desconectar** la wallet, con mensajes claros si falta la extensión o si el usuario cancela la solicitud.
- Consulta automáticamente el **balance real en XLM** desde **Horizon Testnet** (`https://horizon-testnet.stellar.org`) usando `@stellar/stellar-sdk`, e incluye un botón para refrescar el saldo.
- Si la cuenta aún no está activada en Testnet (HTTP `404`), muestra un aviso y un botón para **fondearla con Friendbot** y recargar el balance automáticamente.

## Requisitos previos

- **Node.js 22 o superior** (requerido por `@stellar/stellar-sdk` v16+).
- **npm** instalado.
- Extensión de navegador **Freighter / Varial** ([varialwallet.com](https://varialwallet.com)) configurada en **Test Net** (*Settings → Network → Current Network: Test Net*).

## Instalación y ejecución

Desde la carpeta `luis-alonso-jimenez-ramirez/`:

```bash
npm install
npm run dev
```

Luego abre en tu navegador la URL local que muestre Vite (por defecto `http://localhost:5173`).

### Build de producción

```bash
npm run build
```
