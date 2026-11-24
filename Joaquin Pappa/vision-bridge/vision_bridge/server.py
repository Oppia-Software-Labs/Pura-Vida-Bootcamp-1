"""Bridge local entre chess-vision (cámara) y la app web.

Lanza scripts/record_game.py del submódulo, sigue su log JSONL y manda el
estado de la partida por WebSocket. Al terminar manda el PGN final. Nunca
firma nada: la firma on-chain la hace Freighter en el navegador.

Protocolo (JSON):
  cliente → bridge  {"cmd": "start", "white", "black", "selectCorners"?, "autoCorners"?}
                    {"cmd": "start", "source": "browser", "white", "black", "corners"?}
                    <binario JPEG>  (modo browser: un frame; mandar el siguiente al recibir "frame")
                    {"cmd": "corners", "corners": [[x,y]×4 normalizados a1,a8,h8,h1] | null}
                    {"cmd": "stop"}
  bridge → cliente  {"type": "status", "running", "mode"}
                    {"type": "state", "fen", "moves"}
                    {"type": "log", "line"}
                    {"type": "end", "pgn", "hash", "result"} | {"type": "end", "pgn": null, "reason"}
                    {"type": "error", "message"}
                    {"type": "frame", "ms", "hand", "warming", "needCorners", "corners"}  (modo browser)
"""

from __future__ import annotations

import argparse
import asyncio
import json
import os
import re
import signal
import sys
import tempfile
import time
from pathlib import Path

import chess.pgn
from websockets.asyncio.server import ServerConnection, broadcast, serve

from .canonical import pgn_hash
from .live import LiveGame

ROOT = Path(__file__).resolve().parent.parent
VISION_DIR = Path(os.environ.get("VISION_DIR", ROOT.parent / "vision")).resolve()
VISION_PYTHON = os.environ.get("VISION_PYTHON", str(VISION_DIR / ".venv" / "bin" / "python"))
# Por defecto: cualquier página servida desde localhost (Vite puede cambiar de puerto).
LOCAL_ORIGIN = re.compile(r"http://(localhost|127\.0\.0\.1)(:\d+)?")
STOP_GRACE_S = 15


def clean_name(raw: object, fallback: str) -> str:
    # record_game.py usa los nombres en el nombre de archivo: solo caracteres seguros.
    name = re.sub(r"[^\w .-]", "", str(raw or ""), flags=re.UNICODE).strip()[:40]
    return name or fallback


def result_of(pgn: str) -> str:
    m = re.search(r'\[Result "([^"]+)"\]', pgn)
    return m.group(1) if m else "*"


class Bridge:
    def __init__(self, replay: Path | None, replay_delay: float) -> None:
        self.clients: set[ServerConnection] = set()
        self.replay = replay
        self.replay_delay = replay_delay
        self.task: asyncio.Task | None = None
        self.proc: asyncio.subprocess.Process | None = None
        self.session = None  # FrameSession (modo browser)
        self.session_ws: ServerConnection | None = None
        self.busy = False

    @property
    def running(self) -> bool:
        return self.session is not None or (self.task is not None and not self.task.done())

    @property
    def mode(self) -> str:
        if self.session is not None:
            return "browser"
        return "replay" if self.replay else "camera"

    def send(self, msg: dict) -> None:
        broadcast(self.clients, json.dumps(msg))

    def status(self) -> dict:
        return {"type": "status", "running": self.running, "mode": self.mode}

    async def handler(self, ws: ServerConnection) -> None:
        self.clients.add(ws)
        try:
            await ws.send(json.dumps(self.status()))
            async for raw in ws:
                if isinstance(raw, bytes):
                    await self.on_frame(ws, raw)
                    continue
                try:
                    msg = json.loads(raw)
                except json.JSONDecodeError:
                    continue
                cmd = msg.get("cmd")
                if cmd == "start" and msg.get("source") == "browser":
                    self.start_browser(ws, msg)
                elif cmd == "start":
                    self.start(msg)
                elif cmd == "corners" and self.session is not None:
                    pts = msg.get("corners")
                    if self.session.size is None:
                        self.session.corners_norm = pts
                    elif pts:
                        self.session.set_corners_norm(pts)
                    else:
                        self.session.corners = None  # re-autodetectar en el próximo frame
                        self.session.corners_norm = None
                elif cmd == "stop":
                    await self.stop()
        finally:
            self.clients.discard(ws)
            if ws is self.session_ws:  # se cerró la pestaña: cerrar la sesión
                self.end_browser()

    # ── modo browser: la app manda frames ─────────────────────────
    def start_browser(self, ws: ServerConnection, msg: dict) -> None:
        if self.running:
            self.send({"type": "error", "message": "Ya hay una sesión de cámara en curso."})
            return
        from .frames import MODEL_PATH, FrameSession
        if not MODEL_PATH.exists():
            self.send({"type": "error", "message": f"No existe el modelo {MODEL_PATH}."})
            return
        try:
            self.session = FrameSession(clean_name(msg.get("white"), "White"), clean_name(msg.get("black"), "Black"),
                                        corners_norm=msg.get("corners") or None)
        except Exception as e:  # p. ej. faltan onnxruntime/opencv
            self.send({"type": "error", "message": f"No se pudo cargar chess-vision: {e}"})
            return
        self.session_ws = ws
        self.send(self.status())
        self.send(self.session.snapshot())

    async def on_frame(self, ws: ServerConnection, data: bytes) -> None:
        s = self.session
        if s is None or ws is not self.session_ws or self.busy:
            return
        self.busy = True
        t0 = time.perf_counter()
        try:
            from .frames import decode_jpeg
            frame = decode_jpeg(data)
            if frame is None:
                return
            info = await asyncio.to_thread(s.process, frame)
        except Exception as e:
            self.send({"type": "log", "line": f"frame error: {e}"})
            info = {"changed": False}
        finally:
            self.busy = False
        if self.session is not s:
            return  # terminó mientras procesaba
        if info.get("changed"):
            self.send(s.snapshot())
        await ws.send(json.dumps({"type": "frame", "ms": round((time.perf_counter() - t0) * 1000),
                                  **{k: info.get(k) for k in ("hand", "warming", "needCorners", "corners")}}))

    def end_browser(self) -> None:
        s, self.session, self.session_ws = self.session, None, None
        if s is None:
            return
        pgn = s.finish_pgn()
        if pgn:
            self.finish(pgn)
        else:
            self.send({"type": "end", "pgn": None, "reason": "Sin jugadas registradas."})
        self.send(self.status())

    def start(self, msg: dict) -> None:
        if self.running:
            self.send({"type": "error", "message": "Ya hay una sesión de cámara en curso."})
            return
        white = clean_name(msg.get("white"), "White")
        black = clean_name(msg.get("black"), "Black")
        if self.replay:
            self.task = asyncio.create_task(self.run_replay(white, black))
        else:
            self.task = asyncio.create_task(
                self.run_camera(white, black, bool(msg.get("selectCorners")), bool(msg.get("autoCorners")))
            )
        self.task.add_done_callback(lambda _t: self.send(self.status()))
        self.send({"type": "status", "running": True, "mode": "replay" if self.replay else "camera"})

    async def stop(self) -> None:
        if self.session is not None:
            self.end_browser()
            return
        if self.replay and self.task and not self.task.done():
            self.task.cancel()
            return
        if self.proc and self.proc.returncode is None:
            # SIGINT → KeyboardInterrupt en record_game.py → guarda el PGN en su finally.
            self.proc.send_signal(signal.SIGINT)

    # ── cámara real ────────────────────────────────────────────────
    async def run_camera(self, white: str, black: str, select_corners: bool, auto_corners: bool) -> None:
        if not Path(VISION_PYTHON).exists():
            self.send({"type": "error", "message": f"No existe {VISION_PYTHON}. Instalá chess-vision (ver README del bridge)."})
            return
        out_dir = Path(tempfile.mkdtemp(prefix="vision-bridge-"))
        out_pgn = out_dir / "game.pgn"
        args = [VISION_PYTHON, "scripts/record_game.py", "--white", white, "--black", black, "--output", str(out_pgn)]
        if select_corners:
            args.append("--select-corners")
        if auto_corners:
            args.append("--auto-corners")

        started = time.time()
        self.proc = await asyncio.create_subprocess_exec(
            *args, cwd=VISION_DIR, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.STDOUT,
            env={**os.environ, "PYTHONUNBUFFERED": "1"},
        )
        live = LiveGame()
        self.send(live.snapshot())
        tail = asyncio.create_task(self.tail_events(started, live))
        try:
            assert self.proc.stdout is not None
            async for line in self.proc.stdout:
                text = line.decode(errors="replace").rstrip()
                if text:
                    self.send({"type": "log", "line": text})
            await self.proc.wait()
        finally:
            if self.proc.returncode is None:  # bridge cancelado: no dejar el proceso huérfano
                self.proc.send_signal(signal.SIGINT)
                try:
                    await asyncio.wait_for(self.proc.wait(), STOP_GRACE_S)
                except TimeoutError:
                    self.proc.kill()
            await asyncio.sleep(0.5)  # deja que tail lea las últimas líneas
            tail.cancel()

        if out_pgn.exists():
            self.finish(out_pgn.read_text())
        else:
            self.send({"type": "end", "pgn": None, "reason": f"Sin jugadas registradas (exit {self.proc.returncode})."})

    async def tail_events(self, started: float, live: LiveGame) -> None:
        games = VISION_DIR / "games"
        log_path: Path | None = None
        while log_path is None:  # record_game crea el log después de abrir la cámara
            await asyncio.sleep(0.3)
            fresh = [p for p in games.glob("*_debug.jsonl") if p.stat().st_mtime >= started - 1]
            if fresh:
                log_path = max(fresh, key=lambda p: p.stat().st_mtime)
        with open(log_path) as fh:
            buf = ""
            while True:
                chunk = fh.readline()
                if not chunk:
                    await asyncio.sleep(0.1)
                    continue
                buf += chunk
                if not buf.endswith("\n"):
                    continue  # línea a medio escribir
                line, buf = buf, ""
                self.on_event(line, live)

    def on_event(self, line: str, live: LiveGame) -> None:
        try:
            event = json.loads(line)
        except json.JSONDecodeError:
            return
        out = live.apply(event)
        if out:
            self.send(out)

    # ── replay (desarrollo sin cámara) ─────────────────────────────
    async def run_replay(self, white: str, black: str) -> None:
        assert self.replay is not None
        live = LiveGame()
        self.send(live.snapshot())
        try:
            for line in self.replay.read_text().splitlines():
                event = json.loads(line) if line.strip() else {}
                out = live.apply(event)
                if out:
                    self.send(out)
                    await asyncio.sleep(self.replay_delay)
        except asyncio.CancelledError:
            pass
        if not live.sans:
            self.send({"type": "end", "pgn": None, "reason": "El replay no tiene jugadas."})
            return
        b = live.board
        result = b.result() if b.is_game_over() else "*"
        game = chess.pgn.Game.from_board(b)
        game.headers.update({"White": white, "Black": black, "Result": result})
        self.finish(str(game))

    def finish(self, pgn: str) -> None:
        try:
            digest = pgn_hash(pgn)
        except ValueError as e:
            self.send({"type": "end", "pgn": pgn, "hash": None, "result": result_of(pgn), "error": str(e)})
            return
        self.send({"type": "end", "pgn": pgn, "hash": digest, "result": result_of(pgn)})


async def main_async(args: argparse.Namespace) -> None:
    env = os.environ.get("BRIDGE_ORIGINS")
    # Siempre localhost (dev) + los extra de BRIDGE_ORIGINS (p. ej. el frontend desplegado).
    origins: list = [LOCAL_ORIGIN, *(o.strip() for o in (env or "").split(",") if o.strip())]
    bridge = Bridge(args.replay, args.replay_delay)
    # Solo localhost y solo orígenes de la app: una web cualquiera no puede prender la cámara.
    # En Docker hay que escuchar en 0.0.0.0 dentro del contenedor; compose publica solo en 127.0.0.1.
    host = os.environ.get("BRIDGE_HOST", "127.0.0.1")
    async with serve(bridge.handler, host, args.port, origins=[*origins, None], max_size=4 * 2**20) as server:
        mode = f"replay {args.replay}" if args.replay else f"cámara ({VISION_DIR}) + frames del navegador"
        print(f"vision-bridge en ws://{host}:{args.port} · {mode} · orígenes {origins}", flush=True)
        await server.serve_forever()


def main() -> None:
    p = argparse.ArgumentParser(description="Bridge cámara (chess-vision) ↔ Chess Ledger")
    p.add_argument("--port", type=int, default=8765)
    p.add_argument("--replay", type=Path, help="JSONL de chess-vision para simular una partida sin cámara")
    p.add_argument("--replay-delay", type=float, default=0.8, help="segundos entre jugadas en replay")
    args = p.parse_args()
    try:
        asyncio.run(main_async(args))
    except KeyboardInterrupt:
        sys.exit(0)


if __name__ == "__main__":
    main()
