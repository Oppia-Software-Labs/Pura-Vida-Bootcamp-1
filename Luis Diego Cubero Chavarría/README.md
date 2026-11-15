# Stellar Wallet Lab

Scaffold local con Vite y TypeScript para practicar con Stellar. Incluye una página inicial y una prueba smoke en jsdom. La integración con wallet es el siguiente paso: todavía no conecta ni solicita permisos.

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

`test` ejecuta la prueba smoke; `build` comprueba tipos y genera `dist`. `preview` sirve ese build solo en `127.0.0.1`.

## Seguridad y alcance

- Práctica en Testnet: no se necesitan compras ni fondos reales.
- Nunca compartir claves privadas ni frases de recuperación.
- No hay conexión de wallet, firmas, pagos ni transacciones en esta versión.
- El SDK Varial está declarado como dependencia para la próxima integración, pero aún no se utiliza.
