#![no_std]
use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, symbol_short, xdr::ToXdr, Address, Bytes,
    BytesN, Env, String, Vec,
};

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    AlreadyRegistered = 1,
    InvalidResult = 2,
    UnknownAttester = 3,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Game {
    pub registrar: Address,
    pub white: String,
    pub black: String,
    pub result: u32,
    pub timestamp: u64,
}

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Game(BytesN<32>),
    ByRegistrar(Address),
    Admin,
    /// Clave pública ed25519 de un atestador (oráculo) habilitado.
    Attester(BytesN<32>),
    /// Qué atestador firmó una partida.
    Attestation(BytesN<32>),
}

const TTL_THRESHOLD: u32 = 100_000;
const TTL_EXTEND_TO: u32 = 500_000;

/// Separador de dominio del mensaje firmado por el atestador.
/// Debe coincidir con vision_bridge/attest.py.
const ATTEST_DOMAIN: &[u8] = b"chess-registry:attest:v1";

#[contract]
pub struct ChessRegistry;

#[contractimpl]
impl ChessRegistry {
    pub fn __constructor(env: Env, admin: Address) {
        env.storage().instance().set(&DataKey::Admin, &admin);
    }

    // ---------- registro ----------

    /// Registro simple: solo firma el registrar. No prueba que la partida sea real.
    pub fn register_game(
        env: Env,
        registrar: Address,
        pgn_hash: BytesN<32>,
        white: String,
        black: String,
        result: u32,
    ) -> Result<(), Error> {
        registrar.require_auth();
        store_game(&env, &registrar, &pgn_hash, white, black, result)
    }

    /// Registro con oráculo: además de la firma del registrar, exige una firma
    /// ed25519 de un atestador habilitado sobre
    /// `DOMAIN || contrato || registrar || pgn_hash || result`.
    /// Una firma inválida aborta la transacción (panic del host).
    pub fn register_attested_game(
        env: Env,
        registrar: Address,
        pgn_hash: BytesN<32>,
        white: String,
        black: String,
        result: u32,
        attester: BytesN<32>,
        signature: BytesN<64>,
    ) -> Result<(), Error> {
        registrar.require_auth();
        if result > 2 {
            return Err(Error::InvalidResult);
        }
        let store = env.storage().persistent();
        if !store.get(&DataKey::Attester(attester.clone())).unwrap_or(false) {
            return Err(Error::UnknownAttester);
        }
        if store.has(&DataKey::Game(pgn_hash.clone())) {
            return Err(Error::AlreadyRegistered);
        }

        let msg = attestation_message(&env, &registrar, &pgn_hash, result);
        env.crypto().ed25519_verify(&attester, &msg, &signature);

        store_game(&env, &registrar, &pgn_hash, white, black, result)?;
        let akey = DataKey::Attestation(pgn_hash.clone());
        store.set(&akey, &attester);
        store.extend_ttl(&akey, TTL_THRESHOLD, TTL_EXTEND_TO);
        env.events()
            .publish((symbol_short!("game_att"), registrar), (pgn_hash, attester));
        Ok(())
    }

    // ---------- lectura ----------

    pub fn get_game(env: Env, pgn_hash: BytesN<32>) -> Option<Game> {
        env.storage().persistent().get(&DataKey::Game(pgn_hash))
    }

    pub fn games_by(env: Env, registrar: Address) -> Vec<BytesN<32>> {
        env.storage()
            .persistent()
            .get(&DataKey::ByRegistrar(registrar))
            .unwrap_or(Vec::new(&env))
    }

    /// Clave del atestador que firmó la partida, si fue registrada con oráculo.
    /// Revocar un atestador no borra este dato: el cliente debe chequear `is_attester`.
    pub fn get_attestation(env: Env, pgn_hash: BytesN<32>) -> Option<BytesN<32>> {
        env.storage().persistent().get(&DataKey::Attestation(pgn_hash))
    }

    pub fn is_attester(env: Env, attester: BytesN<32>) -> bool {
        env.storage()
            .persistent()
            .get(&DataKey::Attester(attester))
            .unwrap_or(false)
    }

    // ---------- administración ----------

    pub fn admin(env: Env) -> Address {
        env.storage().instance().get(&DataKey::Admin).unwrap()
    }

    pub fn set_admin(env: Env, new_admin: Address) {
        require_admin(&env);
        env.storage().instance().set(&DataKey::Admin, &new_admin);
    }

    pub fn add_attester(env: Env, attester: BytesN<32>) {
        require_admin(&env);
        let key = DataKey::Attester(attester);
        let store = env.storage().persistent();
        store.set(&key, &true);
        store.extend_ttl(&key, TTL_THRESHOLD, TTL_EXTEND_TO);
    }

    pub fn remove_attester(env: Env, attester: BytesN<32>) {
        require_admin(&env);
        env.storage().persistent().remove(&DataKey::Attester(attester));
    }
}

fn require_admin(env: &Env) {
    let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
    admin.require_auth();
    env.storage().instance().extend_ttl(TTL_THRESHOLD, TTL_EXTEND_TO);
}

fn attestation_message(env: &Env, registrar: &Address, pgn_hash: &BytesN<32>, result: u32) -> Bytes {
    let mut m = Bytes::from_slice(env, ATTEST_DOMAIN);
    m.append(&env.current_contract_address().to_xdr(env));
    m.append(&registrar.clone().to_xdr(env));
    m.append(&Bytes::from(pgn_hash.clone()));
    m.extend_from_array(&result.to_be_bytes());
    m
}

fn store_game(
    env: &Env,
    registrar: &Address,
    pgn_hash: &BytesN<32>,
    white: String,
    black: String,
    result: u32,
) -> Result<(), Error> {
    if result > 2 {
        return Err(Error::InvalidResult);
    }
    let key = DataKey::Game(pgn_hash.clone());
    let store = env.storage().persistent();
    if store.has(&key) {
        return Err(Error::AlreadyRegistered);
    }
    let game = Game {
        registrar: registrar.clone(),
        white,
        black,
        result,
        timestamp: env.ledger().timestamp(),
    };
    store.set(&key, &game);
    store.extend_ttl(&key, TTL_THRESHOLD, TTL_EXTEND_TO);

    let rkey = DataKey::ByRegistrar(registrar.clone());
    let mut list: Vec<BytesN<32>> = store.get(&rkey).unwrap_or(Vec::new(env));
    list.push_back(pgn_hash.clone());
    store.set(&rkey, &list);
    store.extend_ttl(&rkey, TTL_THRESHOLD, TTL_EXTEND_TO);

    env.events()
        .publish((symbol_short!("game_reg"), registrar.clone()), pgn_hash.clone());
    Ok(())
}

mod test;
