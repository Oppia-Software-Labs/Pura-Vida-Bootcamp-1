# Pura Vida Wallet ✦

**Autor:** Sebastián Badilla Chaves
**Entregable 1 · Pura Vida Bootcamp:** Tu primera app en Stellar con Stellar Raven

Pura Vida Wallet es una dApp sencilla que corre sobre la **Testnet de Stellar**. Sirve para conectar tu wallet, ver tu saldo y mandar XLM de prueba.

## Funcionalidades

1. **Conectar wallet (requisito mínimo):** conexión con la extensión [Freighter](https://www.freighter.app) mediante `@stellar/freighter-api`. Si ya autorizaste la app, se reconecta sola al recargar la página. Si tu Freighter no está en Testnet, te avisa.
2. **Ver saldo:** consulta el saldo de XLM en Horizon Testnet. Si la cuenta todavía no existe, te deja fondearla con **Friendbot** (10 000 XLM de prueba).
3. **Enviar XLM:** arma la transacción con `@stellar/stellar-sdk`, la firmas en Freighter y se envía a la red. Puedes agregarle un memo opcional y al final te muestra el enlace a la transacción en Stellar Expert. Si la cuenta destino no existe, la crea con `createAccount`.

## Tecnologías

- [Vite](https://vite.dev) con JavaScript (sin framework)
- [`@stellar/stellar-sdk`](https://github.com/stellar/js-stellar-sdk) para Horizon y la construcción de transacciones
- [`@stellar/freighter-api`](https://docs.freighter.app) para conectar la wallet y firmar
- Stellar Testnet, Friendbot y Stellar Expert

## Cómo correrla

Requisitos: Node.js 20 o superior y la extensión Freighter en el navegador.

```bash
cd Sebastian-Badilla-Chaves
npm install
npm run dev
```

Abre la URL que muestra Vite (por defecto `http://localhost:5173`).

### Prueba rápida

1. En Freighter, cambia la red a **Testnet**.
2. Haz clic en **Conectar wallet** y aprueba la conexión.
3. Si tu cuenta es nueva, haz clic en **Fondear con Friendbot**.
4. Envía unos XLM a otra dirección de Testnet y abre el enlace a la transacción.

## Estructura

```
Sebastian-Badilla-Chaves/
├── index.html
├── package.json
└── src/
    ├── config.js    # URLs y passphrase de Testnet
    ├── wallet.js    # Conexión y firma con Freighter
    ├── stellar.js   # Saldo, Friendbot y pagos (Horizon)
    ├── main.js      # Interfaz y estado de la app
    └── style.css
```

## Stellar Raven

Para consultar la documentación de Stellar durante el desarrollo, el MCP oficial [Stellar Raven](https://raven.stellar.org/) se conecta al asistente de IA con el endpoint `https://raven.stellar.org/mcp`.
