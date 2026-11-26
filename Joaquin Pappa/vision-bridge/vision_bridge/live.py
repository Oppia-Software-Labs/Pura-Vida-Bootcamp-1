"""Reconstruye la partida en vivo a partir del log JSONL de chess-vision.

chess-vision escribe un evento por línea. Los que cambian el tablero:
- fire:     jugada tentativa (push)
- undo:     auto-undo retira la última jugada (pop)
- rescue:   confirma la actual y empuja `pushed` (push)
- keypress: action=reset reinicia; action=quit con discarded_san retira la pendiente

El tablero en vivo es solo para mostrar. La fuente de verdad final es el PGN
que record_game.py guarda al cerrar la sesión.
"""

from __future__ import annotations

import chess


class LiveGame:
    def __init__(self) -> None:
        self.board = chess.Board()
        self.sans: list[str] = []

    def _push(self, san: str) -> bool:
        try:
            self.board.push_san(san)
        except ValueError:  # IllegalMoveError / InvalidMoveError / AmbiguousMoveError
            return False  # record_game también descarta SAN ilegales
        self.sans.append(san)
        return True

    def _pop(self) -> None:
        if self.sans:
            self.board.pop()
            self.sans.pop()

    def apply(self, event: dict) -> dict | None:
        """Aplica un evento. Devuelve el mensaje para el cliente, o None si no cambió nada."""
        kind = event.get("type")
        if kind == "fire":
            if not self._push(str(event.get("san", ""))):
                return None
        elif kind == "rescue":
            if not self._push(str(event.get("pushed", ""))):
                return None
        elif kind == "undo":
            self._pop()
        elif kind == "keypress" and event.get("action") == "reset":
            self.board.reset()
            self.sans.clear()
        elif kind == "keypress" and event.get("action") == "quit" and event.get("discarded_san"):
            self._pop()
        else:
            return None
        return self.snapshot()

    def snapshot(self) -> dict:
        return {"type": "state", "fen": self.board.fen(), "moves": list(self.sans)}
