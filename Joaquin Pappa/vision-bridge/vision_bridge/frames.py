"""Modo navegador: la cámara la abre la app (getUserMedia) y manda frames JPEG.

Porta el loop de chess-vision/scripts/record_game.py a "recibo un frame →
actualizo estado": warmup del EMA, detección de mano, undo/rescue y
MoveDetectorV2. Así el modelo corre en la PC local (o en Docker, que en macOS
no tiene acceso a la cámara USB) y la app solo transporta imágenes.
"""

from __future__ import annotations

import os
import sys
import time
from pathlib import Path

import chess
import chess.pgn
import numpy as np

VISION_DIR = Path(os.environ.get("VISION_DIR", Path(__file__).resolve().parent.parent.parent / "vision")).resolve()
if str(VISION_DIR) not in sys.path:
    sys.path.insert(0, str(VISION_DIR))

MODEL_PATH = VISION_DIR / "models" / "chesscam_pieces.onnx"
XCORNERS_MODEL_PATH = VISION_DIR / "models" / "chesscam_xcorners.onnx"

WARMUP_FRAMES = 6          # menos que record_game (30): el navegador manda menos FPS
UNDO_CHECK_DELAY = 0.5
UNDO_MAX_WINDOW = 3.0
HAND_TRIGGER_DELAY = 0.15
HAND_RATIO_THRESHOLD = 0.5


class Models:
    """Carga perezosa: los ONNX se cargan una vez por proceso."""

    _pieces = None
    _xcorners = None

    @classmethod
    def pieces(cls, ema: float):
        from chess_vision.inference.yolo_detect import YoloPieceDetector
        if cls._pieces is None:
            cls._pieces = YoloPieceDetector(str(MODEL_PATH), ema_decay=ema)
        return cls._pieces

    @classmethod
    def xcorners(cls):
        from chess_vision.board.auto_corners import XCornerDetector
        if cls._xcorners is None and XCORNERS_MODEL_PATH.exists():
            cls._xcorners = XCornerDetector(str(XCORNERS_MODEL_PATH))
        return cls._xcorners


def decode_jpeg(data: bytes) -> np.ndarray | None:
    import cv2
    arr = np.frombuffer(data, dtype=np.uint8)
    return cv2.imdecode(arr, cv2.IMREAD_COLOR)


YOLO_CLASSES = "bknpqrBKNPQR"  # orden de columnas del state (chess_vision.inference.yolo_detect)


def fold_colors(state: np.ndarray, board: chess.Board) -> np.ndarray:
    """En casillas vacías del tablero lógico solo puede aparecer una pieza del
    bando que mueve, así que sumamos la confianza del mismo tipo del otro color.
    El modelo confunde mucho las piezas claras (madera) con negras; sin esto
    e2-e4 puntúa igual que cualquier jugada y nunca supera SCORE_MARGIN."""
    s = state.copy()
    empty = [sq for sq in chess.SQUARES if board.piece_at(sq) is None]
    if not empty:
        return s
    for t in "pnbrqk":
        own, opp = (t.upper(), t) if board.turn == chess.WHITE else (t, t.upper())
        i, j = YOLO_CLASSES.index(own), YOLO_CLASSES.index(opp)
        s[empty, i] = np.maximum(s[empty, i], s[empty, j])
    return s


class FrameSession:
    def __init__(self, white: str, black: str, corners_norm: list | None = None,
                 ema: float = 0.4, greedy_delay: float = 1.0) -> None:
        from chess_vision.game.move_scorer import MoveDetectorV2
        self.white, self.black = white, black
        self.corners_norm = corners_norm
        self.greedy_delay = greedy_delay
        self.detector = Models.pieces(ema)
        self.detector.state = np.zeros((64, 12), dtype=np.float32)
        self.detector.initialized = False
        self.corners: np.ndarray | None = None
        self.square_centers = self.crop_region = self.board_quad = None
        self.board = chess.Board()
        self.moves: list[chess.Move] = []
        self.sans: list[str] = []
        self.move_data: list = []
        self.move_detector = MoveDetectorV2(greedy_delay=greedy_delay)
        self.frames = 0
        self.pending = False
        self.last_fire = 0.0
        self.hand_low_start: float | None = None
        self.hand = False
        self.size: tuple[int, int] | None = None
        self.orient_pending = False

    # ── esquinas ───────────────────────────────────────────────────
    def set_corners(self, corners_px: np.ndarray) -> None:
        from chess_vision.inference.yolo_detect import (
            compute_board_quad, compute_crop_region, compute_square_centers,
        )
        assert self.size is not None
        w, h = self.size
        self.corners = corners_px.astype(np.float32)
        self.square_centers = compute_square_centers(self.corners, (h, w, 3))
        self.crop_region = compute_crop_region(self.corners)
        self.board_quad = compute_board_quad(self.corners)
        self.detector.state = np.zeros((64, 12), dtype=np.float32)
        self.detector.initialized = False
        self.frames = 0
        self.hand_low_start = None

    def set_corners_norm(self, pts: list) -> None:
        assert self.size is not None
        w, h = self.size
        self.set_corners(np.array([[float(x) * w, float(y) * h] for x, y in pts], dtype=np.float32))
        self.corners_norm = pts
        # Esquinas a mano: el orden de los clicks suele estar mal (a8 donde va h1).
        # Antes de la primera jugada lo corregimos con la posición inicial.
        self.orient_pending = not self.sans

    def _fix_orientation(self, frame: np.ndarray) -> None:
        """Elige cuál esquina es a1/a8/h8/h1 según dónde están las piezas iniciales."""
        from chess_vision.board.auto_corners import _all_orientations, _score_orientation
        assert self.corners is not None and self.size is not None
        pts = self.corners
        c = pts.mean(axis=0)  # ordenar en ciclo por ángulo: tolera clicks en zigzag
        ring = pts[np.argsort(np.arctan2(pts[:, 1] - c[1], pts[:, 0] - c[0]))]
        dets = self.detector.detect_raw(frame)
        scored = sorted(
            ((_score_orientation(np.array(o, dtype=np.float32), dets, frame.shape), np.array(o, dtype=np.float32))
             for o in _all_orientations(*ring)),
            key=lambda t: -t[0],
        )
        if len(scored) < 2 or scored[0][0] - scored[1][0] < 0.5:
            return  # empate: no hay piezas suficientes para decidir; reintentar el próximo frame
        self.orient_pending = False
        best = scored[0][1]
        if not np.allclose(best, pts):
            self.set_corners(best)
            w, h = self.size
            self.corners_norm = [[float(x) / w, float(y) / h] for x, y in best]

    def auto_corners(self, frame: np.ndarray) -> bool:
        from chess_vision.board.auto_corners import auto_detect_corners
        xdet = Models.xcorners()
        if xdet is None:
            return False
        dets = self.detector.detect_raw(frame)
        found = auto_detect_corners(dets, xdet, frame, existing_corners=self.corners)
        if found is None:
            return False
        self.set_corners(found)
        w, h = self.size  # type: ignore[misc]
        self.corners_norm = [[float(x) / w, float(y) / h] for x, y in found]
        return True

    # ── frame ──────────────────────────────────────────────────────
    def process(self, frame: np.ndarray) -> dict:
        """Procesa un frame. Devuelve info para la app (esquinas, mano, cambió el tablero)."""
        from chess_vision.game.move_scorer import calculate_score, get_move_data, should_undo, MoveDetectorV2

        h, w = frame.shape[:2]
        if self.size != (w, h):
            self.size = (w, h)
            if self.corners_norm:
                self.set_corners_norm(self.corners_norm)
            else:
                self.corners = None
        if self.corners is None and not self.auto_corners(frame):
            return {"changed": False, "needCorners": True}
        if self.orient_pending and not self.sans:
            self._fix_orientation(frame)

        before = len(self.sans), tuple(self.sans[-1:])
        dets = self.detector.detect_raw(frame, crop_region=self.crop_region)
        update = self.detector.detections_to_board(dets, self.square_centers, self.board_quad)
        self.frames += 1

        if self.frames <= WARMUP_FRAMES:
            self.detector.update_state(update)
            return self._info(before, warming=True)

        expected = len(self.board.piece_map())
        detected = int(np.sum(np.max(update, axis=1) > 0.3))
        now = time.monotonic()
        if detected < expected * HAND_RATIO_THRESHOLD:
            if self.hand_low_start is None:
                self.hand_low_start = now
            self.hand = (now - self.hand_low_start) >= HAND_TRIGGER_DELAY
        else:
            self.hand_low_start = None
            self.hand = False

        if self.hand or self.board.is_game_over():
            return self._info(before)
        self.detector.update_state(update)
        state = self.detector.state
        if os.environ.get("BRIDGE_DEBUG") and self.frames % 15 == 0:
            self._debug_dump(frame, update, state, detected, expected)

        if self.pending and now - self.last_fire >= UNDO_CHECK_DELAY:
            last = self.move_data[-1]
            prev = self.board.copy(stack=True)
            prev.pop()
            if should_undo(fold_colors(state, prev), last):
                now_state = fold_colors(state, self.board)
                scored = sorted(
                    ((calculate_score(now_state, d), d) for d in (get_move_data(self.board, m) for m in self.board.legal_moves)),
                    key=lambda t: -t[0],
                )
                best = scored[0] if scored else None
                second = scored[1][0] if len(scored) > 1 else float("-inf")
                if best and best[0] >= MoveDetectorV2.MIN_SCORE and best[0] - second >= MoveDetectorV2.SCORE_MARGIN:
                    self._push(self.board.parse_san(best[1].san), best[1].san, best[1])  # rescue
                else:
                    self._pop()
                    self.pending = False
                    self.move_detector.mark_undone(last.san)
                return self._info(before)
            if now - self.last_fire >= UNDO_MAX_WINDOW:
                self.pending = False

        san = self.move_detector.detect_move(self.board, fold_colors(state, self.board))
        if san:
            try:
                move = self.board.parse_san(san)
            except ValueError:
                return self._info(before)
            self._push(move, san, get_move_data(self.board, move))
            self.pending = True
        return self._info(before)

    def _debug_dump(self, frame, update, state, detected, expected) -> None:
        import json
        import cv2
        classes = YOLO_CLASSES
        img = frame.copy()
        for i, (x, y) in enumerate(self.square_centers):
            k = int(np.argmax(state[i])); p = float(state[i][k])
            label = f"{chess.square_name(i)}" + (f":{classes[k]}{p:.1f}" if p > 0.3 else "")
            cv2.circle(img, (int(x), int(y)), 3, (0, 0, 255), -1)
            cv2.putText(img, label, (int(x) - 20, int(y) - 4), cv2.FONT_HERSHEY_SIMPLEX, 0.35, (0, 0, 255), 1)
        cv2.imwrite("/tmp/dbg.jpg", img)
        with open("/tmp/dbg.json", "w") as f:
            json.dump({"corners": self.corners.tolist(), "size": self.size, "detected": detected, "expected": expected,
                       "argmax": [[chess.square_name(i), int(np.argmax(state[i])), round(float(np.max(state[i])), 2)]
                                  for i in range(64) if np.max(state[i]) > 0.3]}, f)

    def _push(self, move: chess.Move, san: str, data) -> None:
        self.board.push(move)
        self.moves.append(move)
        self.sans.append(san)
        self.move_data.append(data)
        self.last_fire = time.monotonic()

    def _pop(self) -> None:
        if self.sans:
            self.board.pop()
            self.moves.pop()
            self.sans.pop()
            self.move_data.pop()

    def _info(self, before: tuple, warming: bool = False) -> dict:
        return {
            "changed": (len(self.sans), tuple(self.sans[-1:])) != before,
            "warming": warming,
            "hand": self.hand,
            "corners": self.corners_norm,
        }

    def snapshot(self) -> dict:
        return {"type": "state", "fen": self.board.fen(), "moves": list(self.sans)}

    def finish_pgn(self) -> str | None:
        # Una jugada sin confirmar al terminar suele ser la mano yendo al botón.
        if self.pending:
            self._pop()
            self.pending = False
        if not self.sans:
            return None
        b = self.board
        result = ("0-1" if b.turn == chess.WHITE else "1-0") if b.is_checkmate() else ("1/2-1/2" if b.is_game_over() else "*")
        game = chess.pgn.Game.from_board(b)
        game.headers.update({"White": self.white, "Black": self.black, "Result": result})
        return str(game)
