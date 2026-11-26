# Órbita Stellar

**Autor:** Elián Fajardo Gutiérrez

Visor de solo lectura para una cuenta Stellar. Conecta la extensión Varial (antes Freighter), lee la dirección pública y consulta el saldo XLM de la red seleccionada en la wallet. Admite Mainnet y Testnet.

## Ejecutar

1. Instala y desbloquea la [extensión Varial / Freighter](https://www.freighter.app/).
2. En esta carpeta, ejecuta `python -m http.server 4173 --bind 127.0.0.1`.
3. En el mismo navegador que tiene la extensión, abre `http://127.0.0.1:4173`, pulsa **Conectar wallet** y aprueba la solicitud.
4. Para consultar otra cuenta o red, cambia la selección en la extensión y pulsa **Actualizar**. Al pulsar **Desconectar**, la app pide a la extensión que revoque el acceso.

El saldo se consulta mediante la API pública de Horizon. Una cuenta que aún no existe en la red muestra un mensaje de cuenta sin activar. La interfaz usa React y React DOM 19.2 como módulos del navegador. La aplicación necesita Internet para cargar React, el SDK de la wallet y consultar Horizon. Puedes servir los archivos directamente, sin instalar paquetes ni compilar.

## Apoyo de Stellar Raven

Ejecuté localmente el [motor de búsqueda de Stellar Raven](https://github.com/stellar-experimental/stellar-raven/blob/3e490ec/src/catalog/search.ts) con la consulta `connect Varial Freighter Stellar wallet frontend requestAccess Horizon account balance XLM`. Entre los resultados apareció `skills.stellar-dev.dapp`. Consulté esa [guía de wallets y frontend](https://github.com/stellar/stellar-dev-skill/blob/421ca30a671cd32d7d6466e8b903f10d79dc1590/skills/dapp/SKILL.md) para validar el flujo `isConnected()` → `requestAccess()` y la selección del servidor Horizon para cada red. La integración usa la versión 7.0.0 de [Varial SDK](https://github.com/stellar/freighter-developer-docs/blob/main/extension/installation.md).

La búsqueda se ejecutó con el manifiesto local de Raven. El endpoint remoto requiere una sesión OAuth.
