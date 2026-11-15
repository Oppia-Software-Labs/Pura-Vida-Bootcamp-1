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

`test` ejecuta smoke y pruebas DOM de conexión con SDK simulado; estas no sustituyen la aprobación humana con la extensión real.  `build` comprueba tipos y genera `dist`. `preview` sirve ese build solo en `127.0.0.1`.

## Seguridad y alcance

- Práctica en Testnet: no se necesitan compras ni fondos reales.
- Nunca compartir claves privadas ni frases de recuperación.
- Solo se admite la extensión Varial mediante su SDK. Instalarla o habilitarla en el navegador antes de conectar.
- No se guardan ni registran direcciones, permisos o secretos en la app.
- Tras aprobar el acceso, se lee la red de la wallet. Testnet se confirma por su passphrase, no solo por el nombre; otras redes muestran una advertencia. La app no cambia la red automáticamente.
- Si falla la lectura de red, no se muestran datos parciales y se permite reintentar. La desconexión todavía no está disponible.
- No hay firmas, pagos ni transacciones. La prueba real de conexión con la extensión sigue pendiente.
