# Chess Registry (Stellar Soroban)

Registro de partidas de ajedrez on-chain. Permite demostrar que una partida existía en un momento dado, tal como fue registrada, sin depender de la planilla de papel.

Autor: Joaquin Pappa

## Problema

Las planillas de ajedrez en papel se pueden alterar: se pueden reescribir jugadas después de la partida, cambiar un resultado o reemplazar una hoja entera. Nadie puede verificar después si la planilla es la original.

## Solución

- Se toma la lista de jugadas en notación SAN (por ejemplo `e4 e5 Nf3 Nc6 ...`), unidas por espacio, y se calcula su hash **SHA-256**.
- Ese hash, junto con el resultado, se guarda en un **contrato Soroban de escritura única**: una vez registrado, no se puede sobrescribir.
- Los headers PGN (`[Event ...]`, `[White ...]`, fechas, etc.) no afectan el hash, así que se pueden corregir o completar sin cambiar la verificación.
- Para verificar, se pega el PGN en la app: se extraen las jugadas, se recalcula el hash y se busca en el contrato. Si coincide, la secuencia de jugadas existía registrada en ese momento.

## Arquitectura

- **`contract/`**: contrato Soroban en Rust (`contracts/chess-registry`). Guarda el hash de cada partida, impide duplicados y expone `register_game`, `register_attested_game` (con oráculo), `get_game`, `games_by` y la administración de atestadores. Incluye tests.
- **`packages/chess_registry/`**: bindings TypeScript generados a partir del contrato, usados por la app.
- **`app/`**: frontend con Vite + React + TypeScript. Conecta billetera con Freighter, parsea PGN con chess.js, registra partidas, verifica una partida pegando su PGN y muestra el historial.
- **`vision/`**: submódulo [chess-vision](https://github.com/samegardner/chess-vision). Lee un tablero físico con una cámara cenital y genera el PGN.
- **`vision-bridge/`**: puente local en Python. Corre chess-vision, manda la partida en vivo a la tab **Cámara** y entrega el PGN para revisar y registrar. Ver `vision-bridge/README.md`.

## Oráculo / atestador (exploración)

Además del registro simple, el contrato soporta un **registro atestado**: `register_attested_game` exige, además de la firma del usuario, la firma ed25519 de un **atestador** (oráculo) que el admin habilitó. El atestador da fe de "esta partida, con este resultado, para esta cuenta". Detalle del protocolo en `contract/README.md`.

Lo que ya está implementado:

- Contrato: admin, lista de atestadores (`add_attester` / `remove_attester`) y verificación de la firma on-chain.
- La firma queda atada al contrato, al registrar y al resultado: no se puede reusar en otro deploy, robar desde la mempool ni cambiar el resultado.
- Firmador de referencia en Python (`vision-bridge/vision_bridge/attest.py`), con un test que comprueba que genera exactamente el mismo mensaje que verifica el contrato.

### Constraint importante: el oráculo vale lo que vale su fuente

Firmar no vuelve verdadero un dato. Hoy el firmador corre **en la máquina del usuario**, junto al bridge de la cámara. Así, la atestación **no agrega confianza real**: quien controla la máquina controla la clave y los frames que entran. Por ahora es una prueba del protocolo, no una garantía.

| Dónde vive el atestador | Qué prueba su firma |
|---|---|
| Máquina del usuario (hoy) | Nada más allá de la firma del usuario |
| Backend independiente, cámara del usuario | "Recibí esta partida en este momento" (los frames igual se pueden falsear) |
| Backend independiente + cámara del torneo, o API de Lichess/Chess.com | "Una fuente oficial vio esta partida" |

### Próximos pasos

La idea es explorar cómo se arma un oráculo real; la complejidad no es el objetivo.

1. **Backend aparte en Render**: mover el firmador a un servicio con un endpoint `/attest` que reciba el PGN o los frames, valide las jugadas con python-chess, calcule el hash canónico y devuelva `{attester, signature}`. La app lo pasa a `register_attested_game`.
2. **KMS para la clave**: la clave ed25519 no vive en el código ni en el disco. Primero un secret de Render; después un KMS o HSM (AWS KMS, GCP KMS o Vault) que firme sin exponer la clave privada.
3. **Protocolos para que el oráculo no se convierta en un punto único de falla**:
   - **Rotación y revocación** de claves (ya soportado por `add_attester` / `remove_attester`) y rotación del admin (`set_admin`).
   - **Expiración y nonce** en el mensaje firmado, para que una atestación vieja no se pueda usar indefinidamente.
   - **Umbral M-de-N**: exigir firmas de varios atestadores independientes (por ejemplo, backend + árbitro).
   - **Atestación en vivo**: hashes incrementales firmados durante la partida, para probar que no se escribió después.
   - **Fuentes autoritativas**: cámara controlada por el organizador o importación desde Lichess/Chess.com.
4. **Frontend**: tab o toggle "registro atestado" que llame al backend y muestre en la verificación si la partida tiene atestación y si el atestador sigue habilitado.

## Contract ID (testnet)

| Versión | Contract ID | |
|---|---|---|
| Con oráculo / atestador (la que usa la app) | `CBX75GYJ365XIGF5IMKIQOM6CNGWYMZWSMHNMYCSU4DRLXJP3AG7QIZU` | [Stellar Expert](https://stellar.expert/explorer/testnet/contract/CBX75GYJ365XIGF5IMKIQOM6CNGWYMZWSMHNMYCSU4DRLXJP3AG7QIZU) |
| Anterior, sin oráculo (solo historial) | `CANUKO2PJWIW7WMVEBV7CDETZI2HCPVA7LIGKFBY73LJZZLAKW7Q2QW3` | [Stellar Expert](https://stellar.expert/explorer/testnet/contract/CANUKO2PJWIW7WMVEBV7CDETZI2HCPVA7LIGKFBY73LJZZLAKW7Q2QW3) |

Las partidas registradas en el contrato anterior siguen on-chain, pero la app ya no las muestra.

## Cómo correr

Requisitos: Rust con target `wasm32v1-none`, Stellar CLI, Node.js y npm, y la extensión Freighter.

1. Contrato y tests:
   ```bash
   cd "Joaquin Pappa/contract" && cargo test && stellar contract build
   ```
2. Deploy en testnet (desde la carpeta `contract`, con una cuenta fondeada; `--admin` es la cuenta que gestiona los atestadores):
   ```bash
   stellar contract deploy --wasm target/wasm32v1-none/release/chess_registry.wasm --source <tu-cuenta> --network testnet -- --admin <G...admin>
   ```
   Si se despliega un contrato nuevo, actualizar el Contract ID en `packages/chess_registry/src/index.ts` y recompilar los bindings (`app/src/lib/config.ts` lo lee de ahí).
3. Bindings TypeScript:
   ```bash
   cd "Joaquin Pappa/packages/chess_registry" && npm install && npm run build
   ```
4. App:
   ```bash
   cd "Joaquin Pappa/app" && npm install && npm run dev
   ```
5. En el navegador, abrir Freighter, cambiar a **Testnet** y usar una cuenta fondeada (friendbot) para firmar los registros.

## Limitaciones

- **Quien registra primero gana**: cualquiera puede registrar un hash antes que el autor. El registro no prueba autoría, solo que la secuencia de jugadas existía en un momento dado.
- **Entradas persistentes con TTL**: los registros tienen un TTL de ~29 días y se extienden al escribir. Si expiran, pueden restaurarse.
- **Firma de una sola parte**: solo firma quien registra la partida; el otro jugador no confirma el registro.
- **Alcance del hash**: solo cubre las jugadas SAN desde la posición inicial. Un PGN con header FEN se rechaza.
- **Nombres sin límite**: el contrato actual no limita la longitud de los nombres.
- **Atestador de confianza única**: hoy alcanza una sola clave para atestar y no tiene expiración. Si se filtra, se pueden atestar partidas falsas hasta que el admin la revoque. Revocarla no borra las atestaciones anteriores: el verificador tiene que chequear `is_attester`. Ver "Oráculo / atestador".
- **Dos contratos en testnet**: la app usa la versión con atestador. El historial del contrato anterior no se migró (los registros son de escritura única y con timestamp original).

## RAVEN_LOG

A completar por el autor: mínimo 3 consultas a Stellar Raven y para qué sirvió cada una.

- (vacío)

## Mejoras futuras

- Multi-firma: que ambos jugadores firmen el registro.
- Torneos y árbitros: registro validado por un árbitro o por el organizador del torneo.
- Hash por jugada: registrar hashes incrementales para verificar partidas parciales.
- ELO: calcular y registrar ratings on-chain a partir de partidas verificadas.
