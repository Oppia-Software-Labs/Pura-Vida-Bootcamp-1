# Stellar Vista · Samuel Delgado Rodriguez

Visor de cuenta de **Stellar Testnet**. Conecta Freighter, consulta el saldo XLM y muestra la dirección pública. No firma transacciones ni solicita claves privadas.

## Ejecutar

Requisitos: Node.js 20.19+ o 22.12+ y la extensión [Freighter](https://www.freighter.app/).

```bash
cd "Samuel Delgado Rodriguez"
npm ci
npm run dev
```

Abre la URL local que muestra Vite. En Freighter selecciona **Testnet**. Pulsa **Conectar Freighter** y autoriza el acceso. Si la cuenta no existe todavía en Testnet, la app lo indica y no inventa un saldo. La consulta de saldo usa el endpoint público `https://horizon-testnet.stellar.org/accounts/{address}`.

## Comprobar

```bash
npm test
npm run build
```

Las pruebas cubren conexión correcta, extensión ausente, autorización rechazada, red incorrecta, extracción del saldo XLM, cuenta inexistente y error de Horizon. El diseño se adapta a escritorio y móvil.

## Stellar Raven durante el desarrollo

Stellar Raven se conecta como MCP en `https://raven.stellar.org/mcp` y requiere autorización OAuth del usuario. En este entorno de trabajo no había una conexión MCP de Raven disponible. Se consultaron su [documentación](https://raven.stellar.org/docs) y su endpoint público `/health` (respuesta `status: ok`), junto con las fuentes oficiales de [Freighter](https://github.com/stellar/freighter-developer-docs/blob/main/extension/connecting.md) y [Horizon](https://developers.stellar.org/docs/data/apis/horizon/api-reference/resources/accounts). No se presenta una consulta MCP como realizada.

Para completar el ejercicio con Raven conectado, consulta:

1. «¿Cuál es el flujo recomendado para conectar Freighter y comprobar que la wallet está en Testnet?»
2. «¿Qué devuelve Horizon Testnet para una cuenta inexistente y cómo identifico el balance XLM nativo?»

Compara la respuesta con el código en `src/stellar/` y anota en el PR cualquier ajuste que indique Raven. El skill `.cursor/skills/stellar-raven-bootcamp` de este repositorio guía este paso.

## Diseño

Una sola pantalla con acción principal de conexión, estados claros de carga y error, etiqueta visible de Testnet, botones de copia, actualización y desconexión. No se proporcionó un archivo de Figma; el diseño se hizo directamente para esta práctica.
