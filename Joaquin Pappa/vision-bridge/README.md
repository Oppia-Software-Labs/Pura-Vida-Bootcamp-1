# vision-bridge

Puente local entre [chess-vision](https://github.com/samegardner/chess-vision) (submódulo en `../vision`) y la app Chess Ledger.

```
cámara ─► chess-vision (record_game.py) ─► log JSONL ─► vision-bridge ─WS─► app (tab Cámara) ─► Freighter ─► Soroban
```

- Lanza `scripts/record_game.py`, sigue su log de eventos y manda el tablero en vivo a la app por WebSocket (`ws://127.0.0.1:8765`).
- Al terminar manda el PGN final y su hash. La app lo muestra para **revisión humana** antes de firmar: el registro on-chain es de escritura única y la visión puede equivocarse.
- El bridge **no firma transacciones**: la firma la hace Freighter en el navegador.
- `vision_bridge/attest.py` es el **firmador de referencia del oráculo** (atestaciones ed25519 para `register_attested_game`). Es experimental: corriendo local no agrega confianza. Más adelante va a vivir en un backend aparte (Render) con la clave en un KMS. Ver "Oráculo / atestador" en el README principal.
  ```bash
  .venv/bin/pip install -e '.[attest]'
  ATTESTER_SECRET=S... .venv/bin/python -m vision_bridge.attest --contract C... --registrar G... --pgn partida.pgn --result 0
  ```
- Solo escucha en `127.0.0.1` y solo acepta conexiones de páginas `http://localhost:*` (configurable con `BRIDGE_ORIGINS`).

## Modo navegador + Docker (recomendado)

La app abre la cámara con `getUserMedia` (elegís cuál en la tab **Cámara**), muestra el video en vivo y manda frames JPEG al bridge. El bridge corre el modelo (ONNX, sin torch) y devuelve el tablero jugada a jugada. Docker en macOS no ve cámaras USB, por eso la captura la hace el navegador.

```
cámara ─► navegador (video en vivo) ─frames WS─► Docker: vision-bridge + chess-vision ─jugadas─► navegador
```

```bash
# desde "Joaquin Pappa/"
docker compose -f vision-bridge/docker-compose.yml up -d --build
```

- Frontend desplegado: https://chess-ledger-psi.vercel.app → tab **Cámara**. Está autorizado en `vision-bridge/.env` (`BRIDGE_ORIGINS`).
- Usá **Chrome**: la primera vez pide permiso de cámara y de "acceder a dispositivos de la red local" (la página es HTTPS y el modelo está en `127.0.0.1`). Aceptá los dos.
- Esquinas: se auto-detectan con las piezas en posición inicial. Si falla, **Marcar esquinas** y clickeá a1, a8, h8, h1 sobre el video.
- El puerto se publica solo en `127.0.0.1`: nadie de tu red puede conectarse.

## Instalación (modo cámara nativa, sin Docker)

```bash
# 1. chess-vision (pesado: torch, opencv, onnx)
git submodule update --init
cd "Joaquin Pappa/vision" && python3 -m venv .venv && .venv/bin/pip install -e . && cd ..

# 2. bridge (liviano: python-chess, websockets)
cd vision-bridge && python3 -m venv .venv && .venv/bin/pip install -e '.[dev]'
```

## Uso

```bash
# con cámara
.venv/bin/vision-bridge

# sin cámara: reproduce un log grabado (útil para desarrollar la app)
.venv/bin/vision-bridge --replay tests/fixtures/sample_game.jsonl
```

Después `npm run dev` en `../app`, abrir la tab **Cámara**, poner nombres e **Iniciar**.
La primera vez marcá "Marcar esquinas": se abre la ventana de OpenCV para clickear a1, a8, h8, h1.
**Terminar** manda SIGINT a record_game, que guarda el PGN.

| Variable | Default |
|---|---|
| `VISION_DIR` | `../vision` |
| `VISION_PYTHON` | `$VISION_DIR/.venv/bin/python` |
| `BRIDGE_ORIGINS` | cualquier `http://localhost:*` / `http://127.0.0.1:*` |
| `VITE_VISION_BRIDGE_URL` (app) | `ws://127.0.0.1:8765` |

## Tests

```bash
.venv/bin/python -m pytest
```

`test_canonical.py` compara el hash de Python con el de `app/src/lib/pgn.ts` real (corre con Node ≥22.18 si `app/node_modules` existe). Si no coinciden, una partida grabada por cámara no se podría verificar en la app.

## Licencia

chess-vision es AGPL-3.0. El bridge lo ejecuta como proceso aparte en la máquina local. Si alguna vez se expone por red, revisar las obligaciones de AGPL.
