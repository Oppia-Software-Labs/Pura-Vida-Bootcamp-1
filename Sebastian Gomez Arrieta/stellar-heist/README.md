# Stellar Heist — The Genesis Vault

Experiencia de infiltración cinematográfica para Stellar Pura Vida Bootcamp. El mundo 3D permanece montado mientras la interfaz cambia de contexto: arranque, cámara Génesis, viaje holográfico y consola de misión.

## Ejecutar

```bash
npm install
npm run dev
```

Abrir la URL local que indique Vite. Compilar con `npm run build`; servir esa compilación con `npm run preview`.

## Implementado

- Bóveda mecánica tridimensional: marco industrial con espesor, puerta cilíndrica gruesa articulada, anillos independientes, tornillería y segmentos instanciados, cerrojos retráctiles y tres cerraduras.
- Cámara de seguridad completa con pared perforada, columnas, escalones, suelo metálico, niebla y partículas espaciales. Materiales PBR y reflejos de un entorno luminoso generado en código con Drei; sin modelos, texturas ni fuentes remotas.
- Arranque GSAP de unos cinco segundos: iluminación, inicio de mecanismos, aproximación de cámara y aparición del título. Tiene un límite de seguridad y no vuelve a ejecutarse al navegar entre protocolos. Sin controles visibles de calidad, pausa ni salto; conserva movimiento reducido según el sistema.
- Anillos contrarrotativos, núcleo flotante/pulsante, variaciones de luces, partículas, escáner biométrico y señales holográficas continuas.
- Cámara amortiguada con parallax limitado y recorrido de profundidad real. Al seleccionar una misión se alinea con el núcleo, atraviesa una proyección energética y recorre un túnel de geometría y partículas. El regreso invierte el viaje.
- Los viajes pueden cancelarse con **Volver a la bóveda**, Escape o la navegación normal. La puerta física permanece sellada: entrar en una consola holográfica no verifica una misión.
- Conexión real con Varial: autorización, dirección Stellar válida, Testnet por passphrase y saldo XLM mediante el RPC oficial. Copiar dirección, actualizar saldo y desconectar localmente.
- Primer sello ligado a la sesión autorizada: luz y arco de cerradura animados, progreso 1/3 y acceso a Misión 2.
- Misión 2 funcional: `signMessage` real de Varial, desafío con nonce/origen/cuenta/Testnet/vencimiento y verificación criptográfica local SEP-53. Solo una firma válida abre el segundo sello y actualiza a 2/3. Escáner 3D neutral durante la espera; alineación de anillos, pulso y candado abierto después de verificar.
- Controles magnéticos, teclado, Escape para regresar, informe accesible y foco al entrar en una consola.

## Comprobar cada efecto

1. Recargar y observar el encendido gradual, la aproximación y el título. Las animaciones están activas por defecto.
2. Mover el cursor sobre el entorno libre del HUD para ver parallax e inercia. Observar anillos, núcleo y partículas.
3. Pulsar **INICIAR INFILTRACIÓN** o elegir un protocolo inferior. Observar el portal y el túnel, sin abrir físicamente la bóveda.
4. Probar **Volver a la bóveda** y Escape durante un viaje; cambiar entre misiones habilitadas con el selector inferior. Firma requiere Identidad; Operación requiere Firma. La acción de enviar sigue deshabilitada.
5. Completar Identidad siguiendo las instrucciones siguientes. Los instrumentos 3D siguen visibles y el primer sello se abre sin abrir la puerta final.
6. Probar `prefers-reduced-motion` del sistema, también cambiándolo con la página abierta. Las secuencias largas se resuelven sin bloquear la navegación; los sellos siguen reflejando la verificación.
7. La calidad se adapta automáticamente. En móvil o ante baja tasa de fotogramas se reducen resolución, partículas y posprocesamiento. No hay interruptores visibles de calidad o pausa.
8. Ocultar y recuperar la pestaña. El bucle WebGL se suspende cuando está oculta.
9. Probar móvil desde 320 px. Las consolas permiten leer su contenido y los protocolos permanecen accesibles.
10. Si WebGL falta o pierde su contexto, se muestra la bóveda SVG compatible y el recorrido sigue funcionando con una transición simplificada.

## Estado Stellar y apertura final

**Implementado:** Misión 1 con extensión Varial real, validación de autorización/dirección/Testnet y consulta de saldo. Una cuenta inactiva o sin fondos puede completar Identidad: disponer de XLM no forma parte de esta misión. El saldo mostrado es total, no saldo disponible tras reservas.

**Implementado también:** firma de un mensaje legible mediante Varial y verificación SEP-53 de la clave correspondiente a la dirección conectada. Nonce de 256 bits con Web Crypto, origen completo, propósito, cuenta, passphrase y fechas. TTL de 3 minutos; consumo único en memoria. La cuenta y la red se revisan de nuevo antes y después de firmar. Firmar no necesita XLM ni cuenta activada en el ledger.

**Alcance:** prueba criptográfica local de control de una clave para esta experiencia educativa. No es autenticación segura de servidor, no valida los thresholds/signers multisig ni crea sesiones autenticadas para un backend. No se guardan firmas ni logros en almacenamiento persistente. Conectar por sí solo sigue sin demostrar control de la clave.

**Pendiente:** construir, firmar, enviar y verificar una operación XLM real de Testnet para Misión 3. No existen wallets, pagos, hashes ni verificaciones ficticias en la aplicación.

`verifiedCompletion` permanece explícitamente en `null`. No hay botón, parámetro de URL, valor de localStorage ni consola de demostración que active la apertura.

Está preparada una secuencia 3D para un futuro adaptador confiable: iluminar cerraduras, acelerar y alinear anillos, retraer cerrojos, abrir físicamente la puerta, cambiar la luz a dorado, emitir una onda/partículas y revelar un artefacto mientras la cámara orbita. Su geometría/color/orientación se derivan de un hash válido aportado por ese adaptador; no se utiliza un hash de muestra.

El tipo `TrustedVaultCompletion` separa arquitectónicamente esa entrada. **Un tipo TypeScript o las comprobaciones de formato no verifican una transacción.** La siguiente etapa debe incorporar evidencia verificada mediante la red y validación confiable en servidor antes de habilitar ese adaptador. La secuencia final permanece inaccesible en este recorrido visual y no se presenta como funcionalidad blockchain terminada.

La investigación realizada con `stellar-raven.search` y `stellar-raven.execute`, las fuentes contrastadas, las versiones y las limitaciones se registran en [RAVEN_USAGE.md](./RAVEN_USAGE.md), según `AGENTS.md`.

## Comprobar la wallet real

1. Usar Node 24 y ejecutar `npm install` y `npm run dev`. Abrir la URL de Vite en `localhost` o `127.0.0.1`, en un navegador con la extensión oficial [Varial](https://varialwallet.com) instalada. En producción se requiere HTTPS; una URL LAN por HTTP no equivale a localhost.
2. Desbloquear la extensión, seleccionar una cuenta y la red **Testnet**. La passphrase debe ser `Test SDF Network ; September 2015`.
3. Entrar en **Identidad**, pulsar **Conectar wallet** y autorizar el sitio en Varial. Esta misión no solicita firma, secreto ni pago. Comprobar dirección, saldo, **Identidad conectada**, primer sello iluminado/abierto y **1 de 3**. Misión 2 queda habilitada.
4. Pulsar la dirección para copiarla. **Ver dirección completa** permite seleccionarla si el navegador bloquea el portapapeles. **Actualizar saldo** vuelve a consultar el ledger.
5. Con una cuenta nueva sin activar, comprobar el aviso correspondiente. El enlace a Stellar Lab permite obtener XLM de prueba por decisión del usuario; después pulsar **Actualizar saldo**. Una cuenta con cero XLM muestra **Sin saldo**. La aplicación no envía solicitudes de financiación.
6. Cambiar de cuenta o a Mainnet mientras la página sigue abierta, o revocar el permiso del sitio en la extensión. Al detectarlo deben desaparecer dirección/saldo, bajar a 0/3, cerrarse el primer sello y regresar a Identidad si se estaba en otra misión. Para continuar hay que reconectar; Mainnet se rechaza. Una red con nombre Testnet y otra passphrase también se rechaza.
7. Probar rechazar la solicitud, bloquear la extensión y conectar desde un navegador sin Varial. Deben aparecer errores claros y mantenerse 0/3. Si el sitio ya tenía permiso, Varial puede no volver a mostrar el popup: revocarlo en la extensión para probar el rechazo.
8. Bloquear `soroban-testnet.stellar.org` en las herramientas de desarrollo y actualizar saldo: debe mostrarse error de consulta, no cuenta inactiva ni saldo cero. Restaurar la conexión y reintentar.
9. **Desconectar** borra la sesión local y el progreso. No revoca el permiso de Varial ni cierra una solicitud ya abierta. Recargar también borra la sesión: no se guarda identidad en almacenamiento local.

El SDK utiliza sondeo para cambios de wallet. Aquí se consulta cada segundo mientras la pestaña está visible, al recuperar foco/visibilidad y antes/después de leer saldo o firmar. La invalidación ocurre al detectar el cambio; no es una notificación instantánea desde la extensión. Lecturas con límite de 10 s; autorización y firma, 120 s. Una cancelación local ignora respuestas tardías. La futura Misión 3 también debe revalidar antes de firmar/enviar.

## Probar la firma con Varial

1. Completar Identidad en Testnet y pulsar **Continuar al segundo sello**. Se muestra **Demuestra que eres tú**, una explicación breve y **Firmar mensaje**. Progreso inicial 1/3; Operación bloqueada.
2. Pulsar **Firmar mensaje**. Revisar en la extensión el mensaje legible: propósito del segundo sello, origen exacto de la página, dirección elegida, passphrase Testnet, nonce y vencimiento. No es una transacción y no gasta XLM.
3. Rechazar la firma: debe aparecer un aviso breve y conservarse 1/3. Reintentar genera otro nonce. Mientras se espera, el escáner puede moverse, pero no debe aparecer el pulso ni el estado de éxito.
4. Autorizar la firma desde Varial. Solo tras verificar sus bytes y el desafío se muestra **Firma verificada**, **Segundo sello abierto** y 2/3, con alineación/pulso/candado abierto. **Continuar al último sello** permite ver Misión 3; **Enviar prueba** sigue deshabilitado. Volver a la bóveda muestra dos sellos abiertos y la puerta final cerrada.
5. Probar **Cancelar firma** o regresar a la bóveda mientras la wallet espera. Se cancela el intento local, pero **no se cierra el popup** de la extensión. Cerrar la solicitud antigua en Varial antes de reintentar; sus respuestas tardías no pueden completar otro intento.
6. Cambiar cuenta/red o revocar permisos durante la solicitud y después de completar Firma. Al detectarlo deben invalidarse ambos sellos y el acceso a Misión 3; la interfaz regresa a Identidad. Recargar o desconectar también elimina la prueba local.
7. Los casos de mensaje/firma alterados, vencimiento y replay se cubren automáticamente con `npm test`. No hay botones de prueba, parámetros de URL ni proveedor simulado en la aplicación para aprobarlos.

Si la extensión devuelve una firma de formato no admitido o no implementa SEP-53, se rechaza y conviene actualizar Varial. No se aceptan otros algoritmos como alternativa. Una cuenta con permisos multisig especiales puede no poder demostrar autorización de cuenta mediante este flujo de clave individual; esa autorización queda fuera del alcance de Misión 2.

## Arquitectura y propiedad de las animaciones

- `src/experience/useExperienceController.ts`: estado narrativo y timelines GSAP cancelables. Único escritor de canales de arranque y viaje; no actualiza React por fotograma.
- `src/experience/types.ts`: fases, señales mutables y frontera de la futura verificación confiable.
- `src/components/Vault.tsx`: carga diferida, estado del renderizador y alternativa ante error/pérdida de contexto.
- `src/components/VaultScene.tsx`: Canvas, cámara de seguridad, luces, entorno PBR procedural, sombras, posprocesamiento y presupuesto gráfico adaptativo.
- `src/components/scene/VaultMechanism.tsx`: puerta, anillos, núcleo, cerrojos, hardware instanciado y revelación determinista preparada.
- `src/components/scene/CinematicCamera.tsx`: único escritor de la posición/orientación de cámara. Lee las señales y amortigua el recorrido; sin tweens que compitan sobre la cámara.
- `src/components/scene/MissionTransition.tsx`: túnel tridimensional y portal procedural; no utiliza vídeo.
- `src/components/scene/ParticleField.tsx`: partículas e instrumentos 3D de cada misión.
- `src/components/scene/SignatureScanner.tsx`: escáner, anillos, pulso y transformación de candado del segundo sello; éxito condicionado al verificador.
- `src/components/scene/VaultOpening.tsx`: timeline final condicionado a evidencia de un futuro adaptador. Inactivo actualmente.
- `src/components/MissionHUD.tsx`, `MagneticButton.tsx`, `Dialog.tsx`: consolas, interacción y ayuda accesible.
- `src/hooks/`: preferencias reactivas de movimiento y visibilidad de pestaña.
- `src/stellar/walletSession.ts`: estado tipado, validación de identidad, invalidación y protección frente a respuestas tardías.
- `src/stellar/varial.ts`: APIs reales de Varial y saldo del RPC oficial.
- `src/stellar/messageProof.ts`: desafíos de un solo uso, conversión de firma y verificación SEP-53.
- `src/components/WalletProof.tsx`: solicitud de firma, cancelación local y mensajes breves.
- `src/hooks/useWallet.ts`, `src/components/WalletIdentity.tsx`: suscripción/ciclo de vida y controles mínimos de wallet.
- `src/App.tsx`, `src/App.css`: composición cinematográfica, navegación y responsive.

GSAP escribe progreso narrativo; `useFrame` lee ese progreso y anima objetos mediante referencias. Motion controla únicamente paneles HTML. Los recursos del compositor, animaciones y listeners se liberan al desmontar.

## Dependencias y validación

Dependencia añadida para Misión 1: **@stellar/varial-sdk 7.0.0**. El SDK Stellar 17.4.0 y las dependencias visuales ya estaban instalados.

Ejecutar `npm test` para comprobar las 17 pruebas de Identidad y las de Firma: vectores oficiales ASCII/Unicode SEP-53, bytes/base64, prefijo correcto, firma válida, firma/mensaje alterados, cuenta/red/origen incorrectos, desafío vencido, replay, rechazo, cambio de wallet, cancelación/reintento y respuestas tardías. Se usan claves efímeras y dobles aislados exclusivamente en pruebas; no se incluyen en producción. Vite empaqueta `tests/all.test.ts` en un directorio temporal y el runner de Node lo ejecuta, sin añadir dependencias. `npm run build` valida tipos y genera producción. `npm run lint` comprueba el código.

La aprobación con una extensión real requiere la comprobación manual anterior; el Chromium de automatización no tiene Varial instalada y no sustituye esa validación. Los logros son estado temporal de interfaz, no evidencia confiable en servidor. La apertura final permanece bloqueada.

Validación realizada el 16/11/2026: **17 pruebas de sesión aprobadas**, compilación TypeScript/Vite correcta y recorrido Chromium con WebGL, aviso real de extensión ausente, bloqueo de misiones, movimiento reducido y móvil de 320/390 px sin desbordamiento ni errores de página. El adaptador real obtuvo el mismo saldo que Horizon para una cuenta pública de Testnet; una dirección pública aleatoria sin entrada devolvió `null`, como se esperaba. Estas consultas fueron de solo lectura. La primera búsqueda de cuentas en Horizon sin filtros respondió HTTP 400; se obtuvo una cuenta pública desde una transacción existente para contrastar el saldo. Una dirección pública de referencia resultó tener fondos, por lo que no se utilizó como evidencia de cuenta inactiva.

Validación de Misión 2 (16/11/2026): **47 pruebas aprobadas**, `npm run build` correcto y lint sin errores. Chromium comprobó el SDK real mediante un doble aislado del puente de extensión, con firmas SEP-53 Ed25519 generadas independientemente en memoria: rechazo, firma inválida, cancelación/reintento, respuesta tardía, progreso 1/3 → 2/3, habilitación de Misión 3, cambio de cuenta → 0/3, ausencia de controles retirados, WebGL y móvil 320/390 px. No se solicitaron operaciones. Este recorrido **no equivale a aprobar un popup de Varial real**; esa validación manual sigue pendiente.

También se provocó pérdida de contexto WebGL después de verificar la firma: el modo compatible conserva 2/3 y la navegación. Esta prueba detectó que el aviso flotante cubría **Volver** en móvil; se corrigió colocándolo en el flujo de la página y el recorrido completo volvió a pasar.

Limitaciones conocidas: sondeo con latencia; verificación local educativa sin autoridad de servidor; cuatro advertencias de lint existentes (`set-state-in-effect` en `Vault` y el controlador, `exhaustive-deps` en el controlador y `VaultScene`). Vite advierte de módulos superiores a 500 kB (escena 3D y entrada con SDK); no impide compilar. No se ha implementado firma, envío ni validación de **transacciones**.

El objetivo es 60 FPS en equipos con aceleración gráfica adecuada; no se garantiza en un renderizador por software. Se limita DPR y se adapta calidad. La escena 3D está en un módulo diferido; Vite puede advertir que supera 500 kB minificados. La compilación puede terminar correctamente con esa advertencia. No se añade profundidad de campo para conservar legibilidad y presupuesto de render.

## Refinamiento de interfaz

La escena 3D, la cámara, los efectos y las transiciones se conservan. La interfaz prioriza título, una frase, estado y acción. Dirección y saldo aparecen únicamente tras conectar; los detalles secundarios se mantienen discretos. Los dos primeros sellos reflejan autorización y prueba de firma, con progreso máximo 2/3. La calidad se adapta internamente y el sistema respeta movimiento reducido, sin controles visuales añadidos.

## Siguiente etapa: Misión 3

Falta definir explícitamente un destino de Testnet aprobado y el importe; comprobar saldo gastable/reservas, construir una transacción con fee y timeout, revalidar cuenta/red, solicitar firma de transacción en Varial, enviar al RPC oficial y esperar éxito definitivo. Deben tratarse rechazos, cambios de wallet, respuestas inciertas y reintentos sin duplicar envíos. Solo entonces puede generarse evidencia de la transacción y habilitarse la apertura final/artefacto. Para logros persistentes o de valor, la verificación debe realizarse en un servicio confiable. No se añadieron métodos de envío en esta etapa.

## Archivos de esta etapa

- Criptografía y sesión: `src/stellar/messageProof.ts` (nuevo), `src/stellar/walletSession.ts`, `src/stellar/varial.ts`, `src/hooks/useWallet.ts`.
- Interfaz: `src/components/WalletProof.tsx` (nuevo), `src/components/MissionHUD.tsx`, `src/App.tsx`, `src/App.css`, `src/data/missions.ts`.
- Escena y recorrido: `src/components/scene/SignatureScanner.tsx` (nuevo), `src/components/scene/ParticleField.tsx`, `src/components/scene/VaultMechanism.tsx`, `src/components/Vault.tsx`, `src/components/VaultFallback.tsx`, `src/components/VaultScene.tsx`, `src/experience/types.ts`, `src/experience/useExperienceController.ts`.
- Pruebas: `tests/signature.test.ts` y `tests/all.test.ts` (nuevos), `tests/wallet.test.ts`, `tests/run.mjs`.
- Documentación: `README.md`, `RAVEN_USAGE.md`. Sin nuevas dependencias ni cambios en otros proyectos.
