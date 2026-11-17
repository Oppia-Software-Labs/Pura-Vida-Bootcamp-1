# Investigación Stellar Raven — Misión 1

Consulta real realizada el **16 de noviembre de 2026**, antes de implementar esta integración. Servidor MCP `stellar-raven`, herramientas `search` y `execute`. Las marcas `asOfBasis: observed` indican cuándo se observó una respuesta, no la fecha de publicación de la documentación.

## Consultas realizadas

1. `search`, servicio `stellarDocs`, consulta `Varial SDK requestAccess getAddress getNetworkDetails authorization errors`, límite 3. Descubrió `stellarDocs.get_doc_page`, `stellarDocs.search_sdk_cli_tools_docs` y `stellarDocs.search_doc_titles`.
2. `search`, servicio `stellarDocs`, consulta `RPC getAccount XLM balance Testnet getLedgerEntries SDK 17`, límite 3. Descubrió `stellarDocs.get_doc_page` y `stellarDocs.search_protocol_concepts_docs`.
3. `execute`: consultas `search_sdk_cli_tools_docs` con `Varial freighter-api requestAccess` y `RPC getAccount balance XLM` (2 resultados, contenido incluido), y lectura con `get_doc_page` de:
   - `/docs/build/guides/freighter/prompt-to-sign-tx`
   - `/docs/build/guides/freighter/connect-testnet`
   - `/docs/networks`
   Respuesta observada a las `15:53:12.234Z`. Las búsquedas devolvieron coincidencias de Stellar Lab poco pertinentes; **no se utilizan para justificar las APIs de conexión**. Las páginas completas sí confirmaron el cambio de nombre del paquete, la selección de Testnet y los endpoints/passphrase oficiales.
4. `search`, servicio `stellarDocs`, consulta `search_docs Varial requestAccess authorization wallet`. Descubrió `stellarDocs.search_wallet_dapp_docs`.
5. `execute`: `search_wallet_dapp_docs`, consulta `Varial requestAccess getAddress isAllowed` (1 resultado, contenido incluido); `get_doc_page` de `/docs/tools/sdks/client-sdks`; `search_protocol_concepts_docs`, consulta `account balance stroops` (1 resultado). Respuesta observada a las `15:53:37.358Z`. La guía frontend mostró imports de `@stellar/varial-sdk` y autorización mediante `setAllowed`/`getAddress`. La búsqueda sobre saldo devolvió contenido de trustlines, insuficiente para determinar la forma exacta del resultado RPC.
6. `execute`: lectura completa con `get_doc_page` de `/docs/build/guides/dapps/frontend-guide` y `/docs/data/apis/rpc/api-reference/methods/getLedgerEntries`. Respuesta observada a las `15:54:01.871Z`. Confirmó la integración frontend, los contextos locales admitidos y la lectura de entradas del ledger mediante claves XDR.

## Fuentes oficiales y alcance de los hallazgos

- [Guía Varial, antes Freighter](https://developers.stellar.org/docs/build/guides/freighter/prompt-to-sign-tx): recomienda `@stellar/varial-sdk`; el paquete antiguo continúa funcionando, pero las nuevas APIs corresponden al nuevo paquete. Se consultó como fuente de selección del SDK; **no se implementan firmas**.
- [Conectar a Testnet](https://developers.stellar.org/docs/build/guides/freighter/connect-testnet): seleccionar Test Net en la wallet; las cuentas nuevas pueden necesitar XLM de Friendbot mediante la wallet o Stellar Lab.
- [Redes Stellar](https://developers.stellar.org/docs/networks): Testnet usa exactamente `Test SDF Network ; September 2015`, RPC `https://soroban-testnet.stellar.org` y Horizon `https://horizon-testnet.stellar.org`.
- [Guía frontend](https://developers.stellar.org/docs/build/guides/dapps/frontend-guide): integración Varial y autorización; `localhost`/`127.0.0.1` sirven para el desarrollo local. La conexión requiere interacción con la extensión.
- [SDKs cliente](https://developers.stellar.org/docs/tools/sdks/client-sdks): SDK JavaScript oficial compatible con navegador y Node.
- [getLedgerEntries](https://developers.stellar.org/docs/data/apis/rpc/api-reference/methods/getLedgerEntries): lectura del estado actual mediante claves de ledger. Una entrada ausente permite distinguir una cuenta inactiva de un fallo de transporte.
- [Referencia del SDK RPC](https://stellar.github.io/js-stellar-sdk/reference/network-rpc/): consulta complementaria fuera de Raven para contrastar las APIs actuales.
- [Código oficial de errores de la extensión](https://github.com/stellar/freighter/blob/master/%40shared/api/helpers/extensionMessaging.ts), consultado mediante su versión raw: rechazo `FreighterApiDeclinedError`, código `-4`; la wallet bloqueada tiene mensaje específico. Los errores internos/de nodo no se clasifican automáticamente como rechazo.

El sitio `docs.varialwallet.com` no pudo recuperarse durante la consulta. No se le atribuyen resultados. Para los métodos exactos se contrastó además el **código y los tipos del paquete oficial instalado**, evitando asumir que los fragmentos de documentación coinciden con cada versión:

- `@stellar/varial-sdk` **7.0.0**, `src/requestAccess.ts`, `getAddress.ts`, `getNetworkDetails.ts`, `isAllowed.ts`, `isConnected.ts`, `watchWalletChanges.ts`.
- `requestAccess()` solicita acceso y devuelve `{ address, error? }`; `getAddress()` devuelve la dirección autorizada; `isAllowed()` permite comprobar si continúa autorizado el origen; `getNetworkDetails()` incluye `networkPassphrase`.
- `isConnected()` comprueba disponibilidad de la extensión; **no demuestra autorización de la cuenta**.
- `WatchWalletChanges` usa sondeo (3 segundos por defecto), consulta cuenta/red y no comprueba por sí mismo la autorización.
- `@stellar/stellar-sdk` **17.4.0**, tipos y código de `rpc.Server.getLedgerEntries`, `getAccountEntry`, `xdr.LedgerKey`, `LedgerEntryData`, `StrKey`, `Networks`. En esta versión `entry.type === 'account'` y `entry.value.balance` son propiedades. No se usan los accesores de versiones antiguas.
- `getAccountEntry` captura errores y puede convertir fallos de transporte en `Account not found`. Para distinguir los estados exigidos se utiliza `getLedgerEntries` directamente.

## Decisiones implementadas

1. Puerto tipado `WalletPort`, adaptador real Varial/RPC y sesión observable separados del HUD y de Three.js. No se añade backend ni dependencia de pruebas; se utiliza el runner de Node y Vite existente para empaquetar sus módulos.
2. Solo se solicita autorización tras pulsar **Conectar wallet**. Se comprueba instalación, `requestAccess`, autorización vigente, dirección Ed25519 válida con `StrKey` y passphrase idéntica a `Networks.TESTNET`. El nombre visible de la red no basta; una red personalizada con nombre Testnet y otra passphrase se rechaza.
3. Saldo nativo total del ledger, convertido de stroops con `bigint` y precisión de 7 decimales. **No es saldo gastable**: no descuenta reservas ni obligaciones. RPC oficial fijo; no se confía en un endpoint suministrado por la wallet.
4. Cuenta inexistente → aviso de activación; cero → sin saldo; transporte/servidor → error de consulta y reintento manual. No se financia automáticamente ni se envían transacciones.
5. Misión 1 depende de autorización, dirección válida y Testnet, **no de tener fondos**. El saldo es información adicional. Conectarse no demuestra criptográficamente el control de la clave; eso corresponde a la futura Misión 2.
6. Sondeo serializado cada segundo en pestaña visible y comprobaciones al recuperar foco/visibilidad, antes y después de consultar saldo. Al detectar cambio de cuenta/red o pérdida de autorización se eliminan identidad, dirección y saldo, se retira el primer sello y se vuelve a Misión 1. Respuestas antiguas no pueden restaurar una sesión cancelada. No hay eventos nativos instantáneos demostrados en esta API: existe la latencia del sondeo y de la extensión, con límite de espera de 10 segundos para lecturas.
7. Autorización con límite de 120 segundos y cancelación local; una respuesta tardía se ignora. La cancelación local no cierra el popup ni revoca el permiso guardado en la extensión. Desconectar elimina únicamente el estado local; no se persiste una identidad ni un logro verificado.
8. Primera cerradura con movimiento y luz propios; progreso máximo **1/3**. La siguiente misión se puede visitar, pero no permite firmar. `verifiedCompletion` sigue en `null`; no se abre la puerta final.
9. No se solicitan claves, frases, firmas ni pagos. No existen proveedores simulados en la aplicación; los dobles de proveedor pertenecen exclusivamente a pruebas automatizadas.

## Compatibilidad y límites de validación

La integración se contrasta con React 19.3.1, TypeScript 7.0.2, Vite 8.3.8 y los dos paquetes Stellar indicados. Los tipos se verifican mediante `npm run build`; los estados y carreras de sesión, mediante `npm test`. Esto no sustituye la aprobación manual con una extensión real. El navegador de pruebas automatizadas no dispone de una wallet instalada: no se afirma haber probado una autorización real en ese navegador. Ver instrucciones y resultados de validación en `README.md`.

Resultado: 17 pruebas de sesión aprobadas. Lecturas reales complementarias (fuera de Raven) mediante el adaptador implementado: saldo RPC `4725.3072625` XLM, igual al saldo nativo de Horizon en el momento de consulta para una cuenta pública tomada de `/transactions?limit=1&order=desc`; cuenta aleatoria sin entrada → `null`. No se transfirieron fondos. La búsqueda inicial `/accounts?limit=1&order=desc` devolvió HTTP 400 por falta de filtros; una dirección de referencia conocida sí existía y no sirvió para demostrar ausencia. Estas comprobaciones no se atribuyen a Raven ni demuestran que una extensión haya autorizado la aplicación.
