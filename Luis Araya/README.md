# Relata

Relata es una aplicación web de solo lectura para consultar pagos recientes de una cuenta en **Stellar Testnet** y escuchar una explicación breve en español.

## Ejecutar la aplicación en local

Se necesita Node.js 22 o posterior y conexión a Internet para consultar Testnet.

```sh
npm install
npm start
```

Para regenerar el bundle local del selector multi-wallet (`vendor/stellar-wallets-kit/index.js`), ejecuta:

```sh
npm run build:wallet-kit
```

Abre `http://127.0.0.1:4173` en Brave, Chrome, Edge o Zen. `server.js` solo sirve los archivos estáticos permitidos de la interfaz en `127.0.0.1`; la aplicación funciona sin backend propio y consulta directamente `https://horizon-testnet.stellar.org` desde el navegador.

## Ejecutar las pruebas

```sh
npm test
node --test tests/payments.test.js
```

- `tests/payments.test.js` y `tests/relata-ui.test.js` validan de forma determinista la selección de pagos, explicaciones en español, guardias de red/wallets, selección de voz y tema claro/oscuro.
- `tests/horizon.test.js` ejecuta las validaciones locales y de cancelación (`AbortController`) sin exponer direcciones reales. Si deseas correr también las pruebas en vivo contra Horizon Testnet con tus propias cuentas de prueba, define las variables de entorno `RELATA_TEST_ACCOUNT_1` y `RELATA_TEST_ACCOUNT_2` (por ejemplo en `.env`, excluido por `.gitignore`).

## Módulos y archivos principales

- `index.html`, `styles.css`, `src/app.js` y `src/relata-ui.js`: interfaz web estática de solo lectura, selector **Conectar wallet** con `@creit.tech/stellar-wallets-kit` (`2.8.0` empaquetado localmente en `vendor/stellar-wallets-kit/index.js` para wallets de navegador/web como Varial, LOBSTR, xBull y Albedo, sin WalletConnect), botón **Nueva consulta**, consulta por cualquier dirección pública `G...` (rechazando claves secretas `S...`), cantidad configurable de movimientos (`1`–`50`, por defecto `5`), modo claro/oscuro, formateo en español y lectura en voz alta con `speechSynthesis` bajo acción explícita del usuario.
- `server.js`: servidor estático mínimo para desarrollo local en `127.0.0.1:4173` (solo `GET`/`HEAD` sobre la lista explícita de archivos de la interfaz).
- `src/horizon.js`: `fetchPayments(account, { signal, pageSize = 200, limit = 5 })` consulta exclusivamente `https://horizon-testnet.stellar.org`, con pagos exitosos, orden descendente y `join=transactions`. No configura otra red, no sigue enlaces remotos ni redirecciones y no utiliza credenciales.
- `src/payments.js`: selecciona los pagos compatibles y genera su explicación en español. Reconoce XLM nativo, USDC y EURC verificados mediante código y emisor oficial de Testnet publicado por [Circle](https://developers.circle.com/stablecoins/usdc-on-test-networks) (`USDC` `GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5` y `EURC` `GB3Q6QDZYTHWT7E5PVS3W7FUT5GVAFC5KSZFFLPU25GO7VTC3NM2ZTVO`), conservando importes exactos sin convertirlos a coma flotante.

## Documentación

- [`docs/relata-descubrimiento-alcance.md`](docs/relata-descubrimiento-alcance.md): alcance funcional de la primera entrega.
- [`docs/propuesta-control-por-voz.md`](docs/propuesta-control-por-voz.md): estado actual y propuesta futura de control por voz inclusivo.
