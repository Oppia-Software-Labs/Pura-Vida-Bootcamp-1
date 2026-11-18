# Stellar Odyssey

Mi primer entregable del Pura Vida Bootcamp. Una pequeña expedición para conectar una wallet de Stellar, ver su dirección pública y consultar su saldo real de XLM de prueba.

Usa React, TypeScript, Vite, Tailwind CSS y Motion. La integración es con **Varial (antes Freighter)** mediante `@stellar/varial-sdk` 7.0.0. Solo consulta **Testnet**: no firma transacciones, no solicita claves y no conecta una wallet al abrir la página.

## Instalar y ejecutar

Necesita Node.js 22.12 o posterior. Desde esta carpeta:

```bash
npm ci
npm run dev
```

Abra la dirección que muestre Vite, normalmente `http://localhost:5173`. No hacen falta variables de entorno ni una dirección pública configurada.

```bash
npm test          # Pruebas de la lógica de wallet, red y saldo
npm run build    # TypeScript y compilación de producción
npm run preview  # Revisar la compilación
```

Para las pruebas de navegador:

```bash
npx playwright install chromium
npm run test:e2e
```

Si ya tiene Edge en Windows, puede evitar esa descarga desde PowerShell:

```powershell
$env:PLAYWRIGHT_CHANNEL = 'msedge'
npm run test:e2e
```

## Probar con su wallet cuando esté listo

1. Abra la página en un navegador que tenga la extensión [Varial](https://varialwallet.com). El diseño funciona en celular; esta primera versión integra la extensión, no WalletConnect móvil.
2. Desbloquee la extensión y seleccione **Testnet** en su selector de red.
3. Presione **Conecte su wallet** y autorice el acceso a su dirección pública. No se pide una firma ni se envían transacciones. Si ya autorizó este origen, Varial puede devolver el permiso sin otro popup.
4. La aplicación valida el nombre de red y la passphrase `Test SDF Network ; September 2015` antes de consultar `https://horizon-testnet.stellar.org/accounts/{address}`. Solo muestra el saldo del activo `native`, con sus siete decimales.
5. Pruebe copiar la dirección, actualizar el saldo y desconectar. La aplicación comprueba cambios de cuenta/red cada 5 segundos mientras está visible y renueva el saldo cada 30 segundos. Desconectar cierra la sesión local y solicita revocar el permiso en Varial.
6. Si la dirección todavía no existe en Testnet, verá **cuenta sin activar**, no un saldo inventado de cero. Puede usar [Stellar Lab / Friendbot](https://lab.stellar.org/account/fund) con esa dirección para obtener XLM de prueba y después actualizar.

También puede rechazar la autorización, probar sin extensión o seleccionar otra red para comprobar el mensaje de error. La aplicación bloquea la consulta si la red no es Testnet. No necesita transferir fondos reales.

## Cómo está organizado

- `src/stellar/wallet.ts`: comunicación con Varial, validación de Testnet y consulta de Horizon.
- `src/hooks/useWallet.ts`: conexión, errores, cargas y cambios de cuenta/red. Descarta respuestas que llegan después de desconectar.
- `src/components/`: tarjeta de cuenta, partículas y montañas.
- `src/App.tsx` y `src/index.css`: composición y diseño responsive.
- `tests/`: pruebas aisladas con dobles del SDK y de HTTP; estos datos no forman parte de la aplicación. Las pruebas de navegador verifican la página sin extensión, sin fingir una autorización real.

## Stellar Raven y documentación

Se revisaron la [web de Raven](https://raven.stellar.org) y su [documentación oficial](https://raven.stellar.org/docs). Se encontró la configuración local de `stellar-raven` apuntando a `https://raven.stellar.org/mcp`, pero sus herramientas no estuvieron disponibles en esta sesión. El endpoint respondió HTTP 401 en la comprobación de acceso; el intento de inicialización directa agotó el tiempo de espera.

**No se ejecutaron `search` ni `execute` de Raven.** Por eso queda pendiente completar y registrar una consulta autenticada al MCP para cumplir esa parte del entregable. No se presentan las consultas web como si fueran respuestas de Raven.

La implementación se contrastó con fuentes oficiales y con los tipos del SDK instalado:

- [Cambio de Freighter a Varial](https://stellar.org/blog/foundation-news/freighter-is-now-varial).
- [Instalación del SDK actual](https://github.com/stellar/freighter-developer-docs/blob/main/extension/installation.md).
- [Conexión y desconexión](https://github.com/stellar/freighter-developer-docs/blob/main/extension/connecting.md).
- [Lectura de dirección y red](https://github.com/stellar/freighter-developer-docs/blob/main/extension/reading-data.md).
- [Consulta de cuentas en Horizon](https://developers.stellar.org/docs/data/apis/horizon/api-reference/retrieve-an-account).

Para el diseño se revisaron Raven, [Oppia Climb](https://climb.oppialabs.com/e/pura-vida), [React Bits](https://reactbits.dev/backgrounds/particles), [21st.dev](https://21st.dev), [Motion](https://motion.dev/docs/react), [Kokonut UI](https://kokonutui.com) y [Magic UI](https://magicui.design). La composición, montañas y partículas son propias. Motion maneja las transiciones; el fondo usa canvas con resolución limitada, brillo gradual, pausa manual y respeto por movimiento reducido. Las montañas tienen parallax suave; las tarjetas aparecen al hacer scroll y la firma personal se mantiene visible en celular. El canvas se detiene fuera de pantalla y con la pestaña oculta. Las fuentes se sirven localmente.

## Estado de la entrega

La conexión real queda preparada para probarla manualmente con su extensión. Durante el desarrollo no se conectó la wallet del autor ni se consultó su cuenta. Las pruebas automatizadas no sustituyen esa autorización real.

`npm audit` reportó 6 avisos altos relacionados con `picomatch` en las herramientas de desarrollo. La versión más reciente disponible al revisar fue 4.0.7, incluida en el aviso; no se aplicó un downgrade forzado de Vite/Vitest. Conviene revisar la actualización cuando se publique una corrección.

Autor: **Yerick Mondragón Sancho**. Trabajo en `feature/yerick-mondragon-sancho`, organizado en commits locales de configuración, integración Stellar, animaciones, interfaz y documentación/pruebas. Pendiente de revisión antes de hacer push o abrir un Pull Request.
