# Stellar Heist — The Genesis Vault

Experiencia Web3 cinematográfica para Stellar Pura Vida Bootcamp. Tres sellos: conexión de wallet, prueba de control de una clave y una operación XLM confirmada en Testnet. La bóveda 3D solo se abre cuando las tres misiones se verifican.

## Ejecutar

Recomendado: **Node 24**, probado con 24.19.0. Usar un navegador compatible con la extensión oficial [Varial](https://varialwallet.com), antes Freighter.

```bash
npm ci
npm run dev
```

Abrir la URL de Vite en `localhost` o `127.0.0.1`. Producción requiere HTTPS; una URL LAN por HTTP no equivale a localhost.

```bash
npm test
npm run lint
npm run build
npm run preview
```

`npm test` comprueba los tipos de las pruebas y ejecuta el runner de Node sobre un bundle temporal generado por Vite. No añade dependencias de testing. La interfaz es responsive; no se implementa WalletConnect ni una conexión específica para apps móviles: la integración requiere un navegador que admita Varial.

## Recorrido real

### 1. Identidad

1. Desbloquear Varial y elegir **Testnet**. Passphrase exacta: `Test SDF Network ; September 2015`.
2. Entrar en **Identidad**, pulsar **Conectar wallet** y autorizar el sitio en la extensión.
3. Comprobar dirección, saldo y **1 de 3**. Se valida autorización vigente, dirección Ed25519 y passphrase; el nombre visible de la red no basta.
4. Se puede copiar la dirección, verla completa, actualizar saldo y desconectar localmente. El saldo es total, no saldo gastable tras reservas.

Una cuenta inactiva o sin fondos puede completar Identidad. Para el pago posterior debe estar activada y tener XLM de prueba. El enlace a [Stellar Lab](https://lab.stellar.org/account/fund) permite financiársela por decisión del usuario; la aplicación no llama a Friendbot automáticamente. Nunca introducir claves privadas ni frases de recuperación en esta aplicación.

### 2. Prueba criptográfica

1. Pulsar **Continuar al segundo sello** y **Firmar mensaje**.
2. Revisar el mensaje legible en Varial: propósito, origen exacto de la página, dirección, Testnet, nonce y fechas. No envía dinero ni necesita XLM.
3. Autorizar. Se verifica localmente la firma SEP-53, los bytes exactos del desafío, la cuenta, el origen, el vencimiento y que el nonce no haya sido consumido.
4. Solo entonces se muestra **Segundo sello abierto**, aparece el pulso/alineación 3D y el progreso llega a **2 de 3**.

Nonce de 256 bits generado con Web Crypto y vencimiento de 3 minutos. `signMessage` y `Keypair.verifyMessage` reciben el mensaje original; el SDK aplica el prefijo y SHA-256 de SEP-53 exactamente una vez. Se acepta firma base64 canónica o bytes de 64 posiciones; no se adivinan otros formatos.

**Cancelar firma** o salir de la misión invalida el intento local, pero no cierra el popup de Varial. Cerrar solicitudes antiguas en la extensión antes de reintentar. Las respuestas tardías se ignoran.

### 3. Operación de Testnet

El destino y el importe aprobados son **la misma cuenta conectada y 0,1 XLM**. No hay transferencias a terceros ni destinos configurables en este flujo.

1. Completar Identidad y Firma, entrar en **La prueba final** y pulsar **Revisar operación**.
2. Revisar importe, dirección de destino y comisión máxima. Marcar **He revisado el destino y la comisión**.
3. Pulsar **Autorizar en Varial** y confirmar en la extensión que son XLM de Testnet a la propia cuenta. La aplicación construye una única operación de pago con secuencia actual, memo hash aleatorio y límites de tiempo de 5 minutos.
4. El importe permanece en la cuenta; el coste neto es la comisión de prueba. Se comprueba conservadoramente margen para importe + fee por encima de reservas y obligaciones de venta. Reserva y base fee se leen de la cabecera del ledger.
5. La comisión ofrecida es al menos 1000 stroops o diez veces el base fee, con máximo de 10000 stroops. El resumen muestra el máximo; el recibo muestra la comisión realmente cobrada.
6. Se comprueban de nuevo cuenta/red y firma. El cuerpo firmado debe ser idéntico al revisado. Se envía al **RPC oficial de Testnet** y se consulta su hash.
7. `PENDING`, `DUPLICATE`, `TRY_AGAIN_LATER` o un mero envío no completan la misión. Solo `getTransaction: SUCCESS` con hash, envelope, firma, resultado payment exitoso, ledger y fecha coincidentes permite **3 de 3**.
8. Tras validar la firma, la cámara regresa automáticamente a la bóveda: núcleo y energía cian reaccionan al envío/espera reales. Solo el recibo verificado activa la oleada de luz, los cerrojos y, a continuación, la apertura física y el artefacto. Se muestran hash, ledger y enlace Testnet. En movimiento reducido se muestra el resultado sin la secuencia larga.
9. **Ver transacción** abre Stellar Expert en Testnet. **Descargar logro** exporta una tarjeta PNG con el hash y datos del recibo; se puede compartir manualmente. La apariencia del artefacto y de la tarjeta deriva del hash verificado.

El logro es educativo, sin valor monetario. No se crea un NFT ni se acuña un activo. La descarga no publica ni envía nada a terceros.

## Errores, cancelación y recuperación

- Varial ausente, bloqueada, permisos rechazados o revocados: aviso breve y reintento; no se solicita ningún secreto.
- Cambio de cuenta/red o pérdida de permisos: al detectarlo se invalidan los tres sellos, se retira el artefacto y se restablece la puerta. Se debe reconectar y volver a firmar.
- La wallet se comprueba cada segundo mientras la pestaña está visible, al recuperar foco/visibilidad y antes/después de acciones sensibles. El SDK usa sondeo; no hay garantía de detección instantánea.
- Lecturas con límite de 10 s; autorización/firma con límite de 120 s. Un desafío/operación vencidos no se aprueban.
- Una cuenta inactiva o sin saldo suficiente para el margen requerido muestra acceso a XLM de prueba. No se aumenta el límite de comisión automáticamente.
- Cancelar antes de entregar el envelope al RPC evita completar con una firma tardía. Tras entregarlo, desconectar o navegar **no deshace un envío en la red**.
- Un fallo de transporte tras entregar la operación se trata como **incierto**. Se guarda únicamente seguimiento público en `sessionStorage`: hash, cuerpo sin firmas, cuenta y límites. No se guardan firmas ni XDR firmado.
- **Consultar estado** consulta la misma operación. El sondeo es finito: 15 consultas separadas por 2 s; se puede consultar nuevamente. No reenvía ni genera otra operación por su cuenta.
- Tras recargar, completar de nuevo Identidad y Firma y pulsar **Revisar operación**. Si existe seguimiento pendiente, aparece **Consultar estado**, sin pedir otra firma ni construir otro hash.
- Solo un fallo definitivo o un `NOT_FOUND` cuando el nodo ya ingirió ledgers posteriores al vencimiento libera el intento. Fuera de la ventana histórica del RPC se conserva como incierto y se ofrece el explorador. No borrar el seguimiento para forzar un segundo pago mientras el primero siga incierto.
- El seguimiento pertenece a esta pestaña; no coordina dispositivos ni pestañas independientes. Una vez completado se elimina y el logro queda en la sesión actual. Descargar la tarjeta antes de cerrar si se quiere conservarla.

## Alcance de la verificación

La firma es una **prueba criptográfica local de control de una clave**. El pago se confirma consultando el RPC oficial mediante TLS y verificando el envelope y resultado recibidos. No se verifica el consenso de Stellar de forma independiente ni se emite una atestación de servidor.

`VerifiedPayment` declara `verification: rpc-browser`; el tipo TypeScript no sustituye la verificación. No existe un botón de prueba, parámetro de URL, booleano persistido ni hash de demostración que complete una misión. Las respuestas ficticias se limitan a los tests y nunca se importan desde `src/`.

No hay backend ni autenticación segura de servidor. El flujo está destinado a una cuenta de demostración con su clave maestra habilitada y peso suficiente; no agrega firmas de varias personas ni valida por sí solo todos los permisos multisig de una cuenta. Para premios persistentes o con valor, añadir un servicio confiable que verifique desafíos, autorización de cuenta y transacción.

## Escena y accesibilidad

Se conservan Three.js/React Three Fiber, cámara amortiguada con parallax, bóveda mecánica con espesor, anillos y hardware instanciado, iluminación PBR procedural, niebla, partículas, túneles y transiciones GSAP. La apertura final añade un artefacto determinista sin cargar modelos, texturas ni fuentes remotas.

Sin controles visibles de pausa, calidad o salto. La calidad se adapta a hardware/móvil; se respeta `prefers-reduced-motion`, se suspenden frames al ocultar la pestaña y se limpian timelines/listeners al desmontar. **Volver a la bóveda**, Escape, marca y selector de misiones conservan la navegación normal. Si WebGL falta o pierde el contexto, el modo compatible refleja los sellos y el artefacto; no bloquea la conexión ni la navegación.

Comprobar escritorio y móvil desde 320 px, teclado/foco, movimiento reducido, ocultar/recuperar pestaña y pérdida de WebGL. El objetivo visual es 60 FPS con aceleración apropiada; no se garantiza en un renderizador por software.

## Validación y limitaciones

- `npm test`: **85 pruebas aprobadas**, con comprobación TypeScript de pruebas y fuentes de integración. Incluye regresión de Identidad/Firma, vectores SEP-53, políticas de pago, reservas/patrocinios, firmas Mainnet rechazadas, cuerpos modificados, envío incierto, recuperación de recarga y retirada del progreso al desconectar.
- `npm run build`: correcto. Vite advierte de módulos de más de 500 kB, principalmente SDK/entrada y escena 3D. La escena y exportación PNG se cargan de forma diferida.
- `npm run lint`: sin errores ni advertencias. Se corrigieron las advertencias anteriores de efectos y dependencias sin desactivar reglas.
- Lecturas reales del RPC oficial contrastaron passphrase, cabecera, reserva, fee, cuenta y respuesta `NOT_FOUND`. El SDK instalado puede mantener fechas RPC como strings aunque sus tipos indiquen números; se normalizan estrictamente.
- Chromium comprobó el recorrido completo con SDK real y fixtures aislados: `PENDING` conserva 2/3, solo el recibo validado permite 3/3, apertura de puerta/artefacto, descarga PNG, móvil 320/390 px, apertura con movimiento reducido, pérdida de WebGL y revocación de permisos que restablece 0/3. Una segunda prueba recargó durante un envío incierto, recuperó el mismo hash y lo verificó sin otra firma ni envío.
- El adaptador de consulta también leyó una transacción pública existente con estado real `SUCCESS`, envelope y resultado XDR y fechas normalizadas. Era una lectura de una transacción ajena al recorrido de pruebas; no se usó para completar una misión ni como evidencia de un pago nuevo de la aplicación.
- Las pruebas de envío/finalidad usan proveedores RPC y puente de extensión aislados con firmas efímeras. No equivalen a una autorización desde una extensión real ni demuestran que se haya transmitido una operación real durante esta sesión del agente.
- **Pendiente de comprobación manual:** realizar el recorrido anterior desde Varial real y confirmar en el explorador el autopago aprobado. No se enviaron operaciones reales desde las herramientas. No afirmar una demo on-chain terminada hasta completar esa comprobación.
- RPC conserva un historial limitado y Testnet puede reiniciarse; cuentas y seguimientos antiguos pueden dejar de estar disponibles. El logro no implica persistencia ni valor.

La investigación real mediante `stellar-raven.search` y `stellar-raven.execute`, fuentes, respuestas y decisiones está en [RAVEN_USAGE.md](./RAVEN_USAGE.md).

## Arquitectura y archivos de la última etapa

| Archivos | Responsabilidad |
| --- | --- |
| `src/stellar/payment.ts` | Política de autopago, construcción, validación del cuerpo/firma y recibo confirmado |
| `src/stellar/paymentFlow.ts` | Revisión, envío único, sondeo finito, invalidación y recuperación de incertidumbre |
| `src/stellar/paymentJournal.ts` | Seguimiento público por pestaña, sin firmas ni secretos |
| `src/stellar/varial.ts`, `walletSession.ts`, `src/hooks/useWallet.ts` | Adaptadores reales, guardas de cuenta/red y progreso integrado |
| `src/components/WalletPayment.tsx`, `MissionHUD.tsx` | Revisión y autorización minimalistas de Misión 3 |
| `src/components/VaultReward.tsx`, `ArtifactFallback.tsx` | Recibo, descarga y alternativa sin WebGL |
| `src/components/Vault.tsx`, `VaultFallback.tsx`, `VaultScene.tsx` | Recibo conectado a la escena y al modo compatible |
| `src/components/scene/VaultMechanism.tsx`, `VaultOpening.tsx`, `CinematicCamera.tsx` | Tercer sello, apertura condicionada al recibo, encuadre del artefacto y limpieza de animaciones |
| `src/experience/artifact.ts`, `rewardCard.ts` | Apariencia determinista y exportación PNG local |
| `src/experience/types.ts`, `useExperienceController.ts` | Tipos honestos de evidencia, movimiento reducido y limpieza de timelines |
| `src/App.tsx`, `App.css`, `src/data/missions.ts` | Progreso 3/3, navegación, textos y responsive |
| `tests/payment.test.ts`, `browserFixtures.ts`, `all.test.ts`, `tsconfig.tests.json`, `package.json` | Cobertura, datos aislados para QA y comprobación de tipos |
| `README.md`, `RAVEN_USAGE.md` | Ejecución, evaluación y fuentes verificadas |

No se añadieron dependencias para esta etapa. SDKs contrastados: `@stellar/stellar-sdk 17.4.0` y `@stellar/varial-sdk 7.0.0`. La lógica blockchain está separada de React y Three.js; no hay actualizaciones React por fotograma. GSAP escribe señales narrativas y `useFrame` las consume mediante referencias.

Los requisitos de entrega de commits/PR siguen siendo pasos separados: no se realizaron commits, push ni Pull Request en esta etapa.

## Refinamiento mecánico de la bóveda

Dirección visual adaptada a la referencia de puerta circular monumental: disco de acero más grueso, núcleo de cierre cilíndrico, aros concéntricos cian, bisagras con cojinetes, placas, tornillería y marcas radiales. Los cuatro pestillos se retraen y el núcleo/anillos giran durante el desbloqueo; la puerta se separa del marco antes de completar su apertura articulada. El arco arquitectónico y las columnas enmarcan la cámara sin añadir elementos fantásticos.

`src/components/scene/MechanicalFace.tsx` genera una pequeña textura de rugosidad (128 × 128, RGBA) sin recursos externos; agrupa tornillos y marcas en dos meshes instanciadas y libera sus recursos. `VaultMechanism.tsx` integra el frontal y conserva las tres cerraduras, los canales de apertura y el artefacto. `VaultScene.tsx` añade el marco arquitectónico y ajusta la materialidad/luz. La lógica de wallet, firma, pago, recibo y exportación PNG no cambia. No se añadieron dependencias ni consultas blockchain: esta etapa es exclusivamente visual.

Validación del refinamiento: build correcto, 85 pruebas aprobadas y lint sin advertencias. Chromium comprobó escritorio/móvil, movimiento reducido, misiones hasta 3/3 con fixtures aislados, apertura, PNG, fallback y recuperación tras recarga. Un primer recorrido de navegador se cerró durante la apertura; la repetición secuencial con `--disable-dev-shm-usage` completó ambos escenarios. No se enviaron transacciones reales para estas pruebas visuales.


## Verificación cinematográfica en vivo

La interfaz conserva la bóveda metálica, tres misiones, cámara, túneles y parallax. La secuencia enlaza estados reales, sin porcentajes artificiales:

1. **Firma validada / envío:** núcleo activo y anillos cian; puerta cerrada. Solo después de comprobar la firma y el cuerpo autorizados.
2. **Confirmación pendiente:** pulsos y luces radiales tras un acuse RPC `PENDING`/`DUPLICATE`. Telemetría con la respuesta efectiva de envío y consulta. No equivale a éxito. Un estado incierto conserva la misma operación y permite volver a consultarla.
3. **Recibo verificado:** se muestran hash, ledger y enlace; oleada cian, rotación y retracción mecánica. Requiere pasar todas las verificaciones existentes, no solo leer `SUCCESS`.
4. **Apertura:** separación de la puerta, giro con peso, haces de luz, cámara y artefacto derivado del hash. Después se habilita la tarjeta PNG. La navegación no reinicia ni vuelve a enviar un pago.

El icono de sonido de la cabecera permite activar señales mecánicas sintetizadas con Web Audio. Está apagado por defecto y se suspende al ocultar la pestaña. No añade archivos ni dependencias externas.

Para comprobar manualmente: completar las tres misiones con Varial en Testnet siguiendo el recorrido anterior, observar **2 de 3** durante la espera, contrastar el hash/ledger en Stellar Expert y verificar que solo entonces llega **3 de 3** y se abre la puerta automáticamente. Rechazar una autorización debe conservar dos sellos sin abrir. Recargar mientras se espera debe recuperar la misma operación tras completar Identidad/Firma, sin otro envío. Comprobar también movimiento reducido, móvil, PNG y cambio de cuenta/red. No prolongamos artificialmente la espera para hacer visibles las etapas: una confirmación rápida puede abreviarlas.

Archivos de esta etapa: `src/stellar/paymentFlow.ts` (hechos del ciclo real), `src/experience/paymentCinema.ts` (derivación visual), `src/components/PaymentVerification.tsx` (estado/prueba), `src/hooks/useVaultAudio.ts` (audio opcional), `src/App.tsx`/`App.css` (navegación y composición), `src/components/Vault.tsx`/`VaultScene.tsx` y `src/components/scene/{MechanicalFace,VaultMechanism,CinematicCamera,VaultOpening}.tsx` (energía, cámara y apertura), `tests/payment.test.ts`, este README y `RAVEN_USAGE.md`.

Validación de esta etapa: **90 pruebas aprobadas**, build y lint correctos. Chromium comprobó autorización establecida, espera con 2/3, transición a recibo verificado y apertura automática, PNG, móvil (390/320 px), movimiento reducido, fallback WebGL, revocación de permisos y recuperación del mismo hash sin otro envío. Un recorrido adicional comprobó `FAILED` sin apertura/artefacto ni 3/3 y con reintento revisable. Los flujos de wallet/envío/finalidad del navegador usan fixtures aislados y claves efímeras de prueba; **no se envió un pago real desde estas comprobaciones**. La comprobación manual con Varial sigue pendiente. El build conserva el aviso conocido de bundles superiores a 500 kB.
