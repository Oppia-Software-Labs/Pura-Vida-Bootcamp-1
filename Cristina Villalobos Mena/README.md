# Buzón de propinas Stellar

Proyecto del Pura Vida Bootcamp de Oppia Software Labs. Desarrollado por **Cristina Villalobos Mena**.

La app permite crear una tarjeta de propinas personalizada, conectar Varial Wallet y compartir la dirección pública de Stellar mediante un QR, el portapapeles o una imagen PNG. Para la demo uso Stellar Testnet. El QR contiene la dirección pública como texto.

## Cómo ejecutarlo

Usé Node.js 22.16.0. Desde la raíz del repositorio, ejecutá:

```bash
cd "Cristina Villalobos Mena"
npm ci
npm run dev
```

Abrí la URL que Vite muestre junto a **Local**. Para probar la conexión, usá el mismo perfil de navegador donde está instalada Varial Wallet y seleccioná **Test Net** en la extensión.

## Cómo usé Stellar Raven

Consulté Stellar Raven desde Codex para investigar qué paquete usar para conectar Varial Wallet desde React con TypeScript y qué datos devuelve la API de conexión.

Apliqué esa consulta en `src/stellar/varial.ts`. Uso `isConnected()` para comprobar si la extensión está disponible y `requestAccess()` para solicitar acceso a la dirección pública. Si la solicitud falla, muestro un mensaje que permite reintentar. La consulta no confirmó un código específico de cancelación.

- [Stellar Raven](https://raven.stellar.org/)
- [Guía de Varial Wallet de Stellar](https://developers.stellar.org/docs/build/guides/freighter)
- [Cómo configurar Testnet en Varial](https://developers.stellar.org/docs/build/guides/freighter/connect-testnet)

## Pruebas automatizadas

Desde la carpeta del proyecto:

```bash
npx playwright install chromium
npm test
npm run lint
npm run build
```

Las pruebas automatizadas comprueban la actualización de la vista previa, la recuperación del borrador al recargar y el contenido predeterminado cuando los campos contienen solo espacios.

## Pruebas manuales con Varial

| Caso | Resultado esperado |
| --- | --- |
| Conectar Varial en Test Net y autorizar el acceso | La tarjeta muestra la misma dirección pública que la extensión. |
| Intentar conectar desde un perfil sin Varial | La app informa que la extensión no está disponible y permite reintentar. |
| Cancelar una solicitud de acceso cuando Varial la muestre | La app indica que no pudo obtener acceso y permite reintentar. |
| Copiar la dirección y escanear el QR de la tarjeta | El texto copiado y el escaneado coinciden con la dirección pública visible. |
| Descargar la tarjeta y abrir el PNG | La imagen incluye el logo, el nombre, el mensaje, la dirección pública y un QR que se puede escanear. |