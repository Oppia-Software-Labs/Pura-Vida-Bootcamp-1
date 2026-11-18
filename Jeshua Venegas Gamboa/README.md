# Stellar Aprende Lab 🇨🇷

**Autor:** Jeshua Venegas Gamboa · Pura Vida Bootcamp · Entregable 1

App web sencilla para **aprender cómo funciona Stellar haciendo**, 100 % en **Testnet** (dinero de prueba, sin valor real).

## ¿Qué hace?

1. **Conecta tu wallet** (requisito mínimo de la tarea):
   - **Varial** (antes Freighter), la wallet recomendada en la clase 0 → https://varialwallet.com
   - o una **wallet de práctica** creada en el navegador (no instalas nada; se borra al cerrar la pestaña).
2. **Crea y fondea tu cuenta** con **Friendbot** (10 000 XLM de prueba).
3. **Muestra tus saldos** leyendo la red con **Horizon**.
4. **Envía pagos en XLM**: construye la transacción → la firma tu wallet → se envía a la red.
   Si el destino no existe todavía, usa la operación `createAccount` (mínimo 1 XLM).
5. **Historial** de tus últimos pagos con enlace a Stellar Expert.
6. **Bitácora educativa** que explica cada paso, y un **mini glosario** (Ledger, XDR, Horizon, Soroban, Raven…).

## Stack

- HTML + CSS + JavaScript (módulos ES), **sin frameworks y sin `npm install`**.
- [`@stellar/stellar-sdk`](https://github.com/stellar/js-stellar-sdk) 17.4.0 (desde CDN, versión fija con verificación de integridad SRI).
- [`@stellar/freighter-api`](https://github.com/stellar/freighter) 6.0.1 para hablar con Varial (antes Freighter).
- `server.js`: servidor local mínimo hecho solo con Node.js (sin dependencias).
- Red: Stellar **Testnet** · Horizon `https://horizon-testnet.stellar.org` · Friendbot `https://friendbot.stellar.org`.

## Cómo correrlo (Windows)

Requisitos: [Node.js](https://nodejs.org) 18 o superior (compruébalo con `node -v`) y conexión a internet.

```powershell
cd "ruta\a\esta\carpeta"
npm start          # es lo mismo que: node server.js
```

Abre **http://localhost:5173** en Chrome.

> ¿Por qué un servidor y no doble clic en `index.html`? Las wallets de extensión no se comunican con páginas abiertas como archivo (`file://`).

### Probar con Varial
1. Instala la extensión desde https://varialwallet.com y crea una cuenta.
2. En la configuración de Varial cambia la red a **Testnet**.
3. En la app pulsa **Conectar Varial** y aprueba en la ventana de la wallet.

### Probar sin instalar nada
Pulsa **Crear wallet de práctica** → **Fondear con Friendbot** → envía XLM a otra dirección (por ejemplo, otra wallet de práctica abierta en otra pestaña).

## Estructura

```
index.html        Interfaz (secciones 1-4, bitácora y glosario)
css/styles.css    Estilos
js/config.js      Red (TESTNET), URLs de Horizon, Friendbot y explorador
js/wallet.js      Conexión de wallet (Varial o de práctica) y firma
js/stellar.js     Cuentas, saldos, Friendbot, pagos e historial (Stellar SDK)
js/app.js         Une la interfaz con la lógica y escribe la bitácora
server.js         Servidor local sin dependencias
docs/RAVEN.md     Cómo usé Stellar Raven (el MCP oficial) durante el desarrollo
```

## Cómo funciona Stellar (en corto)

- **Cuenta = par de claves.** Pública (`G…`, tu dirección) y secreta (`S…`, firma). La secreta nunca se comparte.
- **Reserva mínima.** Una cuenta existe cuando tiene al menos 1 XLM.
- **Transacciones.** Agrupan operaciones (`payment`, `createAccount`, …), pagan una comisión mínima (0.00001 XLM) y se confirman en ~5 s cuando se cierra el siguiente *ledger*.
- **Consenso.** Stellar usa su Protocolo de Consenso (SCP / *Proof of Agreement*), sin minería.
- **Soroban.** La plataforma de contratos inteligentes de Stellar (tema del próximo campamento).

## Seguridad

- Solo **TESTNET**. La app se niega a firmar si tu wallet está en otra red.
- La app **nunca** pide ni guarda tu clave secreta de Varial.
- La wallet de práctica vive solo en memoria y es para pruebas.

## Recursos

- Stellar Raven (MCP oficial): https://raven.stellar.org · docs: https://raven.stellar.org/docs
- Documentación de Stellar: https://developers.stellar.org
- Repo de ejemplo de la clase 0: https://github.com/Oppia-Software-Labs/app-prueba-clase-0
- Explorador de testnet: https://stellar.expert/explorer/testnet
