# Stellar Vista · Daniel Elizondo

Aplicación de solo lectura para conectar una wallet **Freighter** y consultar la dirección y el saldo XLM en **Stellar Testnet** mediante Horizon. No solicita claves privadas ni firma transacciones.

## Ejecutar

Requisitos: Node.js 20.19+ o 22.12+, npm y la extensión [Freighter](https://www.freighter.app/) instalada en el navegador.

```sh
cd "Daniel Elizondo"
npm ci
npm run dev
```

Abre la URL local que indica Vite (normalmente `http://localhost:5173/`). En Freighter selecciona **Testnet**, desbloquea la extensión y pulsa **Conectar Freighter**. Autoriza el acceso a la dirección pública. Puedes actualizar el saldo, copiar la dirección o abrirla en Stellar Expert. Si la cuenta no existe aún en Testnet, se mostrará un saldo de 0 XLM y una indicación para financiarla.

**Nota:** «Desconectar» borra la cuenta de la vista de esta aplicación; para revocar el permiso de acceso, hazlo desde Freighter. La consulta a Horizon requiere conexión a Internet.

## Validación

```sh
npm test
npm run build
```

## Stellar Raven

Raven es el **asistente MCP de desarrollo**, no una dependencia de la aplicación ni un servicio que se ejecute en el navegador. Para conectarlo a OpenCode:

```sh
opencode mcp add stellar-raven --global --url https://raven.stellar.org/mcp
opencode mcp list
```

Si aparece `needs authentication`, abre `/mcps` en OpenCode, selecciona `stellar-raven` y completa la autorización en el navegador. Consulta a Raven sobre la conexión de wallet, la verificación de Testnet y la consulta de cuentas en Horizon. No se requiere ninguna API key de Raven en la app.
