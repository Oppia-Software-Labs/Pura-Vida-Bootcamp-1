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
- Arranque GSAP de unos cinco segundos: iluminación, inicio de mecanismos, aproximación de cámara y aparición del título. Puede saltarse. Tiene un límite de seguridad y no vuelve a ejecutarse al navegar entre protocolos.
- Anillos contrarrotativos, núcleo flotante/pulsante, variaciones de luces, partículas, escáner biométrico y señales holográficas continuas.
- Cámara amortiguada con parallax limitado y recorrido de profundidad real. Al seleccionar una misión se alinea con el núcleo, atraviesa una proyección energética y recorre un túnel de geometría y partículas. El regreso invierte el viaje.
- Los viajes pueden omitirse, cancelarse o reemplazarse al elegir otro protocolo. La puerta física permanece sellada: entrar en una consola holográfica no verifica una misión.
- HUD persistente con estado de wallet sin conectar, tres cerraduras pendientes y contador verificado fijo en 0/3. Las consolas muestran requisitos reales pendientes; las acciones Stellar están deshabilitadas.
- Controles magnéticos, teclado, Escape para regresar, informe accesible y foco al entrar en una consola.

## Comprobar cada efecto

1. Recargar y observar el encendido gradual, la aproximación y el título. **Saltar introducción** permite ir directamente a la cámara.
2. Mover el cursor sobre el entorno libre del HUD para ver parallax e inercia. Observar anillos, núcleo y partículas.
3. Pulsar **INICIAR INFILTRACIÓN** o elegir un protocolo inferior. Observar el portal y el túnel, sin abrir físicamente la bóveda.
4. Cambiar de protocolo durante un viaje: el controlador reemplaza la transición anterior. Probar **Omitir transición**, **Cancelar entrada**, **Regresar a la cámara** y Escape.
5. En Identidad, observar el escáner; en Prueba criptográfica, la consola sin reto ni firma; en Transacción Stellar, las etapas previstas sin operación en curso. Ninguna acción completa misiones.
6. Probar **Pausar movimiento** y la preferencia `prefers-reduced-motion` del sistema, también cambiándola con la página abierta. Las secuencias largas se resuelven sin bloquear la navegación.
7. Comparar calidad **CINE** y **LIGERA**. El modo ligero reduce resolución, partículas y posprocesamiento. En móvil se reducen los efectos; ante baja tasa de fotogramas, Drei solicita automáticamente el modo ligero.
8. Ocultar y recuperar la pestaña. El bucle WebGL se suspende cuando está oculta.
9. Probar móvil desde 320 px. Las consolas permiten leer su contenido y los protocolos permanecen accesibles.
10. Si WebGL falta o pierde su contexto, se muestra la bóveda SVG compatible y el recorrido sigue funcionando con una transición simplificada.

## Estado Stellar y apertura final

**Pendiente:** conexión de wallet, validación de cuenta/Testnet, firma de un reto con nonce y vencimiento, verificación criptográfica y pago XLM real confirmado. No existen pagos, direcciones, hashes ni verificaciones ficticias.

`verifiedCompletion` permanece explícitamente en `null`. No hay botón, parámetro de URL, valor de localStorage ni consola de demostración que active la apertura.

Está preparada una secuencia 3D para un futuro adaptador confiable: iluminar cerraduras, acelerar y alinear anillos, retraer cerrojos, abrir físicamente la puerta, cambiar la luz a dorado, emitir una onda/partículas y revelar un artefacto mientras la cámara orbita. Su geometría/color/orientación se derivan de un hash válido aportado por ese adaptador; no se utiliza un hash de muestra.

El tipo `TrustedVaultCompletion` separa arquitectónicamente esa entrada. **Un tipo TypeScript o las comprobaciones de formato no verifican una transacción.** La siguiente etapa debe incorporar evidencia verificada mediante la red y validación confiable en servidor antes de habilitar ese adaptador. La secuencia final permanece inaccesible en este recorrido visual y no se presenta como funcionalidad blockchain terminada.

Antes de cambiar funcionalidades Stellar, consultar `stellar-raven.search` y `stellar-raven.execute`, comprobar las APIs y registrar los hallazgos reales en `RAVEN_USAGE.md`, según `AGENTS.md`. Este rediseño modifica presentación y navegación; no añade integraciones Stellar ni nuevas consultas Raven.

## Arquitectura y propiedad de las animaciones

- `src/experience/useExperienceController.ts`: estado narrativo y timelines GSAP cancelables. Único escritor de canales de arranque y viaje; no actualiza React por fotograma.
- `src/experience/types.ts`: fases, señales mutables y frontera de la futura verificación confiable.
- `src/components/Vault.tsx`: carga diferida, estado del renderizador y alternativa ante error/pérdida de contexto.
- `src/components/VaultScene.tsx`: Canvas, cámara de seguridad, luces, entorno PBR procedural, sombras, posprocesamiento y presupuesto gráfico adaptativo.
- `src/components/scene/VaultMechanism.tsx`: puerta, anillos, núcleo, cerrojos, hardware instanciado y revelación determinista preparada.
- `src/components/scene/CinematicCamera.tsx`: único escritor de la posición/orientación de cámara. Lee las señales y amortigua el recorrido; sin tweens que compitan sobre la cámara.
- `src/components/scene/MissionTransition.tsx`: túnel tridimensional y portal procedural; no utiliza vídeo.
- `src/components/scene/ParticleField.tsx`: partículas e instrumentos 3D de cada misión.
- `src/components/scene/VaultOpening.tsx`: timeline final condicionado a evidencia de un futuro adaptador. Inactivo actualmente.
- `src/components/MissionHUD.tsx`, `MagneticButton.tsx`, `Dialog.tsx`: consolas, interacción y ayuda accesible.
- `src/hooks/`: preferencias reactivas de movimiento y visibilidad de pestaña.
- `src/App.tsx`, `src/App.css`: composición cinematográfica, navegación y responsive.

GSAP escribe progreso narrativo; `useFrame` lee ese progreso y anima objetos mediante referencias. Motion controla únicamente paneles HTML. Los recursos del compositor, animaciones y listeners se liberan al desmontar.

## Dependencias y validación

Única dependencia añadida para este rediseño: **GSAP 3.15.1**. React, TypeScript, Vite, Tailwind, Motion, Lucide, Three.js, React Three Fiber y Drei ya estaban instalados.

El proyecto no incluye un script de tests unitarios. La validación de esta etapa utiliza compilación TypeScript/Vite y recorridos de navegador para arranque, cambio/cancelación de misiones, progreso pendiente, pausa, responsive, preferencias de movimiento y fallback.

El objetivo es 60 FPS en equipos con aceleración gráfica adecuada; no se garantiza en un renderizador por software. Se limita DPR y se adapta calidad. La escena 3D está en un módulo diferido; Vite puede advertir que supera 500 kB minificados. La compilación puede terminar correctamente con esa advertencia. No se añade profundidad de campo para conservar legibilidad y presupuesto de render.
