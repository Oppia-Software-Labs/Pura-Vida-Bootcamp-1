# Baula Stellar

Baula Stellar es una guía interactiva en español para practicar Stellar desde cero. Una tortuga baula recorre cuatro etapas mientras aprendés qué es una billetera, conectás Freighter, consultás tu cuenta y enviás tu primer pago de prueba en Stellar Testnet.

**Autor** · Victor Andres Villalta Alvarado (`Victor Villalta`)

**Entrega** · Pura Vida Bootcamp 1, Oppia Software Labs

## Puesta en marcha

Necesitás Node.js 22.18 o superior y npm. Para conectar y firmar usá un navegador de escritorio con la [extensión oficial de Freighter](https://www.freighter.app/).

Ejecutá estos comandos desde la raíz del repositorio:

```powershell
cd "Victor Villalta"
npm install
Copy-Item .env.example .env.local
npm run dev
```

`.env.example` y la configuración por defecto ya incluyen una cuenta destino fondeada en Testnet (`GB6UCXBV743SOFAVSCUQEJME2COUQEBRYJZRGZFW6CW3PL6TYQGJXWLY`). Si Testnet se reinicia y querés crear y fondear una nueva cuenta destino con Friendbot, ejecutá:

```powershell
npm run --silent destino
```

Guardá la **dirección pública** que imprime el comando en `NEXT_PUBLIC_DESTINATION_ADDRESS`, dentro de `.env.local`, y reiniciá Next.js.

Abrí [Baula Stellar en localhost:3000](http://localhost:3000) y seleccioná **Testnet** en Freighter. Cuando llegués a **La caminata**, el botón **Fondear con Friendbot** pone XLM de prueba en tu propia cuenta si todavía no existe en la red. Podés practicar con **1 XLM de prueba** en el último nivel. El límite por pago es de **10 XLM de prueba**.

```powershell
npm run typecheck
npm run build
npm run start
```

## Variables

| Variable | Uso |
| --- | --- |
| `NEXT_PUBLIC_HORIZON_URL` | Horizon oficial de Testnet. Valor listo en `.env.example`. |
| `NEXT_PUBLIC_NETWORK_PASSPHRASE` | Identificador oficial de Testnet. Valor listo en `.env.example`. |
| `NEXT_PUBLIC_FRIENDBOT_URL` | Servicio de fondeo de práctica. Valor listo en `.env.example`. |
| `NEXT_PUBLIC_DESTINATION_ADDRESS` | Dirección pública fija en Testnet (preconfigurada o generada con `npm run --silent destino`). |
| `RAVEN_MCP_URL` | Endpoint oficial del servidor MCP de Stellar Raven (`https://raven.stellar.org/mcp`). |
| `RAVEN_MCP_BEARER_TOKEN` | Opcional. Credencial de servidor emitida por el operador de Raven, con formato `nombre:token`. |
| `LLM_API_KEY` | Opcional. Clave de OpenAI de servidor. |
| `LLM_MODEL` | Opcional. Modelo de OpenAI habilitado para Responses API. |

Las tres primeras variables admiten únicamente los valores oficiales de Testnet. Las credenciales de Raven y del modelo se configuran exclusivamente en el servidor. `.env.local` está excluido de Git.

## Asistente Stellar Raven

Durante el desarrollo utilicé **Stellar Raven** (`https://raven.stellar.org/`) como asistente de consulta sobre el ecosistema Stellar (Freighter API, Horizon Testnet, construcción y firma de transacciones XDR con `@stellar/stellar-sdk`, y manejo de errores y reservas). Además, integré un panel de asistencia **Pregúntale a Raven** dentro de la aplicación:

- El modo activo por defecto muestra **Respuestas de ayuda preparadas con contenido de Raven**, con explicaciones locales contextualizadas por nivel y enlaces a las fuentes oficiales catalogadas por Raven ([Documentación de Stellar Raven](https://raven.stellar.org/docs) · [Playground](https://raven.stellar.org/playground) · [Guía de dApps](https://github.com/stellar/stellar-dev-skill/tree/main/skills/dapp) · [Guía de Horizon](https://github.com/stellar/stellar-dev-skill/blob/main/skills/data/horizon.md)).
- `POST /api/raven` recibe `pregunta` y `nivel`. El adaptador `askRaven` selecciona el modo según la configuración. En modo en vivo (`live`), el servidor consulta las herramientas `search` y `execute` del servidor MCP de Stellar Raven (`https://raven.stellar.org/mcp`) y sintetiza la respuesta citando las fuentes oficiales; si no hay credenciales configuradas o el servidor remoto falla, responde con la base de conocimiento local (`fallback`). Antes de procesar cualquier consulta se filtran claves secretas, tokens y correos.

## Estructura

| Ruta | Contenido |
| --- | --- |
| `app/` | Bienvenida, viaje interactivo de 4 niveles y ruta de servidor `/api/raven`. |
| `components/` | Recorrido, conexión de wallet Freighter, paneles de cuenta y pago, ilustraciones SVG y chat Raven. |
| `lib/stellar/` | Configuración de Testnet, conexión de wallet, lectura de cuenta en Horizon, montos y pagos XLM. |
| `lib/raven/` | Adaptador MCP de Stellar Raven, integración de modelo, filtros de seguridad y respaldo local. |
| `content/raven-fallback/` | Preguntas frecuentes, respuestas guiadas y fuentes oficiales por nivel. |
| `scripts/create-destination.ts` | Generación y fondeo de cuenta destino en Testnet mediante Friendbot. |

Freighter conserva las claves privadas y firma el pago. Antes de firmar, la app verifica la cuenta activa y que la red seleccionada sea Testnet, y pide confirmar el aviso de Testnet. Antes de enviar, confirma que la firma y el hash corresponden al mismo pago. La comisión y la reserva se verifican en unidades exactas de Stellar (stroops). El avance y el último comprobante se guardan en el navegador.

## Verificación

- `npm run typecheck` (`tsc --noEmit`) ejecutado sin errores.
- `npm run build` (`next build`) compilado y generado exitosamente.
- 13 comprobaciones automatizadas de lógica y seguridad (validación de Testnet, conexión y firma con Freighter, fondeo con Friendbot, lectura de saldo/activos/historial en Horizon, validación de reserva y firma XDR, filtrado de secretos y adaptador MCP de Stellar Raven).
