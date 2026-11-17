# Stellar Wallet Lab

Laboratorio local con Vite y TypeScript para practicar con Stellar. Permite conectar la extensión Varial con aprobación del usuario y mostrar la dirección pública y el nombre de red devueltos por la wallet. Solo solicita acceso al pulsar «Connect Varial»; si falta la extensión o falla el permiso, muestra un mensaje y permite reintentar.

## Desarrollo

Requiere Node.js 26 o superior y npm. Desde esta carpeta, con el archivo de bloqueo de dependencias disponible:

```sh
npm ci --ignore-scripts
npm run dev
```

El servidor escucha solo en `127.0.0.1`; abrir la URL local que indique Vite.

```sh
npm test
npm run build
npm run preview
```

`test` ejecuta smoke y pruebas DOM de conexión, red y desconexión con SDK simulado; estas no sustituyen la aprobación humana con la extensión real.  `build` comprueba tipos y genera `dist`. `preview` sirve ese build solo en `127.0.0.1`.

## Seguridad y alcance

- Práctica en Testnet: no se necesitan compras ni fondos reales.
- Nunca compartir claves privadas ni frases de recuperación.
- Solo se admite la extensión Varial mediante su SDK. Instalarla o habilitarla en el navegador antes de conectar.
- No se guardan ni registran direcciones, permisos o secretos en la app.
- Tras aprobar el acceso, se lee la red de la wallet. Testnet se confirma por su passphrase, no solo por el nombre; otras redes muestran una advertencia. La app no cambia la red automáticamente.
- Si falla la lectura de red, no se muestran datos parciales y se permite reintentar. «Disconnect» solicita la desconexión para la cuenta y red activas; no revoca todos los permisos históricos. Si no puede confirmarse, se ocultan los datos y se permite reintentar la desconexión.
- Al volver el foco a la página, se comprueban dirección y red sin pedir acceso de nuevo. Si cambian o no pueden leerse, se limpian los datos y se pide reconectar. No es una actualización continua ni hay sondeo periódico.
- No hay firmas, pagos ni transacciones. La prueba real de conexión con la extensión sigue pendiente.
- La barra de progreso (Extensión, Aprobación, Red) solo avanza con el estado real devuelto por la wallet; en otra red la etiqueta de red y el mensaje usan el color de advertencia. Mientras hay conexión se muestra solo «Desconectar».

## Esperas y diagnóstico local

Cada llamada al SDK mantiene su espera original. A los 10 segundos se muestra orientación en el idioma actual, sin desbloquear controles de wallet ni repetir solicitudes. Revisa el aviso de Varial; si queda atascado, cierra el aviso y recarga la página antes de reintentar. La app no cierra avisos ni recarga automáticamente. El aviso no cancela operaciones ni garantiza desconexión o revocación; una respuesta tardía sigue el flujo normal. El temporizador se limpia al resolverse o rechazarse la llamada. Tema e idioma siguen disponibles.

Solo en desarrollo (`import.meta.env.DEV`), la app usa `console.debug` con dos literales: categoría (`extension_check`, `access`, `network_read`, `account_read`, `disconnect`) y resultado (`ok`, `sdk_error`, `invalid_result`, `unavailable`, `slow`). No incluye valores del SDK, errores originales, cuentas, redes, identificadores ni metadatos. `sdk_error` no prueba rechazo del usuario. No hay persistencia, telemetría ni recolección remota de estos eventos; la app no emite diagnósticos en producción. Esta garantía se limita al código de la app: el SDK instalado contiene capturas que pueden usar `console.error` con errores originales. No se modifica ni se intercepta su consola.

## Tema e idioma

La interfaz inicia siempre en español y modo oscuro, sin depender del navegador o del sistema. Los controles de la cabecera permiten alternar español/inglés (globo con `ES`/`EN`) y oscuro/claro (sol/luna); su nombre completo aparece al pasar el cursor y lo anuncian los lectores de pantalla. Las preferencias solo viven en memoria: al recargar vuelven los valores iniciales. Cambiarlas no solicita acceso a la wallet ni reinicia una operación pendiente. Los nombres de red y direcciones se muestran tal como los devuelve Varial.

## Comprobación manual

Procedimiento pendiente de confirmar con la extensión real; no es un resultado de pruebas:

1. Confirmar el inicio oscuro y en español. Alternar ambos controles y revisar etiquetas, estados y mensajes; repetir durante una solicitud pendiente y tras un error sin generar otra solicitud. Recargar y confirmar los valores iniciales. Abrir la app con Varial habilitada y seleccionar Testnet en la wallet. Recorrer los controles con Tab: el foco debe verse. Conectar y aprobar solo el acceso a la dirección pública, sin firmar operaciones.
2. Comparar dirección y red con la cuenta activa en Varial. Rechazar un permiso en otro intento y comprobar que no se afirme una conexión. Sin extensión, comprobar el mensaje y la posibilidad de reintentar.
3. Cambiar cuenta o red en la wallet y volver a la página: debe pedir reconectar. Una red distinta de Testnet debe conservar su nombre real y mostrar una advertencia, no cambiarse automáticamente.
4. Desconectar: comprobar que los datos desaparezcan y el foco regrese a conectar. Verificar el permiso de la cuenta/red activa en Varial; no interpretar esto como revocación universal.
5. Revisar a 320, 390, 768 y 1280 px y con texto ampliado al 200%: márgenes equilibrados, secciones alineadas, separación entre botones, texto legible, foco visible y ausencia de recortes, solapamientos o saltos al aparecer «Disconnecting…». Incluir nombres de red largos y revisar el contraste. Usar únicamente datos sintéticos si se guardan capturas.

## Apoyo de Raven

Se consultó Raven para orientar la elección del SDK, apoyándose en documentación oficial de Varial y en la habilidad existente de desarrollo de dApps. No forma parte del runtime ni autoriza operaciones de wallet.

- [Raven](https://raven.stellar.org/)
- [Documentación oficial de Varial](https://docs.varialwallet.com/)
