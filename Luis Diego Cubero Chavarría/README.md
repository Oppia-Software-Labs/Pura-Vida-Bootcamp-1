# Stellar Wallet Lab

Laboratorio local con Vite y TypeScript para practicar con Stellar. Permite conectar la extensión Varial con aprobación del usuario y mostrar la dirección pública devuelta. Solo solicita acceso al pulsar «Connect Varial»; si falta la extensión o falla el permiso, muestra un mensaje y permite reintentar.

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
- Todavía no se lee la red ni se ofrece desconexión: la etiqueta de práctica no demuestra que la wallet esté en Testnet.
- No hay firmas, pagos ni transacciones. La prueba real de conexión con la extensión sigue pendiente.
