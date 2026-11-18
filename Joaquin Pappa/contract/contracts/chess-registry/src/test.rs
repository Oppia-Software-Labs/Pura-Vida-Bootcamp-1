#![cfg(test)]
use super::*;
use ed25519_dalek::{Signer, SigningKey};
use soroban_sdk::{testutils::Address as _, xdr::ToXdr, Address, Bytes, BytesN, Env, String};

fn hash(env: &Env, b: u8) -> BytesN<32> {
    BytesN::from_array(env, &[b; 32])
}

fn setup(env: &Env) -> (ChessRegistryClient<'_>, Address) {
    let admin = Address::generate(env);
    let id = env.register(ChessRegistry, (&admin,));
    (ChessRegistryClient::new(env, &id), admin)
}

fn s(env: &Env, v: &str) -> String {
    String::from_str(env, v)
}

// ---------- registro simple (sin oráculo) ----------

#[test]
fn registers_and_reads() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, _) = setup(&env);
    let user = Address::generate(&env);
    let h = hash(&env, 1);

    client.register_game(&user, &h, &s(&env, "Ana"), &s(&env, "Beto"), &0);

    let g = client.get_game(&h).unwrap();
    assert_eq!(g.result, 0);
    assert_eq!(g.registrar, user);
    assert_eq!(client.games_by(&user).len(), 1);
    assert!(client.get_attestation(&h).is_none());
}

#[test]
fn duplicate_fails() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, _) = setup(&env);
    let user = Address::generate(&env);
    let h = hash(&env, 2);
    let (w, b) = (s(&env, "Ana"), s(&env, "Beto"));

    client.register_game(&user, &h, &w, &b, &2);
    let r = client.try_register_game(&user, &h, &w, &b, &2);
    assert_eq!(r, Err(Ok(Error::AlreadyRegistered)));
}

#[test]
fn invalid_result_fails() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, _) = setup(&env);
    let user = Address::generate(&env);
    let r = client.try_register_game(&user, &hash(&env, 3), &s(&env, "A"), &s(&env, "B"), &3);
    assert_eq!(r, Err(Ok(Error::InvalidResult)));
}

#[test]
#[should_panic]
fn requires_auth() {
    let env = Env::default(); // sin mock_all_auths
    let (client, _) = setup(&env);
    let user = Address::generate(&env);
    client.register_game(&user, &hash(&env, 4), &s(&env, "A"), &s(&env, "B"), &0);
}

#[test]
fn unknown_game_is_none() {
    let env = Env::default();
    let (client, _) = setup(&env);
    assert!(client.get_game(&hash(&env, 9)).is_none());
}

// ---------- oráculo / atestador ----------

fn attester_key(seed: u8) -> SigningKey {
    SigningKey::from_bytes(&[seed; 32])
}

fn pubkey(env: &Env, k: &SigningKey) -> BytesN<32> {
    BytesN::from_array(env, &k.verifying_key().to_bytes())
}

/// Mismo mensaje que vision_bridge/attest.py::attestation_message.
fn message(env: &Env, contract: &Address, registrar: &Address, h: &BytesN<32>, result: u32) -> Bytes {
    let mut m = Bytes::from_slice(env, b"chess-registry:attest:v1");
    m.append(&contract.clone().to_xdr(env));
    m.append(&registrar.clone().to_xdr(env));
    m.append(&Bytes::from(h.clone()));
    m.extend_from_array(&result.to_be_bytes());
    m
}

fn sign(env: &Env, k: &SigningKey, msg: &Bytes) -> BytesN<64> {
    let mut buf = [0u8; 512];
    let n = msg.len() as usize;
    msg.copy_into_slice(&mut buf[..n]);
    BytesN::from_array(env, &k.sign(&buf[..n]).to_bytes())
}

#[test]
fn admin_manages_attesters() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, admin) = setup(&env);
    let pk = pubkey(&env, &attester_key(5));

    assert_eq!(client.admin(), admin);
    assert!(!client.is_attester(&pk));
    client.add_attester(&pk);
    assert!(client.is_attester(&pk));
    client.remove_attester(&pk);
    assert!(!client.is_attester(&pk));

    let new_admin = Address::generate(&env);
    client.set_admin(&new_admin);
    assert_eq!(client.admin(), new_admin);
}

#[test]
#[should_panic]
fn add_attester_requires_admin_auth() {
    let env = Env::default(); // sin mock_all_auths
    let (client, _) = setup(&env);
    client.add_attester(&pubkey(&env, &attester_key(5)));
}

#[test]
fn registers_attested_game() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, _) = setup(&env);
    let k = attester_key(5);
    let pk = pubkey(&env, &k);
    client.add_attester(&pk);

    let user = Address::generate(&env);
    let h = hash(&env, 10);
    let sig = sign(&env, &k, &message(&env, &client.address, &user, &h, 1));

    client.register_attested_game(&user, &h, &s(&env, "Ana"), &s(&env, "Beto"), &1, &pk, &sig);

    assert_eq!(client.get_game(&h).unwrap().result, 1);
    assert_eq!(client.get_attestation(&h), Some(pk));
    assert_eq!(client.games_by(&user).len(), 1);
}

#[test]
fn unknown_attester_fails() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, _) = setup(&env);
    let k = attester_key(5);
    let pk = pubkey(&env, &k); // nunca habilitado
    let user = Address::generate(&env);
    let h = hash(&env, 11);
    let sig = sign(&env, &k, &message(&env, &client.address, &user, &h, 0));

    let r = client.try_register_attested_game(&user, &h, &s(&env, "A"), &s(&env, "B"), &0, &pk, &sig);
    assert_eq!(r, Err(Ok(Error::UnknownAttester)));
}

#[test]
fn revoked_attester_fails() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, _) = setup(&env);
    let k = attester_key(5);
    let pk = pubkey(&env, &k);
    client.add_attester(&pk);
    client.remove_attester(&pk);
    let user = Address::generate(&env);
    let h = hash(&env, 12);
    let sig = sign(&env, &k, &message(&env, &client.address, &user, &h, 0));

    let r = client.try_register_attested_game(&user, &h, &s(&env, "A"), &s(&env, "B"), &0, &pk, &sig);
    assert_eq!(r, Err(Ok(Error::UnknownAttester)));
}

#[test]
#[should_panic]
fn tampered_result_fails() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, _) = setup(&env);
    let k = attester_key(5);
    let pk = pubkey(&env, &k);
    client.add_attester(&pk);
    let user = Address::generate(&env);
    let h = hash(&env, 13);
    // firma result=0 pero se intenta registrar result=1
    let sig = sign(&env, &k, &message(&env, &client.address, &user, &h, 0));
    client.register_attested_game(&user, &h, &s(&env, "A"), &s(&env, "B"), &1, &pk, &sig);
}

#[test]
#[should_panic]
fn signature_bound_to_registrar() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, _) = setup(&env);
    let k = attester_key(5);
    let pk = pubkey(&env, &k);
    client.add_attester(&pk);
    let alice = Address::generate(&env);
    let mallory = Address::generate(&env);
    let h = hash(&env, 14);
    // atestación emitida para alice; mallory intenta usarla (front-running)
    let sig = sign(&env, &k, &message(&env, &client.address, &alice, &h, 0));
    client.register_attested_game(&mallory, &h, &s(&env, "A"), &s(&env, "B"), &0, &pk, &sig);
}

#[test]
fn attested_duplicate_fails() {
    let env = Env::default();
    env.mock_all_auths();
    let (client, _) = setup(&env);
    let k = attester_key(5);
    let pk = pubkey(&env, &k);
    client.add_attester(&pk);
    let user = Address::generate(&env);
    let h = hash(&env, 15);
    client.register_game(&user, &h, &s(&env, "A"), &s(&env, "B"), &0);
    let sig = sign(&env, &k, &message(&env, &client.address, &user, &h, 0));

    let r = client.try_register_attested_game(&user, &h, &s(&env, "A"), &s(&env, "B"), &0, &pk, &sig);
    assert_eq!(r, Err(Ok(Error::AlreadyRegistered)));
}

/// Firma generada por vision_bridge/attest.py (tests/test_attest.py).
/// Garantiza que el firmador Python y el contrato construyen el mismo mensaje.
#[test]
fn attested_golden_vector_from_python() {
    let env = Env::default();
    env.mock_all_auths();
    let admin = Address::generate(&env);
    let cid = Address::from_str(&env, "CAAQCAIBAEAQCAIBAEAQCAIBAEAQCAIBAEAQCAIBAEAQCAIBAEAQC526");
    env.register_at(&cid, ChessRegistry, (&admin,));
    let client = ChessRegistryClient::new(&env, &cid);

    let pk = BytesN::from_array(
        &env,
        &hex32("ea4a6c63e29c520abef5507b132ec5f9954776aebebe7b92421eea691446d22c"),
    );
    let sig = BytesN::from_array(
        &env,
        &hex64(concat!(
            "96fc1fce3cd25bf327c867d6348459d7df9d14221052e7ed33c98ff5ce5a6e7c",
            "2fe9dc658ea4e8bfc1c83d36cb4f06e4193f3a6d03c012c0e47a4aa2e2a44701"
        )),
    );
    let registrar = Address::from_str(&env, "GABAEAQCAIBAEAQCAIBAEAQCAIBAEAQCAIBAEAQCAIBAEAQCAIBAEJXA");
    client.add_attester(&pk);

    client.register_attested_game(&registrar, &hash(&env, 0x11), &s(&env, "A"), &s(&env, "B"), &0, &pk, &sig);
    assert_eq!(client.get_attestation(&hash(&env, 0x11)), Some(pk));
}

fn hex_bytes<const N: usize>(h: &str) -> [u8; N] {
    let mut out = [0u8; N];
    for i in 0..N {
        out[i] = u8::from_str_radix(&h[2 * i..2 * i + 2], 16).unwrap();
    }
    out
}
fn hex32(h: &str) -> [u8; 32] {
    hex_bytes::<32>(h)
}
fn hex64(h: &str) -> [u8; 64] {
    hex_bytes::<64>(h)
}
