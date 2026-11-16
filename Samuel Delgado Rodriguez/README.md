# Stellar Vista · Samuel Delgado Rodriguez

Visor de cuenta de **Stellar Testnet**. Conecta Varial (antes Freighter), consulta el saldo XLM y muestra la dirección pública. No firma transacciones ni solicita claves privadas.

## Ejecutar

Requisitos: Node.js 20.19+ o 22.12+ y la extensión [Varial](https://varialwallet.com/).

```bash
cd "Samuel Delgado Rodriguez"
npm ci
npm run dev
```

Abre la URL local que muestra Vite. En Varial selecciona **Testnet**. Pulsa **Conectar Varial** y autoriza el acceso. Si la cuenta no existe todavía en Testnet, la app lo indica y no inventa un saldo. La consulta de saldo usa el endpoint público `https://horizon-testnet.stellar.org/accounts/{address}`. El saldo se formatea como cadena decimal para conservar sus siete decimales.

## Comprobar

```bash
npm test
npm run build
```

Las pruebas cubren conexión correcta, extensión ausente, autorización rechazada, red incorrecta, extracción y formato exacto del saldo XLM, cuenta inexistente y error de Horizon. El diseño se adapta a escritorio y móvil.

## Stellar Raven durante el desarrollo

El **16 de noviembre de 2026** se usó el MCP oficial `https://raven.stellar.org/mcp` mediante las herramientas `search` y `execute`. Se hicieron estas consultas:

1. `Freighter wallet JavaScript requestAccess getNetwork networkPassphrase React connection` y `Freighter Varial migration extension`. Raven devolvió la [guía oficial de Varial](https://developers.stellar.org/docs/build/guides/freighter) y la [guía del SDK](https://developers.stellar.org/docs/build/guides/freighter/prompt-to-sign-tx). Confirman que Varial es el nuevo nombre de Freighter y que `@stellar/varial-sdk` reemplaza a `@stellar/freighter-api`. Por eso se actualizó la dependencia, las importaciones y el texto de la interfaz. El paquete anterior sigue funcionando, pero no recibe métodos nuevos.
2. `Horizon testnet accounts endpoint native balance 404 account not found`. Raven devolvió [Retrieve an Account](https://developers.stellar.org/docs/data/apis/horizon/api-reference/retrieve-an-account) y el [ejemplo de balances](https://developers.stellar.org/docs/data/apis/migrate-from-horizon-to-rpc). Confirman `GET /accounts/{account_id}`, el arreglo `balances`, `asset_type: "native"` para XLM y la respuesta `404` para un recurso inexistente. Se mantuvo la consulta a Horizon Testnet y se añadió formato decimal exacto.
3. Se leyó la sección `wallet-integration` y el archivo `data-fetching.md` del skill `skills.stellar-dev.dapp` de Raven. Su ejemplo de cuenta sin fondos devuelve cero, pero esta interfaz muestra **cuenta aún no creada**, que distingue mejor ese estado de un saldo real de cero.

La documentación de Raven no sustituyó la verificación local: se ejecutaron pruebas, compilación y auditoría de dependencias. El skill `.cursor/skills/stellar-raven-bootcamp` del repositorio recuerda cómo repetir el flujo.

## Diseño

Una sola pantalla con acción principal de conexión, estados claros de carga y error, etiqueta visible de Testnet, botones de copia, actualización y desconexión. No se proporcionó un archivo de Figma; el diseño se hizo directamente para esta práctica.
