# Stellar Wallet Explorer

**Autor:** Joseth Gamboa Guzmán  
**Bootcamp:** Pura Vida Bootcamp · Stellar × BAF  
**Red:** Stellar Testnet

Miniaplicación web con diseño oscuro/morado para conectar una wallet **Freighter**, ver su dirección pública y consultar su saldo XLM de pruebas desde Stellar Horizon.

## Funcionalidades
- Botón de conexión con Freighter, con autorización por la extensión.
- Validación de que la wallet está en **TESTNET**.
- Consulta del balance XLM en Horizon Testnet.
- Copiar dirección, abrir explorador público, actualizar saldo y desconexión local.
- Vista adaptable a pantallas pequeñas.

## Ejecutar

Se necesita un navegador de escritorio con la extensión [Freighter](https://www.freighter.app/) instalada y configurada para **Testnet**.

1. Abrí una terminal dentro de esta carpeta.
2. Ejecutá `python -m http.server 8000` (o `python3 -m http.server 8000`).
3. Visitá `http://localhost:8000` en el navegador con Freighter.
4. Presioná **Conectar Freighter**, aprobá el permiso y comprobá el saldo.

El navegador requiere acceso a Internet para cargar la biblioteca Freighter desde `esm.sh` y consultar Horizon.

Si tu cuenta aún no existe en Testnet, podés activarla usando [Friendbot](https://friendbot.stellar.org/) con su dirección pública. **No introduzcas jamás tu clave secreta en la aplicación.**

## Seguridad y alcance
- Proyecto educativo de **solo lectura**, sin operaciones ni pagos.
- No pide frases semilla ni claves privadas.
- La desconexión de la interfaz borra la sesión local, pero la revocación del permiso debe hacerse desde Freighter.
- No se realizaron pruebas de conexión reales con una extensión en este entorno; probá el flujo en tu navegador antes de entregar.

## Stellar Raven

La consigna requiere consultar [Stellar Raven](https://raven.stellar.org/) durante el desarrollo. Antes de entregar, conectá Raven en tu entorno MCP y consultale por la integración de Freighter y el uso de Horizon Testnet; registrá aquí brevemente qué sugerencia suya aplicaste. No afirmes haberlo usado si todavía no lo hiciste.
