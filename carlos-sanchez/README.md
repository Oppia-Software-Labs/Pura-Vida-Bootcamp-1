# Proofolio

Proofolio es una dApp bilingüe para reconocer contribuciones públicas. Una wallet firma el reconocimiento de otra persona usando como evidencia un Pull Request fusionado; el perfil del contributor agrupa su historial y los proyectos que ayudó.

La demo funciona exclusivamente en Stellar Testnet, sin backend, GitHub OAuth, Mainnet ni pagos reales.

## Estado del proyecto

La aplicación vive en la carpeta `carlos-sanchez/` del fork y se entrega en seis commits revisables. La arquitectura está en [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) y las decisiones de investigación en [`docs/RESEARCH.md`](docs/RESEARCH.md).

## Alcance funcional

- Conexión multi-wallet mediante Stellar Wallets Kit, bloqueada a Testnet.
- Fondeo de la cuenta conectada mediante Friendbot.
- Búsqueda de perfiles por dirección Stellar.
- Validación de Pull Requests públicos fusionados mediante la API de GitHub.
- Emisión de reconocimientos inmutables mediante Soroban.
- Cronología de contribuciones y agrupación por proyecto.
- Interfaz ES/EN, responsive y accesible.

## Autor

Carlos Sanchez, GitHub [`ceshez`](https://github.com/ceshez).

## Ejecutar localmente

Requisitos: Node.js 22 o posterior, Rust, Stellar CLI y `wasm32v1-none` para recompilar el contrato.

```bash
npm install
npm run dev
```

Abre `http://localhost:5173`. Para validar cambios: `npm run lint`, `npm test` y `npm run build`.

## Contrato y demo Testnet

- Contract ID: `CACV4DTLHGBSZFLIM7WW33SRW3WE4G7MMB55KNSR7KZDMEEOY5R4O5N4`
- Perfil demo: `GA6HBRP3FENGDRF33D2D7CQY5PKKVKPLHMP63XLLKHPBWATI2CER2SYD`
- PR de ejemplo: [Oppia-Software-Labs/Pura-Vida-Bootcamp-1#1](https://github.com/Oppia-Software-Labs/Pura-Vida-Bootcamp-1/pull/1)
- Emisión de muestra: [transacción Testnet](https://stellar.expert/explorer/testnet/tx/5249180c6a2c0305c6a1f3b362389c42312d40546d97942faddbacd90c317be5)

Conecta una wallet compatible, cámbiala a Testnet y usa Friendbot para obtener XLM de prueba. Busca la wallet del perfil demo para ver la contribución ya emitida. GitHub se valida fuera de cadena; la interfaz acredita que una wallet firmó el registro, no una verificación institucional.

Para redesplegar después de un reinicio de Testnet: `stellar contract build`, luego `stellar contract deploy --wasm target/wasm32v1-none/release/proofolio_contract.wasm --source proofolio-deployer --network testnet`. Regenera bindings con `stellar contract bindings typescript --contract-id <CONTRACT_ID> --network testnet --output-dir src/bindings/proofolio` y actualiza el ID en el binding, README y PR.
