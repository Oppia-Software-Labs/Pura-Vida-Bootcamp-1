# Drawly 🎟️ — Rifas Verificables en Stellar Testnet

**Drawly** es una aplicación web descentralizada para rifas transparentes y verificables en la red **Stellar Testnet**.

---

## 🚀 Características Principales

- **Conexión Multi-Wallet con `@creit.tech/stellar-wallets-kit`**:
  - Soporte nativo para **Freighter** (Varial), **xBull** y **Albedo** en la red **TESTNET**.
  - Modal oficial del kit para selección fluida de wallet.
  - Detección de sesión activa y desconexión segura.
- **Consulta en Vivo a Horizon Testnet (`@stellar/stellar-sdk`)**:
  - Consulta automática del balance de **XLM nativo**.
  - Visualización de la dirección pública acortada con opción de copiar al portapapeles y enlace a [Stellar Expert Explorer](https://stellar.expert/explorer/testnet).
  - Detección de cuentas nuevas o aún no fondeadas en el ledger.
- **Faucet Friendbot Integrado**:
  - Botón interactivo para **Fondear 10,000 XLM (Friendbot)** en Testnet si la cuenta conectada no existe o tiene 0 XLM.
  - Actualización automática del balance tras el fondeo exitoso.
- **Stack Moderno**:
  - React 19 + Vite + TypeScript.
  - Tailwind CSS v4 para diseño web3 oscuro y responsivo.
  - `vite-plugin-node-polyfills` para compatibilidad completa con Buffer y criptografía en navegador.

---

## 📦 Versiones de Paquetes Utilizadas

- `@stellar/stellar-sdk`: `^17.4.0` (versión actual)
- `@creit.tech/stellar-wallets-kit`: `^2.8.0` (versión actual)
- `tailwindcss` & `@tailwindcss/vite`: `^4.3.5`
- `vite`: `^8.3.8`

---

## 🛠️ Instalación y Ejecución

Desde la carpeta del proyecto:

```bash
cd Drawly

# Iniciar servidor de desarrollo
npm run dev

# Compilar para producción
npm run build

# Vista previa de producción
npm run preview
```

---

## 📂 Estructura del Proyecto

```
Drawly/
├── src/
│   ├── components/
│   │   └── WalletConnect.tsx   # Componente principal de conexión de wallet y balance
│   ├── services/
│   │   ├── stellar.ts          # Integración Horizon, Friendbot y formateo de claves
│   │   └── walletKit.ts        # Inicialización y módulos de Stellar Wallets Kit
│   ├── App.tsx                 # Interfaz principal de Drawly con rifas activas
│   ├── main.tsx                # Punto de entrada de React
│   └── index.css               # Configuración de Tailwind CSS v4 y tema oscuro
├── vite.config.ts              # Configuración de Vite con Tailwind y Polyfills
└── package.json
```
