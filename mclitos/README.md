# Órbita · mclitos en Stellar

Una app de solo lectura para conectar tu wallet Varial (antes Freighter), ver tu dirección pública y consultar tus saldos en **Stellar Testnet**. Construida para el primer reto del Pura Vida Bootcamp con apoyo de **Stellar Raven**.

## Ejecutar en local

Necesitás Node.js 22.12 o superior, npm y la extensión [Varial](https://varialwallet.com).

```bash
cd mclitos
npm ci
npm run dev
```

Abrí la URL que muestra Vite (normalmente http://127.0.0.1:5173).

1. Creá o desbloqueá tu cuenta desde la extensión. Nunca pegues tu frase de recuperación ni tu clave privada en la app.
2. En la configuración de red de Varial, elegí **Testnet**.
3. Pulsá **Conectar wallet** y aprobá compartir tu dirección pública.
4. Vas a ver la dirección completa, un enlace a Stellar Expert y los saldos que devuelve Horizon.
5. **Actualizar** vuelve a consultar la cuenta; **Desconectar** borra los datos de esta página.

Si la cuenta todavía no existe en Testnet, la app muestra cómo obtener XLM de prueba desde [Stellar Lab](https://lab.stellar.org/account/create). Después podés volver a actualizar. La app no activa ni financia cuentas automáticamente.

## Verificar

```bash
npm test
npm run build
npm run preview
```

Las pruebas usan el runner de Node y dobles del SDK y de Horizon: no requieren extensiones, claves ni cuentas reales. Cubren permisos, dirección, red, saldos exactos, cuenta sin activar, errores y desconexión con operaciones pendientes.

### Prueba manual con una wallet real

- Sin extensión, **Conectar wallet** muestra instrucciones de instalación.
- Si rechazás el permiso, aparece un mensaje y podés reintentar.
- Con la wallet en Mainnet, la app pide cambiar a Testnet.
- Con Testnet y una cuenta activada, compará dirección y saldos con Stellar Expert.
- Cambiá de cuenta o de red y pulsá **Actualizar**: debe pedir reconectar, sin mantener los saldos anteriores.
- Pulsá **Copiar** y comprobá la dirección en un editor.
- Pulsá **Desconectar**: desaparecen dirección y saldos.

Desconectar es local: no revoca el permiso concedido en la extensión. Podés revocarlo desde su configuración. La app no monitorea continuamente la wallet; comprueba cuenta y red al conectar y actualizar. Los valores corresponden a la última consulta, no a un saldo en tiempo real.

## Cómo está organizada

| Archivo | Responsabilidad |
| --- | --- |
| `src/wallet.js` | Permisos con Varial y lectura de Horizon, solo en Testnet |
| `src/dashboard.js` | Estado, conexión, actualización y descarte de respuestas pendientes al desconectar |
| `src/main.js` | Eventos y actualización segura del DOM |
| `src/style.css` | Diseño adaptable a móvil y escritorio |
| `test/wallet.test.js` | Pruebas deterministas de comportamiento |

No hay backend, almacenamiento de claves ni firmas de transacciones. Solo se envía la dirección pública al servicio público `https://horizon-testnet.stellar.org`. Los saldos conservan los siete decimales de Horizon; los activos emitidos incluyen su emisor para distinguir monedas con el mismo código. Testnet puede reiniciarse y los XLM de prueba no tienen valor monetario.

La tipografía usa Google Fonts; si no está disponible, el navegador utiliza fuentes de respaldo.

## Uso de Stellar Raven

Durante el desarrollo se consultó el MCP `https://raven.stellar.org/mcp`:

- `search`: descubrimiento de operaciones para conexión de wallets.
- `stellarDocs.search_wallet_dapp_docs`: documentación oficial sobre wallets y frontends.
- `codemode.skill.read('skills.stellar-dev.dapp', ...)`: secciones `recommended-dependencies` y `wallet-integration`.

Estas consultas fundamentaron el uso del SDK de Varial y el flujo de permiso explícito. El paquete instalado se fija en `@stellar/varial-sdk@7.0.0`; el lockfile registra las dependencias reproducibles. Raven es una herramienta de desarrollo, no un requisito para ejecutar esta app.

Referencias:
- [Guía oficial de aplicaciones frontend](https://developers.stellar.org/docs/build/guides/dapps/frontend-guide)
- [Conexión a Testnet](https://developers.stellar.org/docs/build/guides/freighter/connect-testnet)
- [SDK de Varial y repositorio de la wallet](https://github.com/stellar/freighter)
- [Horizon](https://developers.stellar.org/docs/data/apis/horizon)

## Entrega del bootcamp

La app está en `mclitos/` y la rama de trabajo es `feature/mclitos`, por elección del autor. La consigna pide nombre completo tanto en la carpeta como en la descripción del PR: confirmar ese dato antes de entregar.

La [plataforma del campamento](https://climb.oppialabs.com/e/pura-vida/camp/1?tab=tareas) también pide al menos **cinco commits propios**, un PR hacia `main` del repositorio original y pegar su enlace en la plataforma. Crear la app no completa esos pasos. No se publican cambios automáticamente.
