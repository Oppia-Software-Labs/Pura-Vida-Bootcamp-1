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

---

# Investigación Stellar Raven — Misión 2

Realizada el **16/11/2026**, antes de escribir la integración de firmas. No se han añadido dependencias ni backend.

## Llamadas reales de esta etapa

1. `stellar-raven.search`, servicio `stellarDocs`, límite 3: `Varial signMessage SEP-53 message signing verify signature nonce replay`. Descubrió `stellarDocs.search_anchor_sep_docs`, `stellarDocs.search_wallet_dapp_docs` y `stellarDocs.search_soroban_contract_docs`. Los candidatos eran de relevancia limitada, no evidencia del algoritmo.
2. `stellar-raven.search`, servicio `stellarDocs`, límite 3: `SEP-0053 arbitrary message signing bytes hash Stellar Signed Message`. Descubrió también la operación general `stellarDocs.search_docs`.
3. `stellar-raven.execute`: en paralelo, `search_wallet_dapp_docs` con `Varial signMessage SEP-53` (2 hits), `search_docs` con `SEP-53 signed message nonce replay` (2 hits) y `search_anchor_sep_docs` con `SEP-0053 arbitrary message signing` (1 hit), todos con contenido. Observado a las **16:38:02.777Z**. Resultados: guía de Varial centrada en transacciones, guía CLI de firmas SEP-53 y una coincidencia adyacente de SEP-10. La guía CLI distingue prueba de una clave de autorización de una cuenta multisig. La coincidencia SEP-10 **no describe signMessage ni SEP-53**.
4. `stellar-raven.search`, servicio `stellarDocs`, límite 1: `get_doc_page read full documentation page`. Descubrió `stellarDocs.get_doc_page`.
5. `stellar-raven.execute`: páginas completas `/docs/tools/cli/agent-cli/guides/sign-messages`, `/docs/build/guides/freighter/prompt-to-sign-tx`, `/docs/platforms/anchor-platform/sep-guide/sep10`. Observado a las **16:38:24.816Z**. Confirmó verificación offline SEP-53, cuidado con codificar el mensaje como base64 por error y diferencia entre prueba local de clave y autenticación con desafío verificado en servidor.
6. `stellar-raven.execute`: `search_docs` con `signMessage base64 SEP-53` y `nonce replay attack challenge expiration` (2 hits por consulta, contenido incluido). Observado a las **16:38:51.344Z**. La referencia CLI describe prefijo, SHA-256 y Ed25519; la búsqueda de replay devolvió desafíos SEP-10 y vencimiento. **No proporcionó una política de nonce específica de SEP-53**: el nonce aleatorio, TTL y consumo de esta aplicación son decisiones propias, no requisitos atribuidos a ese SEP.

Las marcas `observed` son tiempos de observación, no fechas de actualización de los documentos. No se ejecutaron skills de Raven ni operaciones de envío de fondos.

## Fuentes contrastadas y límites

- Raven: [Firmar mensajes con SEP-53](https://developers.stellar.org/docs/tools/cli/agent-cli/guides/sign-messages), [Referencia CLI](https://developers.stellar.org/docs/tools/cli/stellar-cli#stellar-message-sign), [Integración Varial](https://developers.stellar.org/docs/build/guides/freighter/prompt-to-sign-tx), [SEP-10](https://developers.stellar.org/docs/platforms/anchor-platform/sep-guide/sep10). SEP-10 se consultó para contrastar el modelo de autenticación de servidor; no se implementa ni se sustituye por una firma local.
- Fuera de Raven, lectura de la [especificación oficial SEP-0053](https://github.com/stellar/stellar-protocol/blob/master/ecosystem/sep-0053.md): versión 1.0.0, estado Final, actualización declarada 2026-06-18. Bytes UTF-8 del prefijo `Stellar Signed Message:\n` concatenados con los bytes UTF-8 del mensaje; SHA-256 una vez; firma Ed25519 de ese hash. El prefijo se aplica exactamente una vez, sin longitud ni terminador adicional. Se verificaron sus vectores públicos ASCII y japonés; no se incorporaron las semillas publicadas.
- [Documentación de signMessage en el repositorio oficial](https://github.com/stellar/freighter/blob/master/docs/docs/playground/signMessage.mdx): declara firma base64. Su ejemplo mezcla representaciones que no corresponden a los tipos actuales; no se copió ese fragmento de verificación.
- [Manejador oficial signBlob](https://github.com/stellar/freighter/blob/master/extension/src/background/messageListener/handlers/signBlob.ts) y [puente externo](https://github.com/stellar/freighter/blob/master/%40shared/api/external.ts): mensaje enviado como `blob`, cuenta y passphrase en opciones; respuesta con firma y dirección. El repositorio conserva el nombre Freighter aunque el producto/paquete sean Varial.
- Archivos oficiales instalados: `@stellar/varial-sdk` **7.0.0**, `src/signMessage.ts` y su `.d.ts`; firma `signMessage(message: string, opts?: { networkPassphrase?: string; address?: string })`; respuesta unión `{ signedMessage: string | null; signerAddress: string; error? }` o variante heredada con `Buffer | null`.
- `@stellar/stellar-sdk` **17.4.0**, `base/keypair.js` y tipos: `Keypair.verifyMessage(message, signature)` implementa SEP-53 y recibe firma `Uint8Array`, no string base64. `Buffer` es un `Uint8Array`. Se decodifica base64 canónico a exactamente 64 bytes y se aceptan bytes heredados de esa longitud. Otros formatos, firmas vacías o malformadas se rechazan; no se intenta adivinar hex ni cambiar el algoritmo.
- `docs.varialwallet.com/extension-varial-sdk/signing` y el sitio histórico `docs.freighter.app/docs/api/methods/` no pudieron recuperarse. Una búsqueda web adicional devolvió resultados ajenos a Stellar y se descartó. Se recurrió al repositorio oficial y al paquete instalado; esos resultados **no se atribuyen a Raven**.

## Decisiones implementadas

- `MessageChallenges` genera nonce de 256 bits con Web Crypto, origen completo, propósito legible, cuenta, passphrase Testnet y fechas ISO. Vencimiento de **3 minutos**. Desafío inmutable ligado al intento en memoria; verificación de vigencia, cuenta, origen y bytes exactos antes del consumo. Nonces consumidos no se reutilizan durante esa sesión local.
- Se usa el mensaje original al llamar `signMessage` y `verifyMessage`: ni se prefija manualmente ni se prehashea para esas APIs. Las pruebas contrastan el verificador con vectores oficiales y firmas generadas independientemente mediante SHA-256 de Node.
- Cuenta, permisos y passphrase se vuelven a consultar antes y después de solicitar firma. Una comprobación que ya estaba en curso se espera y se fuerza otra lectura. Generaciones de sesión e intento evitan completar con una respuesta antigua después de cancelar, desconectar, reconectar o cambiar de cuenta/red.
- El SDK mantiene sus solicitudes externas: cancelar aquí o salir de Misión 2 invalida el intento local, **no cierra el popup**. Se ignoran respuestas tardías; el usuario debe cerrar solicitudes anteriores en Varial antes de reintentar. Límite de espera de firma de 120 segundos.
- Solo la firma criptográficamente válida consume el desafío y produce `proof: true`. Luz, alineación, pulso y segundo candado abierto dependen de ese resultado. El escáner previo es una espera neutral. Máximo **2/3**; Misión 3 solo muestra su presentación, y `verifiedCompletion` permanece `null`.
- Todo es una **prueba criptográfica local de control de una clave** para una experiencia educativa. No autentica peticiones a un servidor, no evalúa thresholds/signers multisig, no genera tokens de sesión confiables y no persiste logros. No hay backend existente; no se añade infraestructura para presentar esta prueba como autenticación.
- No se guardan firmas, mensajes ni nonces en almacenamiento persistente. No se solicitan secretos ni firmas de transacciones. No se envían operaciones ni se modifica la apertura final.

## Validación de esta etapa

`npm test`: **47 pruebas aprobadas**, incluidas las 17 de Identidad, vectores SEP-53, firma alterada, mensaje alterado, cuenta/red/origen incorrectos, vencimiento, replay, rechazo, cambios de wallet, cancelación/reintento y respuestas tardías. `npm run build`: correcto. `npm run lint`: sin errores, con las cuatro advertencias visuales existentes (efectos del renderizador/controlador y dependencias de hooks). Vite mantiene el aviso de tamaño de módulos.

Las pruebas criptográficas usan claves efímeras y dobles de proveedor exclusivamente en pruebas; no se incluyen en producción. No se afirma haber aprobado un popup de una extensión real desde Chromium automatizado. El recorrido manual con Varial se describe en `README.md`.

Chromium validó el puente real del SDK con un doble aislado de extensión y firmas Ed25519 independientes, progreso 1/3 → 2/3 solo al verificar, opciones Testnet/cuenta, nonces nuevos, rechazo/firma inválida, cancelación y respuesta tardía, Misión 3 sin envío, cambio de cuenta → 0/3, móvil 320/390 y movimiento reducido. La pérdida de WebGL mantuvo ambos sellos en el fallback. Se corrigió un aviso de modo compatible que tapaba el botón de volver en móvil y se repitió el recorrido con éxito. No se solicitaron transacciones ni se añadieron proveedores de prueba al producto.
