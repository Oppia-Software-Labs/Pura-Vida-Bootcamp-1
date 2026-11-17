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

---

# Investigación Stellar Raven — Misión 3 y Génesis

Fecha: **16/11/2026**. El usuario aprobó expresamente el destino **su propia cuenta conectada** y el importe **0,1 XLM de Testnet**. La implementación exige revisión del destino/comisión y autorización en Varial; no se enviaron operaciones desde las herramientas del agente.

## Consultas reales

1. `stellar-raven.search`, `stellarDocs`, límite 3: `Stellar RPC build classic XLM payment sendTransaction getTransaction SUCCESS NOT_FOUND duplicate retry`. Descubrió `search_rpc_horizon_data_docs`, `get_doc_page` y `search_docs_in_category`.
2. `stellar-raven.search`, `stellarDocs`, límite 3: `Varial signTransaction signedTxXdr signerAddress Testnet fee balance reserve`. Descubrió `search_protocol_concepts_docs`, `search_soroban_contract_docs` y `search_sdk_cli_tools_docs`. Los candidatos por sí solos no validan una API.
3. `execute`: `search_rpc_horizon_data_docs` con `sendTransaction getTransaction SUCCESS DUPLICATE NOT_FOUND classic payment` y `search_protocol_concepts_docs` con `minimum balance reserve selling liabilities sponsorship XLM fee` (2 hits por consulta, contenido incluido), más `get_doc_page` para `/docs/data/apis/rpc/api-reference/methods/sendTransaction`, `/docs/data/apis/rpc/api-reference/methods/getTransaction` y `/docs/build/guides/freighter/prompt-to-sign-tx`. Observado **17:44:56.546Z**. La salida contenía ejemplos XDR extensos y se truncó; se recuperó mediante el artefacto de Raven, sin inferir contenido ausente.
4. `execute`: lectura del artefacto `206ad602-b84d-4446-b739-125bacfa2d14` para inspeccionar su estructura. Esta llamada no añadió fuentes ni ejecutó transacciones.
5. `execute`: recuperación de las páginas completas del artefacto, proyectando la descripción anterior a los ejemplos; consulta adicional de `/docs/data/apis/rpc/api-reference/methods/getLedgers` y `/docs/data/apis/rpc/api-reference/methods/getNetwork`. Observado **17:47:13.813Z**. Se confirmó que RPC admite transacciones clásicas y que `PENDING` no significa éxito. La salida volvió a incluir un ejemplo extenso de `getLedgers`; se limitó la siguiente lectura. `getLedgers` se investigó, pero no se utiliza en el adaptador final.
6. `execute`: página `/docs/data/apis/rpc/api-reference/methods/getLatestLedger` y recuperación de la sección `getNetwork` del artefacto `cf8399cf-0824-4eee-a33b-f7bb853c7772`. Observado **17:47:27.672Z**. Confirmó `headerXdr`, hora de cierre y passphrase del nodo.
7. `execute`: `search_protocol_concepts_docs`, consulta `minimum balance numSponsoring numSponsored selling liabilities`, 2 hits con contenido. Observado **18:09:30.945Z**. La sección de saldo mínimo de Lumens distingue reserva mínima de saldo gastable y resta `liabilities.selling`; remite a la guía de reservas patrocinadas.
8. `execute`: páginas completas `/docs/build/guides/transactions/sponsored-reserves` y `/docs/learn/fundamentals/lumens`, con proyección de los párrafos sobre reservas y patrocinio. Se contrastó el cálculo sin copiar ejemplos de construcción o envío ajenos a este flujo.

Estas consultas son **2 llamadas search y 6 execute**; las marcas `observed` reflejan la observación de Raven, no fechas de publicación. Ninguna llamada Raven firmó ni envió una transacción.

## Fuentes y compatibilidad

- [RPC sendTransaction](https://developers.stellar.org/docs/data/apis/rpc/api-reference/methods/sendTransaction): admite pagos clásicos; `PENDING`, `DUPLICATE`, `TRY_AGAIN_LATER` y `ERROR` no equivalen a confirmación.
- [RPC getTransaction](https://developers.stellar.org/docs/data/apis/rpc/api-reference/methods/getTransaction): estados `SUCCESS`, `FAILED`, `NOT_FOUND`, envelope y resultado XDR, ledger y tiempo. El historial es acotado; ausencia fuera de la ventana no prueba que nunca se haya aplicado.
- [getLatestLedger](https://developers.stellar.org/docs/data/apis/rpc/api-reference/methods/getLatestLedger), [getNetwork](https://developers.stellar.org/docs/data/apis/rpc/api-reference/methods/getNetwork): parámetros efectivos del nodo y de la cabecera del ledger.
- [Lumens y saldo mínimo](https://developers.stellar.org/docs/learn/fundamentals/lumens#minimum-balance), [Reservas patrocinadas](https://developers.stellar.org/docs/build/guides/transactions/sponsored-reserves): reservas, subentradas, patrocinio y obligaciones de venta.
- [Guía Varial](https://developers.stellar.org/docs/build/guides/freighter/prompt-to-sign-tx), contrastada con los tipos y código **instalados** de `@stellar/varial-sdk 7.0.0`, `src/signTransaction.ts`: devuelve `{ signedTxXdr, signerAddress, error? }`; recibe `{ address, networkPassphrase }`.
- `@stellar/stellar-sdk 17.4.0`: `TransactionBuilder`, `Account`, `Operation.payment`, `Asset.native`, `Memo.hash`; `rpc.Server.getLatestLedger`, `getNetwork`, `getLedgerEntries`, `sendTransaction`, `getTransaction`. Se comprobaron los tipos XDR actuales: propiedades discriminadas `txSuccess`, `opInner`, `payment`, `paymentSuccess`, `account.ext`, `seqNum`, `liabilities` y patrocinios. Las firmas se verifican sobre `transaction.hash()`; **no usan SEP-53**.
- Diferencia detectada entre tipos y datos: el RPC devuelve `createdAt` y `latestLedgerCloseTime` como strings decimales, y el parser de SDK 17.4.0 puede conservarlos pese a declararlos como `number`. El adaptador los normaliza explícitamente con validación de enteros seguros no negativos. Esto se comprobó en la respuesta real `NOT_FOUND`, el código instalado `rpc/parsers.js` y el recorrido automatizado con el SDK real.
- Fuera de Raven: [PaymentOpFrame de Stellar Core](https://github.com/stellar/stellar-core/blob/master/src/transactions/PaymentOpFrame.cpp) confirma que un autopago XLM es una operación válida: conserva el importe y consume la comisión/secuencia de la transacción. Esto no es una transferencia neta a terceros.
- Fuera de Raven: el enlace a Stellar Expert con una transacción pública existente respondió HTTP 200. La apertura inicial del índice sin barra final desde la herramienta web devolvió 404; se contrastó el enlace concreto usado por la aplicación mediante HTTP.

## Decisiones

- Pago exclusivamente a la cuenta conectada, 0,1 XLM. Una operación, firma clásica, Testnet y límites de tiempo finitos. Sin destinos externos, contratos, claves en la app ni financiación automática. Checkbox de revisión ligado al hash preparado y popup real de Varial.
- Saldo disponible en stroops con `bigint`: balance menos reserva ajustada por subentradas/patrocinios y obligaciones de venta. Se exige conservadoramente margen para importe + comisión aunque el autopago no reduzca el importe neto. Reserva y base fee proceden de la cabecera real, no de constantes de Mainnet.
- Comisión ofrecida: al menos 1000 stroops o diez veces base fee, con límite de 10000 stroops. El usuario ve el máximo; el recibo muestra la comisión cobrada del resultado XDR. El límite no se eleva silenciosamente si la red está congestionada.
- Memo hash aleatorio de 32 bytes y secuencia actual, con ventana de 5 minutos basada en la hora del ledger. El cuerpo firmado debe ser idéntico al revisado: origen, destino, importe, activo nativo, fee, memo, límites y hash. Se exige firma válida de la clave conectada antes de entregar el envelope al RPC.
- Solo `getTransaction: SUCCESS`, con hash/envelope/resultado coincidentes, firma válida, operación payment exitosa, ledger y tiempo válidos, crea `VerifiedPayment`. No se usa una respuesta de envío como prueba de éxito.
- Envíos inciertos conservan un seguimiento **público** en `sessionStorage`: hash y cuerpo sin firmas. Nunca se persiste el XDR firmado ni secretos ni un booleano de misión completada. Recargar exige revalidar Identidad y Firma, y después consultar el hash anterior. No se construye otro intento mientras ese envío siga incierto.
- El sondeo es finito (15 consultas separadas por 2 s); después se puede consultar de nuevo sin reenviar. Solo un fallo definitivo o ausencia cuando el RPC ya haya ingerido ledgers posteriores al vencimiento permite liberar el intento. Fuera de la ventana histórica se conserva como incierto y se ofrece el explorador. Rechazos previos al envío permiten preparar otro intento.
- Cancelar antes de la entrega al RPC invalida respuestas tardías. Tras entregar al RPC no puede deshacerse una operación; desconectar retira progreso/recibo locales, pero conserva el seguimiento público necesario para evitar duplicados. Cambios de cuenta/red/permisos invalidan los tres sellos.
- `VerifiedPayment` declara expresamente `verification: rpc-browser`. Se retiró el nombre antiguo `TrustedVaultCompletion`, que sugería una autoridad de servidor inexistente. La confirmación se contrasta con el RPC oficial desde el navegador, sin autenticación de servidor ni prueba Merkle independiente. El logro educativo/PNG no es un token, un NFT ni un activo con valor; para premios persistentes o de valor se necesita verificación confiable en servidor.
- La apertura 3D solo se habilita con el recibo verificado, al regresar a la bóveda. La secuencia se pausa fuera de pantalla; movimiento reducido la resuelve directamente. Revocar la sesión retira el artefacto y restablece la puerta. Apariencia y tarjeta se derivan determinísticamente del hash verificado; no hay un hash de muestra en el producto.

## Contraste real de solo lectura

Se consultaron los endpoints oficiales `getNetwork`, `getLatestLedger`, `getTransaction` y una cuenta pública obtenida de Horizon. El nodo devolvió la passphrase Testnet, cabecera XDR, base reserve de **5000000** stroops y base fee de **100** stroops en esa observación. El adaptador real decodificó secuencia, saldo, obligaciones y patrocinios sin errores. La consulta de hash cero devolvió `NOT_FOUND` con `txHash`, tiempos y ventana histórica; se utilizó únicamente para comprobar la forma de la respuesta, no como transacción.

Las pruebas automatizadas de envío/finalidad emplean fixtures aislados y firmas efímeras, nunca datos de éxito en la aplicación. No se afirma haber autorizado una transacción real con Varial desde el navegador de automatización. La prueba manual con la extensión real y el autopago aprobado sigue siendo necesaria.

## Resultado de validación

- **85 pruebas aprobadas** con comprobación TypeScript de fuentes y pruebas; regresiones de Misión 1/2 y cobertura de construcción, políticas, reservas, firmas de red incorrecta, cuerpos alterados, estados no definitivos, incertidumbre, recarga, cancelación y timestamps RPC.
- `npm run build` correcto; conserva el aviso de módulos mayores de 500 kB. `npm run lint` termina sin errores ni advertencias. No se desactivaron reglas de lint.
- Chromium con el SDK real, doble aislado del puente de extensión y respuestas RPC interceptadas: revisión explícita, firma criptográfica de la transacción, `PENDING` sin desbloqueo, `SUCCESS` validado con 3/3, puerta/artefacto, tarjeta PNG, móvil, movimiento reducido, pérdida de WebGL y revocación de sesión. Recargar un envío pendiente recupera el hash sin otra firma/envío. Estas respuestas son fixtures; no se confunden con una confirmación on-chain real.
- El adaptador real consultó además una transacción pública ya existente: `SUCCESS`, ledger `5765975`, envelope/resultado presentes, fechas convertidas a números seguros. Esa lectura no completó misiones ni demuestra un pago nuevo del usuario. No se registró ese hash como logro de la app.
- Se afinó únicamente la cámara de revelación para mantener el artefacto en el lado visual del encuadre, conservar la legibilidad y poder regresar normalmente a las misiones. La escena y las transiciones previas se mantienen.
