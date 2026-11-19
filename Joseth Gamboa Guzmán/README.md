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

## Stellar Raven

Para consultar la documentación de Stellar durante el desarrollo, el MCP oficial [Stellar Raven](https://raven.stellar.org/) se conecta al asistente de IA con el endpoint `https://raven.stellar.org/mcp`.
