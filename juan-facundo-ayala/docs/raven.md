# Cómo usé Stellar Raven en Mate Stellar

[Stellar Raven](https://raven.stellar.org/) es el servidor MCP de Stellar: se
agrega como servidor MCP en el editor o cliente que uses y desde ahí consulta
la documentación oficial, las guías de desarrollo ("skills") y el ecosistema.
Tiene dos herramientas: `search`, que encuentra qué operación o guía sirve
para una pregunta, y `execute`, que corre esas operaciones y devuelve el
resultado con su fuente.

Este registro corresponde a las consultas que ejecuté el **18/11/2026** para
revisar el código tal como está hoy. Cada tema dice qué pregunté, qué devolvió
Raven y qué decisión del código depende de eso. Donde Raven no devolvió lo que
buscaba, lo digo.

Las referencias al código van por archivo y nombre de función o constante, no
por número de línea, para que no queden viejas cuando el archivo cambia.

Operaciones usadas: la skill `skills.stellar-dev.dapp` (leída con
`codemode.skill.read`) y, de la documentación oficial,
`stellarDocs.search_docs`, `stellarDocs.search_protocol_concepts_docs`,
`stellarDocs.search_rpc_horizon_data_docs`,
`stellarDocs.search_wallet_dapp_docs` y `stellarDocs.get_doc_page`.

Los temas de la **a** a la **j** cubren la primera versión de la app (conectar
wallet, saldo, pago en XLM, historial). Los de la **k** a la **o** son las
consultas que hice para lo que agregué después: elegir las wallets, USDC,
trustlines, conversión en el camino y el aporte en la misma transacción.

## a. Conectar wallets con Stellar Wallets Kit

- **Consulta:** `search` con "connect wallet frontend Stellar Wallets Kit dapp"
  (tipo skill) y después la sección `wallet-integration` de
  `skills.stellar-dev.dapp`. También `stellarDocs.search_wallet_dapp_docs` con
  "Stellar Wallets Kit connect wallet".
- **Qué devolvió:** la skill
  [dapp](https://raw.githubusercontent.com/stellar/stellar-dev-skill/421ca30a671cd32d7d6466e8b903f10d79dc1590/skills/dapp/SKILL.md)
  trae el patrón de la v2: el kit es un singleton estático que se inicializa
  una vez con `StellarWalletsKit.init({ modules: defaultModules(), network })`
  y después se usa con `authModal()`, `disconnect()` y `signTransaction()`.
  Aclara que `defaultModules()` carga todas las wallets que no necesitan
  configuración extra y que los módulos con requisitos previos (WalletConnect,
  Ledger, Trezor) se importan y agregan a mano. Nombra a la wallet principal
  como Varial. La búsqueda en la documentación oficial no devolvió nada sobre
  cómo usar Wallets Kit (solo páginas del Wallet SDK), así que el patrón se
  apoya únicamente en la skill.
- **Qué decisión tomé:** en `src/lib/wallet.ts`, la llamada a
  `StellarWalletsKit.init` y las funciones `connectWallet`, `disconnectWallet`
  y `signWithWallet`. **Coincide** en el patrón (singleton, `authModal`,
  `disconnect`, `signTransaction`). **Difiere** en dos cosas. Primero, no uso
  `defaultModules()`: paso una lista de seis módulos elegidos a mano (el motivo
  está en el tema k). Segundo, el paquete: la skill importa la v2 como
  `@creit-tech/stellar-wallets-kit`, que es el nombre en JSR; yo lo instalé
  desde npm como `@creit.tech/stellar-wallets-kit` (imports de
  `src/lib/wallet.ts` y dependencias de `package.json`).

## b. Armar y enviar un pago

- **Consulta:** secciones `transaction-building` y `transaction-submission` de
  `skills.stellar-dev.dapp`.
- **Qué devolvió:** la misma
  [skill dapp](https://raw.githubusercontent.com/stellar/stellar-dev-skill/421ca30a671cd32d7d6466e8b903f10d79dc1590/skills/dapp/SKILL.md):
  cargar la cuenta de origen con Horizon, `TransactionBuilder` con
  `fee: BASE_FEE` y la passphrase de la red, `Operation.payment`,
  `setTimeout(180)` y `toXDR()`. Para enviar: `TransactionBuilder.fromXDR` y
  `horizon.submitTransaction`.
- **Qué decisión tomé:** `buildMateTx` y `submitMateTx` en `src/lib/mate.ts`.
  **Coincide.** El ejemplo de Raven no cubre qué hacer si se corta la conexión
  al enviar; la búsqueda de la transacción por hash que hace `submitMateTx`
  antes de invitar a reintentar es un agregado mío, igual que el aviso cuando
  el destino exige memo (`AccountRequiresMemoError`).

## c. Crear la cuenta o pagar, y el mínimo de 1 XLM

- **Consulta:** `stellarDocs.search_docs` con "send payment to account that
  does not exist create_account" y
  `stellarDocs.search_protocol_concepts_docs` con "create account operation
  destination does not exist payment fails minimum balance 1 XLM".
- **Qué devolvió:**
  [Create an Account](https://developers.stellar.org/docs/build/guides/transactions/create-account):
  una cuenta existe recién cuando tiene dos reservas base, hoy 1 XLM. El
  [tutorial de la app de ejemplo](https://developers.stellar.org/docs/build/apps/example-application-tutorial/payment)
  hace lo mismo que mi app: si el destino no está fondeado usa `createAccount`
  y avisa que hay que enviar al menos 1 XLM. La
  [lista de operaciones](https://developers.stellar.org/docs/learn/fundamentals/transactions/list-of-operations#payment)
  confirma que un pago a una cuenta inexistente falla con
  `PAYMENT_NO_DESTINATION`.
- **Qué decisión tomé:** `chooseOperation` en `src/lib/mate.ts` elige
  `Operation.payment` o `Operation.createAccount` según exista o no el
  destino, y exige el mínimo `MIN_NEW_ACCOUNT_XLM`. **Coincide.**

## d. Saldo mínimo y reservas

- **Consulta:** `stellarDocs.search_protocol_concepts_docs` con "minimum
  balance base reserve 0.5 XLM subentries" y con "sponsored reserves minimum
  balance formula num_sponsoring num_sponsored selling liabilities"; después
  la página entera con `stellarDocs.get_doc_page`.
- **Qué devolvió:**
  [Lumens > Minimum balance](https://developers.stellar.org/docs/learn/fundamentals/lumens#minimum-balance):
  dos reservas base (1 XLM) más una (0,5 XLM) por subentrada, y el saldo
  disponible es saldo menos mínimo menos `liabilities.selling`. Sobre el
  patrocinio dice que otra cuenta puede cubrir las reservas, pero no da la
  fórmula con `num_sponsoring` y `num_sponsored`.
- **Qué decisión tomé:** `BASE_RESERVE_XLM`, `reservedXlm` y `getAccountInfo`
  en `src/lib/account.ts`. **Coincide** en las dos reservas, el 0,5 por
  subentrada y las ofertas abiertas. El ajuste `+ sponsoring - sponsored` de
  `reservedXlm` no quedó respaldado por lo que devolvió Raven.

## e. Friendbot en Testnet

- **Consulta:** `stellarDocs.search_docs` con "Friendbot testnet fund account
  10,000 XLM", "Friendbot rate limit" y "friendbot.stellar.org addr fetch".
- **Qué devolvió:**
  [Networks > Friendbot](https://developers.stellar.org/docs/networks#friendbot):
  entrega 10.000 XLM de prueba al fondear una cuenta nueva y limita la cantidad
  de pedidos. La tabla de redes de esa página da la URL
  `https://friendbot.stellar.org`.
- **Qué decisión tomé:** `fundWithFriendbot` en `src/lib/account.ts` y
  `FRIENDBOT_URL` en `src/lib/config.ts`. **Coincide.** Lo que Raven no
  devolvió: ni el parámetro `?addr=` ni que el límite responda con un 429. La
  búsqueda del límite trajo páginas de Horizon, no de Friendbot. Esas dos
  cosas no salen de Raven.

## f. Memo de texto

- **Consulta:** `stellarDocs.search_protocol_concepts_docs` con "memo text 28
  bytes".
- **Qué devolvió:**
  [Operations and Transactions > Memo](https://developers.stellar.org/docs/learn/fundamentals/transactions/operations-and-transactions#memo):
  `MEMO_TEXT` es un texto en ASCII o UTF-8 de hasta 28 bytes.
- **Qué decisión tomé:** `MEMO_MAX_BYTES` y `memoBytes` en `src/lib/mate.ts`
  (cuenta bytes en UTF-8, no caracteres), y el descarte de mensajes largos en
  `parseMateLink` de `src/lib/link.ts`. **Coincide.**

## g. Códigos de error

- **Consulta:** `stellarDocs.search_rpc_horizon_data_docs` con "result codes
  op_underfunded op_no_destination op_low_reserve", `stellarDocs.search_docs`
  con "transaction result codes tx_bad_seq tx_too_late
  tx_insufficient_balance" y con "op_underfunded"; después las páginas de
  códigos con `stellarDocs.get_doc_page`.
- **Qué devolvió:**
  [Transaction Result Codes](https://developers.stellar.org/docs/data/apis/horizon/api-reference/errors/result-codes/transactions)
  trae literales `tx_bad_seq`, `tx_too_late`, `tx_bad_auth` y
  `tx_insufficient_balance`, con el mismo sentido que les doy.
  [Transaction Failed](https://developers.stellar.org/docs/data/apis/horizon/api-reference/errors/http-status-codes/horizon-specific/transaction-failed)
  agrega que `tx_bad_seq` es el único caso que puede volverse válido más
  adelante. Para los de operación, las páginas de
  [Payment](https://developers.stellar.org/docs/data/apis/horizon/api-reference/errors/result-codes/operation-specific/payment)
  y
  [Create Account](https://developers.stellar.org/docs/data/apis/horizon/api-reference/errors/result-codes/operation-specific/create-account)
  los nombran `OpUnderfunded`, `OpNoDestination`, `OpLowReserve` y
  `OpAlreadyExists`. Los textos `op_underfunded` y `op_no_destination`
  aparecieron tal cual solo en la
  [guía de problemas de la Disbursement Platform](https://developers.stellar.org/docs/platforms/stellar-disbursement-platform/admin-guide/troubleshooting#common-operation-codes).
- **Qué decisión tomé:** la tabla `RESULT_CODE_MESSAGES` y la función
  `horizonErrorMessage` en `src/lib/mate.ts`. **Coincide** para los cuatro
  `tx_*`, `op_underfunded` y `op_no_destination`. Para `op_low_reserve` y
  `op_already_exists` Raven confirmó el significado pero no esa escritura
  exacta. La tabla hoy tiene además cinco claves para activos y conversiones
  (`op_no_trust`, `op_not_authorized`, `op_line_full`, `op_too_few_offers`,
  `op_over_source_max`); las revisé en los temas m y n.

## h. Pagos de una cuenta en Horizon

- **Consulta:** `stellarDocs.search_rpc_horizon_data_docs` con "retrieve an
  account's payments join transactions" y la página con
  `stellarDocs.get_doc_page`.
- **Qué devolvió:**
  [Retrieve an Account's Payments](https://developers.stellar.org/docs/data/apis/horizon/api-reference/get-payments-by-account-id):
  `GET /accounts/{account_id}/payments`, con `order` (por defecto `asc`),
  `limit` (de 1 a 200, por defecto 10) y `join=transactions` para incluir la
  transacción de cada operación. Solo devuelve pagos exitosos, salvo que se
  pida `include_failed`. La página no enumera qué tipos de operación entran en
  la lista.
- **Qué decisión tomé:** `getRecentMates` en `src/lib/history.ts` pide
  `order=desc`, `limit` igual a `FETCH_LIMIT` (30) y `join=transactions`, y
  `toRecord` lee el memo desde la transacción incluida. **Coincide** en el
  endpoint y sus parámetros. Que ahí también lleguen las conversiones
  (`path_payment_strict_receive`, `path_payment_strict_send`) y las
  activaciones (`create_account`), que `toRecord` reconoce con `PAYMENT_TYPES`,
  no salió de esa página de Raven: lo comprobé con las transacciones de prueba
  en Testnet.

## i. Comisión mínima

- **Consulta:** `stellarDocs.search_protocol_concepts_docs` con "base fee 100
  stroops minimum fee per operation".
- **Qué devolvió:**
  [Fees > Inclusion fee](https://developers.stellar.org/docs/learn/fundamentals/fees-resource-limits-metering#inclusion-fee)
  y el
  [glosario](https://developers.stellar.org/docs/learn/glossary#base-fee): el
  mínimo de la red es 100 stroops por operación, y lo que se pone en la
  transacción es el máximo que uno acepta pagar. Con la red congestionada la
  comisión efectiva sube por subasta.
- **Qué decisión tomé:** `fee: BASE_FEE` en `buildMateTx` y `buildTrustTx`
  (`src/lib/mate.ts`) y el margen `FEE_MARGIN_XLM` de 0,001 XLM en
  `src/lib/account.ts`, que cubre de sobra los 100 stroops por operación.
  **Coincide.** Como ofrezco justo el mínimo, con la red congestionada un
  envío podría no entrar.

## j. Direcciones muxed (M...)

- **Consulta:** `stellarDocs.search_docs` con "muxed account M address payment
  destination" y con "pooled accounts muxed accounts memos wallet support";
  después la página con `stellarDocs.get_doc_page`.
- **Qué devolvió:**
  [Pooled accounts: muxed accounts and memos](https://developers.stellar.org/docs/build/guides/transactions/pooled-accounts-muxed-accounts-memos):
  una dirección M puede ser destino de un `Payment` (no figura como destino de
  crear cuenta), enviar a direcciones muxed es seguro para cualquier wallet, y
  todavía no todas las wallets y exchanges las soportan para recibir.
- **Qué decisión tomé:** `isValidAddress` en `src/lib/mate.ts` usa
  `StrKey.isValidEd25519PublicKey`, así que la app acepta solo direcciones G,
  tanto en el formulario como en los links (`parseMateLink` en
  `src/lib/link.ts`). **Difiere:** según la guía podría aceptar M en un pago.
  Por ahora queda anotado como límite conocido de la app.

## k. Qué wallets lista la documentación oficial para Wallets Kit

- **Consulta:** `stellarDocs.get_doc_page` con path
  `/docs/tools/developer-tools/wallets`.
- **Qué devolvió:** la página
  [Wallet Integration](https://developers.stellar.org/docs/tools/developer-tools/wallets).
  Bajo "The Stellar Wallets Kit supports many wallets including" lista once:
  Albedo, Varial, Hana, Ledger Hardware Wallet, Trezor Hardware Wallet, Lobstr,
  Rabet, Scopuly, WalletConnect, xBull y HOT Wallet. En la misma página
  describe a Varial como la wallet de SDF, con el código en el repositorio
  `stellar/freighter`.
- **Qué decisión tomé:** la lista `modules` de `StellarWalletsKit.init` en
  `src/lib/wallet.ts` tiene seis: Varial, xBull, Albedo, Lobstr, Hana y Rabet.
  **Coincide en parte:** los seis están en la lista oficial. **Difiere** en
  que la lista oficial tiene once y yo dejé cinco afuera. Para tres hay
  respaldo de Raven: la skill del tema a dice que WalletConnect, Ledger y
  Trezor tienen requisitos previos y no entran solos. Para Scopuly y HOT Wallet
  no tengo respaldo: figuran en la lista oficial y Raven no dice que necesiten
  configuración extra. Dejarlas afuera fue una decisión mía para mantener corto
  el selector, no algo que surja de la documentación.

## l. El emisor de USDC en Testnet y por qué importa el emisor

- **Consulta:** `stellarDocs.get_doc_page` con path
  `/docs/build/agentic-payments/x402` (sección "Testnet USDC"),
  `stellarDocs.search_docs` con "USDC testnet issuer Circle" más la dirección
  del emisor, y `stellarDocs.search_protocol_concepts_docs` con "asset
  identified by asset code and issuer"; después la página de activos con
  `stellarDocs.get_doc_page`.
- **Qué devolvió:**
  [x402 on Stellar > Testnet USDC](https://developers.stellar.org/docs/build/agentic-payments/x402#testnet-usdc)
  da una tabla con Asset Code `USDC` e Issuer
  `GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5`. Esa tabla no
  nombra a Circle; quien lo hace es la página
  [Assets and Wallet Clients](https://developers.stellar.org/docs/platforms/anchor-platform/admin-guide/assets-and-client-wallets)
  de Anchor Platform, que usa esa misma dirección como ejemplo del USDC de
  Circle en Testnet. La página
  [Assets](https://developers.stellar.org/docs/learn/fundamentals/stellar-data-structures/assets#assets)
  explica que los códigos se repiten, porque más de una organización puede
  emitir algo con el mismo código, y que un activo se identifica de forma
  única por la combinación de código y emisor.
- **Qué decisión tomé:** la lista `ASSETS` en `src/lib/assets.ts` tiene ese
  emisor para USDC, y `matchAsset` reconoce un activo de Horizon solo si
  coinciden código y emisor. Con eso, un "USDC" emitido por otra cuenta no
  aparece en el saldo (`getAccountInfo`), ni en el historial (`toRecord`), ni
  cuenta como trustline válida del destino (`balanceOf`). **Coincide.** Una
  aclaración: la página de x402 habla de USDC como token de contrato y da
  también la dirección del contrato; mi app usa el activo clásico con ese
  emisor, a través de `toSdkAsset`, y no llama a ningún contrato.

## m. Trustlines: habilitar un activo antes de recibirlo

- **Consulta:** `stellarDocs.search_protocol_concepts_docs` con "trustline
  change_trust required before receiving asset subentry base reserve" y
  `stellarDocs.search_rpc_horizon_data_docs` con "op_no_trust destination
  missing trustline payment result codes"; después las páginas de cuentas,
  lista de operaciones, lumens y códigos de resultado con
  `stellarDocs.get_doc_page`.
- **Qué devolvió:**
  [Accounts > Trustlines](https://developers.stellar.org/docs/learn/fundamentals/stellar-data-structures/accounts#trustlines):
  una trustline es la aceptación explícita de una cuenta para tener un activo,
  se crea con la operación `change_trust`, y hace falta para recibir cualquier
  activo que no sea XLM. La misma página menciona que existe otra vía, los
  saldos reclamables, para enviar a una cuenta sin trustline.
  [Lumens > Minimum balance](https://developers.stellar.org/docs/learn/fundamentals/lumens#minimum-balance)
  cuenta a las trustlines entre las subentradas: cada una suma una reserva
  base, hoy 0,5 XLM. En la
  [lista de operaciones](https://developers.stellar.org/docs/learn/fundamentals/transactions/list-of-operations#change-trust),
  `change_trust` puede fallar con `CHANGE_TRUST_LOW_RESERVE` si no alcanzan
  los XLM para esa reserva extra. La página de
  [códigos de Payment](https://developers.stellar.org/docs/data/apis/horizon/api-reference/errors/result-codes/operation-specific/payment)
  nombra `OpNoTrust` (el destino no tiene trustline para el activo),
  `OpNotAuthorized` y `OpLineFull`. La escritura `op_no_trust` no apareció en
  ninguna de las páginas que leí.
- **Qué decisión tomé:** `buildTrustTx` en `src/lib/mate.ts` arma el
  `Operation.changeTrust` del botón "Aceptar USDC" (función `enable` de
  `src/hooks/useAccount.ts`), y `AccountBalance.tsx` avisa que cada activo
  aceptado suma `BASE_RESERVE_XLM` a la reserva. Antes de firmar un envío,
  `chooseOperation` revisa con `balanceOf` si el destino tiene la trustline y,
  si no, corta con un mensaje claro. Si igual llegara un rechazo de la red, la
  tabla `RESULT_CODE_MESSAGES` lo traduce. **Coincide** en el concepto, en la
  operación y en la reserva. Para las claves `op_no_trust`,
  `op_not_authorized` y `op_line_full` vale lo mismo que en el tema g: Raven
  confirmó el significado, no esa escritura. No uso saldos reclamables: cuando
  el destino no habilitó el activo, la app avisa y no envía.

## n. Path payments: pagar con XLM y que llegue USDC

- **Consulta:** `stellarDocs.search_protocol_concepts_docs` con
  "path_payment_strict_receive send_max" y
  `stellarDocs.search_rpc_horizon_data_docs` con "list strict receive payment
  paths"; después la lista de operaciones, la guía de path payments, la página
  del endpoint y la de códigos de resultado con `stellarDocs.get_doc_page`.
- **Qué devolvió:** la
  [lista de operaciones](https://developers.stellar.org/docs/learn/fundamentals/transactions/list-of-operations#path-payment-strict-receive)
  define `Path payment strict receive` como un pago donde el activo recibido
  puede ser distinto del enviado y se fija el monto que llega. Sus parámetros
  son Send asset, Send max (el máximo a descontar, sin contar comisiones),
  Destination, Destination asset, Destination amount y Path (los activos
  intermedios, sin incluir el de origen ni el de destino). La
  [guía de path payments](https://developers.stellar.org/docs/build/guides/transactions/path-payments)
  aclara que la conversión pasa por el exchange de la red o por pools de
  liquidez y que puede fallar si no hay un camino viable. El endpoint es
  [List Strict Receive Payment Paths](https://developers.stellar.org/docs/data/apis/horizon/api-reference/list-strict-receive-payment-paths):
  `GET /paths/strict-receive`, que exige exactamente uno de `source_account` o
  `source_assets`, más el activo y el monto de destino, y devuelve solo los
  caminos que alcanzan ese monto. La página de
  [códigos](https://developers.stellar.org/docs/data/apis/horizon/api-reference/errors/result-codes/operation-specific/path-payment-strict-receive)
  nombra `OpTooFewOffers` (no hay camino de ofertas; la red solo considera
  caminos de hasta 5 saltos) y `OpOverSourceMax` (el camino costaría más que
  `send max`).
- **Qué decisión tomé:** en `src/lib/mate.ts`, `quoteInXlm` consulta
  `horizon.strictReceivePaths` con XLM como único activo de origen y se queda
  con el camino más barato; `chooseOperation` arma
  `Operation.pathPaymentStrictReceive` con ese `path`, el monto exacto que
  tiene que llegar y un `sendMax` igual a la cotización más el margen
  `SLIPPAGE` (1 %), calculado en `maxCost`. Si no hay camino, corta antes de
  firmar. **Coincide** con la operación, sus parámetros y el endpoint. Las
  claves `op_too_few_offers` y `op_over_source_max` de `RESULT_CODE_MESSAGES`
  se corresponden con los nombres `OpTooFewOffers` y `OpOverSourceMax`; otra
  vez, sin la escritura literal. El 1 % de margen es un criterio mío: Raven
  explica qué es `send max`, no cuánto margen conviene. La página del endpoint
  da el formato `CODE:ISSUER_ACCOUNT` para `source_assets` y no muestra cómo
  se escribe XLM ahí; de eso se encarga el SDK.

## o. Varias operaciones en una transacción

- **Consulta:** `stellarDocs.search_protocol_concepts_docs` con "multiple
  operations in one transaction atomic fee per operation"; después las páginas
  de operaciones y transacciones y la de comisiones con
  `stellarDocs.get_doc_page`.
- **Qué devolvió:**
  [Operations and Transactions](https://developers.stellar.org/docs/learn/fundamentals/transactions/operations-and-transactions):
  una transacción agrupa entre 1 y 100 operaciones y es atómica: si una
  operación falla, fallan todas y la transacción no se aplica.
  [Fees > Inclusion fee](https://developers.stellar.org/docs/learn/fundamentals/fees-resource-limits-metering#inclusion-fee):
  la comisión de inclusión es la cantidad de operaciones multiplicada por la
  comisión base efectiva, que no baja de 100 stroops por operación; la
  comisión base que uno fija es el máximo que acepta pagar por operación.
- **Qué decisión tomé:** en `buildMateTx` (`src/lib/mate.ts`), cuando el
  aporte yerbatero está activado se agrega una segunda operación a la misma
  transacción, calculada con `yerbaShare` (5 %, `YERBA_SHARE`) y dirigida a
  `YERBA_FUND`. Por la atomicidad, o salen el mate y el aporte, o no sale
  ninguno. La comisión sigue siendo `fee: BASE_FEE`, que se cobra por
  operación: con aporte son dos. **Coincide.** `FEE_MARGIN_XLM` (0,001 XLM, es
  decir 10.000 stroops) cubre de sobra esas dos operaciones. Una aclaración
  que no tiene que ver con Raven pero sí con la honestidad del registro:
  `YERBA_FUND` es una cuenta de prueba en Testnet. El aporte es una
  demostración de cómo viajan dos pagos juntos; no hay una cooperativa real
  que lo reciba.

## Lo que Raven me corrigió o aclaró

- **El paquete de Wallets Kit.** La skill importa la v2 con el nombre de JSR
  (`@creit-tech/...`); yo uso el de npm (`@creit.tech/...`). La app funciona
  así, pero queda anotado como diferencia.
- **La lista de wallets es más larga que la mía.** La documentación oficial
  lista once wallets para Wallets Kit y la app ofrece seis. WalletConnect,
  Ledger y Trezor quedan afuera con motivo (la skill dice que necesitan
  configuración previa). Scopuly y HOT Wallet quedaron afuera por decisión
  mía, sin un motivo que salga de Raven.
- **La tabla de USDC no nombra a Circle.** La página de x402 da el código y el
  emisor; que ese emisor es el de Circle lo dice otra página oficial, la de
  Anchor Platform. Las dos coinciden en la dirección.
- **Código y emisor, siempre juntos.** La página de activos lo dice sin
  vueltas: los códigos se repiten y lo único que identifica a un activo es la
  combinación. Por eso `matchAsset` compara las dos cosas.
- **Una trustline cuesta reserva.** Cada activo aceptado es una subentrada y
  suma 0,5 XLM al mínimo de la cuenta; `change_trust` puede fallar por eso
  mismo. La app lo avisa junto al botón de aceptar.
- **Hay otra forma de enviar a quien no tiene trustline.** La documentación
  menciona los saldos reclamables. No los uso: la app avisa y frena el envío.
- **`send max` no incluye la comisión.** Es solo el tope de lo que se
  descuenta del activo de origen; la comisión va aparte.
- **Los caminos tienen un largo máximo.** La red solo considera caminos de
  hasta 5 saltos; si no hay ninguno, el rechazo es `OpTooFewOffers`.
- **La comisión se multiplica por la cantidad de operaciones.** Un mate con
  aporte paga dos veces la comisión base. Sigue siendo un tope, no un precio
  fijo: con `BASE_FEE` ofrezco el mínimo de la red.
- **Nombres de los códigos de operación.** En la referencia de Horizon
  figuran como `OpLowReserve`, `OpNoTrust` u `OpOverSourceMax`; la forma en
  minúsculas con guiones bajos que uso como clave (`op_low_reserve`,
  `op_no_trust`, `op_over_source_max`) no apareció escrita así en esas
  páginas. Solo `op_underfunded` y `op_no_destination` aparecieron literales,
  en otra guía.
- **Direcciones M.** La guía dice que enviar a una dirección muxed es seguro;
  mi validación las rechaza. No es un error de fondos, pero sí un límite de la
  app.
- **`tx_bad_seq` es un caso aparte.** Es el único rechazo que puede volverse
  válido después, y por eso mi mensaje invita a probar de nuevo.
- **La reserva base puede cambiar.** La guía de crear cuentas aclara que los
  validadores pueden modificarla; en el código está fija en 0,5 XLM
  (`BASE_RESERVE_XLM` en `src/lib/account.ts`).
- **Lo que no salió de Raven.** El parámetro `?addr=` de Friendbot, su
  respuesta 429, la fórmula de reservas patrocinadas, qué tipos de operación
  devuelve el endpoint de pagos, cuánto margen conviene dejar en una
  conversión y cómo se escribe XLM en `source_assets` no aparecieron en las
  respuestas. Tampoco consulté a Raven por EURC: lo evalué aparte y lo
  descarté porque en Testnet no encontré liquidez contra XLM.
