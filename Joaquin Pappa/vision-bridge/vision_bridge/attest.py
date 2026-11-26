"""Firmador de atestaciones (oráculo) para ChessRegistry.

Construye el mismo mensaje que `register_attested_game` verifica en el contrato
y lo firma con ed25519. La clave del atestador es un keypair Stellar estándar
(secret `S...`); su clave pública cruda (32 bytes) es la que el admin habilita
con `add_attester`.

Mensaje (bytes concatenados):

    b"chess-registry:attest:v1"
    || XDR(ScVal Address del contrato)
    || XDR(ScVal Address del registrar)
    || pgn_hash (32 bytes)
    || result (u32 big-endian)

Hoy corre local como referencia. Más adelante vive en el backend (Render) y la
clave pasa a un KMS: ver "Oráculo / atestador" en el README del proyecto.

Uso:

    ATTESTER_SECRET=S... python -m vision_bridge.attest \\
        --contract C... --registrar G... --pgn partida.pgn --result 0
"""

from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path

DOMAIN = b"chess-registry:attest:v1"


def _address_xdr(address: str) -> bytes:
    from stellar_sdk import Address

    return Address(address).to_xdr_sc_val().to_xdr_bytes()


def attestation_message(contract_id: str, registrar: str, pgn_hash_hex: str, result: int) -> bytes:
    pgn_hash = bytes.fromhex(pgn_hash_hex)
    if len(pgn_hash) != 32:
        raise ValueError("pgn_hash debe tener 32 bytes")
    if result not in (0, 1, 2):
        raise ValueError("result debe ser 0, 1 o 2")
    return (
        DOMAIN
        + _address_xdr(contract_id)
        + _address_xdr(registrar)
        + pgn_hash
        + result.to_bytes(4, "big")
    )


def sign_attestation(secret: str, contract_id: str, registrar: str, pgn_hash_hex: str, result: int) -> dict:
    """Devuelve {"attester", "signature"} en hex, listos para el contrato."""
    from stellar_sdk import Keypair

    kp = Keypair.from_secret(secret)
    msg = attestation_message(contract_id, registrar, pgn_hash_hex, result)
    return {
        "attester": kp.raw_public_key().hex(),
        "signature": kp.sign(msg).hex(),
    }


def main(argv: list[str] | None = None) -> int:
    from .canonical import pgn_hash

    p = argparse.ArgumentParser(description="Firma una atestación para register_attested_game")
    p.add_argument("--contract", required=True, help="Contract ID (C...)")
    p.add_argument("--registrar", required=True, help="Cuenta que va a registrar (G...)")
    src = p.add_mutually_exclusive_group(required=True)
    src.add_argument("--pgn", type=Path, help="Archivo PGN")
    src.add_argument("--hash", help="Hash SHA-256 en hex (si ya lo tenés)")
    p.add_argument("--result", type=int, required=True, choices=(0, 1, 2), help="0=1-0, 1=0-1, 2=½-½")
    args = p.parse_args(argv)

    secret = os.environ.get("ATTESTER_SECRET")
    if not secret:
        print("Falta ATTESTER_SECRET en el entorno", file=sys.stderr)
        return 2

    h = args.hash or pgn_hash(args.pgn.read_text())
    out = sign_attestation(secret, args.contract, args.registrar, h, args.result)
    out["pgn_hash"] = h
    print(json.dumps(out, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
