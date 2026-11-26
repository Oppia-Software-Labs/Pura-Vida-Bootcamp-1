"""El hash de Python tiene que ser idéntico al de app/src/lib/pgn.ts.

Si no coinciden, una partida grabada por cámara no se podría verificar en la app.
El test de paridad corre el pgn.ts real con Node (≥22.18, que importa .ts directo).
"""

import json
import shutil
import subprocess
from pathlib import Path

import chess
import chess.pgn
import pytest

from vision_bridge.canonical import canonical_moves, pgn_hash

APP = Path(__file__).resolve().parents[2] / "app"


def from_vision(sans: list[str], result: str = "*") -> str:
    """PGN tal como lo genera chess_vision/game/pgn.py (python-chess)."""
    board = chess.Board()
    game = chess.pgn.Game()
    game.headers.update({"White": "Ana", "Black": "Beto", "Date": "2026.11.17", "Result": result})
    node = game
    for san in sans:
        move = board.parse_san(san)
        node = node.add_variation(move)
        board.push(move)
    return str(game)


CASES = {
    "scholar_mate": from_vision(["e4", "e5", "Qh5", "Nc6", "Bc4", "Nf6", "Qxf7#"], "1-0"),
    "castles_promo": from_vision(
        ["e4", "d5", "exd5", "c6", "dxc6", "Nf6", "cxb7", "Bd7", "bxa8=Q", "e6", "Nf3", "Be7", "Be2", "O-O"]
    ),
    "disambiguation": from_vision(["Nf3", "Nf6", "Nc3", "Nc6", "Nd4", "Nd5", "Ncb5", "Ndb4"]),
    "hand_written": "[Event \"Club\"]\n[White \"X\"]\n[Black \"Y\"]\n\n1.e4 {buena} e5 2.Nf3 (2.f4) Nc6 1/2-1/2",
}


def test_headers_do_not_change_hash():
    a = from_vision(["e4", "e5"])
    b = a.replace('"Ana"', '"Otra"').replace("2026.11.17", "2000.01.01")
    assert pgn_hash(a) == pgn_hash(b)


def test_canonical_ignores_comments_and_variations():
    assert canonical_moves(CASES["hand_written"]) == "e4 e5 Nf3 Nc6"


def test_rejects_fen_and_empty():
    with pytest.raises(ValueError):
        canonical_moves('[FEN "8/8/8/8/8/8/8/K6k w - - 0 1"]\n\n1. Kb1 *')
    with pytest.raises(ValueError):
        canonical_moves('[White "A"]\n\n*')


@pytest.mark.skipif(shutil.which("node") is None or not (APP / "node_modules" / "chess.js").exists(),
                    reason="requiere node y `npm install` en app/")
def test_parity_with_app_pgn_ts():
    script = (
        "import('./src/lib/pgn.ts').then(async m => {"
        " const cases = JSON.parse(process.argv[1]); const out = {};"
        " for (const [k, v] of Object.entries(cases)) out[k] = m.toHex(await m.hashPgn(v));"
        " console.log(JSON.stringify(out)) })"
    )
    res = subprocess.run(["node", "-e", script, json.dumps(CASES)], cwd=APP,
                         capture_output=True, text=True, check=True)
    ts = json.loads(res.stdout.strip().splitlines()[-1])
    for name, pgn in CASES.items():
        assert pgn_hash(pgn) == ts[name], name
