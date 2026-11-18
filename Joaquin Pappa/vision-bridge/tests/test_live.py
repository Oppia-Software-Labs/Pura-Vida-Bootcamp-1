import json
from pathlib import Path

from vision_bridge.live import LiveGame

FIXTURE = Path(__file__).parent / "fixtures" / "sample_game.jsonl"


def replay(lines):
    g = LiveGame()
    for line in lines:
        g.apply(json.loads(line) if isinstance(line, str) else line)
    return g


def test_sample_replay_handles_undo_and_rescue():
    g = replay(FIXTURE.read_text().splitlines())
    assert g.sans == ["e4", "e5", "Qh5", "Nc6", "Bc4", "Nf6", "Qxf7#"]
    assert g.board.is_checkmate()


def test_ignores_non_board_events():
    g = LiveGame()
    assert g.apply({"type": "snapshot"}) is None
    assert g.apply({"type": "confirm", "san": "e4"}) is None
    assert g.sans == []


def test_illegal_san_is_dropped():
    g = LiveGame()
    assert g.apply({"type": "fire", "san": "e5"}) is None  # blancas no pueden e5
    assert g.sans == []


def test_reset_and_quit_discard():
    g = replay([
        {"type": "fire", "san": "d4"},
        {"type": "keypress", "action": "reset"},
        {"type": "fire", "san": "c4"},
        {"type": "fire", "san": "c5"},
        {"type": "keypress", "action": "quit", "discarded_san": "c5"},
    ])
    assert g.sans == ["c4"]


def test_snapshot_shape():
    g = LiveGame()
    msg = g.apply({"type": "fire", "san": "e4"})
    assert msg == {"type": "state", "fen": g.board.fen(), "moves": ["e4"]}
