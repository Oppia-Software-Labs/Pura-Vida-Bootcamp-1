# Órbita · mclitos en Stellar

Base ejecutable del primer reto del Pura Vida Bootcamp. Esta etapa prepara Vite y las dependencias; todavía no conecta una wallet.

## Ejecutar

Necesitás Node.js 22.12 o superior y npm.

```bash
cd mclitos
npm ci
npm run dev
```

Abrí la URL que informa Vite, normalmente http://127.0.0.1:5173.

## Compilar

```bash
npm run build
```

Las dependencias están fijadas en el lockfile. No se usan claves ni fondos.

## Integración de wallet

`src/wallet.js` expone `createWalletClient(sdk, fetcher)`. Usa los métodos de Varial `isConnected`, `requestAccess`, `getAddress` y `getNetworkDetails`. Conectar solicita permiso para compartir la dirección pública y exige Testnet.

`loadBalances(address)` consulta exclusivamente Horizon Testnet y comprueba cuenta y red antes y después de leer. Devuelve código, emisor y saldo sin redondear; informa errores en español. No firma ni envía transacciones.

El SDK y el flujo se eligieron consultando Stellar Raven: `stellarDocs.search_wallet_dapp_docs` y las secciones `recommended-dependencies` y `wallet-integration` de `skills.stellar-dev.dapp`.

## Pruebas de integración

```bash
npm test
```

Las pruebas usan dobles del SDK y de Horizon; no requieren claves, extensión ni fondos.
