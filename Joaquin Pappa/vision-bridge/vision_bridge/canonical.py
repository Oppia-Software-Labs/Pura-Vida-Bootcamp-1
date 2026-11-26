"""Hash canónico de una partida, idéntico a app/src/lib/pgn.ts.

SHA-256 de las jugadas SAN desde la posición inicial, unidas por un espacio.
Los headers PGN no afectan el hash.
"""

from __future__ import annotations

import hashlib
import io

import chess.pgn


def canonical_moves(pgn: str) -> str:
    game = chess.pgn.read_game(io.StringIO(pgn))
    if game is None:
        raise ValueError("PGN inválido")
    if game.errors:
        raise ValueError(f"PGN inválido: {game.errors[0]}")
    if "FEN" in game.headers:
        raise ValueError("PGN con posición inicial (FEN) no soportado")
    board = game.board()
    sans: list[str] = []
    for move in game.mainline_moves():
        sans.append(board.san(move))
        board.push(move)
    if not sans:
        raise ValueError("El PGN no tiene jugadas")
    return " ".join(sans)


def pgn_hash(pgn: str) -> str:
    return hashlib.sha256(canonical_moves(pgn).encode()).hexdigest()
