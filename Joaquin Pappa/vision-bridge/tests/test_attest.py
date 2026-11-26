import pytest

stellar_sdk = pytest.importorskip("stellar_sdk")

from vision_bridge.attest import attestation_message, sign_attestation  # noqa: E402

# Vector compartido con contract/contracts/chess-registry/src/test.rs
# (attested_golden_vector_from_python). Si cambia uno, cambia el otro.
SEED = bytes([7] * 32)
CONTRACT = "CAAQCAIBAEAQCAIBAEAQCAIBAEAQCAIBAEAQCAIBAEAQCAIBAEAQC526"
REGISTRAR = "GABAEAQCAIBAEAQCAIBAEAQCAIBAEAQCAIBAEAQCAIBAEAQCAIBAEJXA"
HASH = "11" * 32
ATTESTER = "ea4a6c63e29c520abef5507b132ec5f9954776aebebe7b92421eea691446d22c"
SIGNATURE = (
    "96fc1fce3cd25bf327c867d6348459d7df9d14221052e7ed33c98ff5ce5a6e7c"
    "2fe9dc658ea4e8bfc1c83d36cb4f06e4193f3a6d03c012c0e47a4aa2e2a44701"
)


def secret():
    return stellar_sdk.Keypair.from_raw_ed25519_seed(SEED).secret


def test_golden_vector():
    out = sign_attestation(secret(), CONTRACT, REGISTRAR, HASH, 0)
    assert out == {"attester": ATTESTER, "signature": SIGNATURE}


def test_signature_verifies():
    kp = stellar_sdk.Keypair.from_raw_ed25519_seed(SEED)
    msg = attestation_message(CONTRACT, REGISTRAR, HASH, 2)
    sig = bytes.fromhex(sign_attestation(secret(), CONTRACT, REGISTRAR, HASH, 2)["signature"])
    kp.verify(msg, sig)  # lanza si no verifica


def test_message_binds_every_field():
    base = attestation_message(CONTRACT, REGISTRAR, HASH, 0)
    other_registrar = stellar_sdk.StrKey.encode_ed25519_public_key(bytes([3] * 32))
    assert attestation_message(CONTRACT, other_registrar, HASH, 0) != base
    assert attestation_message(CONTRACT, REGISTRAR, "22" * 32, 0) != base
    assert attestation_message(CONTRACT, REGISTRAR, HASH, 1) != base


@pytest.mark.parametrize("h,r", [("ab", 0), (HASH, 3)])
def test_rejects_bad_input(h, r):
    with pytest.raises(ValueError):
        attestation_message(CONTRACT, REGISTRAR, h, r)
