#![no_std]

use soroban_sdk::{
    contract, contracterror, contractevent, contractimpl, contracttype, Address, Env, String, Vec,
};

const MAX_ATTESTATIONS_PER_PROFILE: u32 = 50;
const MAX_REPO_LENGTH: u32 = 100;
const TTL_THRESHOLD: u32 = 17_280;
const TTL_EXTEND_TO: u32 = 518_400;

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum ContributionKind {
    Code,
    Docs,
    Design,
    Testing,
    Other,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Attestation {
    pub id: u64,
    pub issuer: Address,
    pub recipient: Address,
    pub repo: String,
    pub pr_number: u32,
    pub kind: ContributionKind,
    pub issued_at: u64,
}

#[contractevent(topics = ["proofolio", "issued"])]
pub struct AttestationIssued {
    #[topic]
    pub issuer: Address,
    #[topic]
    pub recipient: Address,
    pub id: u64,
    pub repo: String,
    pub pr_number: u32,
    pub kind: ContributionKind,
}

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum ContractError {
    InvalidPullRequest = 1,
    SelfAttestation = 2,
    DuplicateAttestation = 3,
    ProfileFull = 4,
    AttestationNotFound = 5,
    InvalidRepository = 6,
    CounterOverflow = 7,
}

#[contracttype]
#[derive(Clone)]
enum DataKey {
    Counter,
    Attestation(u64),
    Recipient(Address),
    Duplicate(Address, Address, String, u32),
}

#[contract]
pub struct ProofolioContract;

#[contractimpl]
impl ProofolioContract {
    pub fn issue(
        env: Env,
        issuer: Address,
        recipient: Address,
        repo: String,
        pr_number: u32,
        kind: ContributionKind,
    ) -> Result<u64, ContractError> {
        issuer.require_auth();

        if issuer == recipient {
            return Err(ContractError::SelfAttestation);
        }
        if pr_number == 0 {
            return Err(ContractError::InvalidPullRequest);
        }
        if repo.is_empty() || repo.len() > MAX_REPO_LENGTH {
            return Err(ContractError::InvalidRepository);
        }

        let duplicate_key = DataKey::Duplicate(
            issuer.clone(),
            recipient.clone(),
            repo.clone(),
            pr_number,
        );
        if env.storage().persistent().has(&duplicate_key) {
            return Err(ContractError::DuplicateAttestation);
        }

        let recipient_key = DataKey::Recipient(recipient.clone());
        let mut ids: Vec<u64> = env
            .storage()
            .persistent()
            .get(&recipient_key)
            .unwrap_or_else(|| Vec::new(&env));
        if ids.len() >= MAX_ATTESTATIONS_PER_PROFILE {
            return Err(ContractError::ProfileFull);
        }

        let current: u64 = env
            .storage()
            .instance()
            .get(&DataKey::Counter)
            .unwrap_or(0);
        let id = current
            .checked_add(1)
            .ok_or(ContractError::CounterOverflow)?;

        let attestation = Attestation {
            id,
            issuer: issuer.clone(),
            recipient: recipient.clone(),
            repo: repo.clone(),
            pr_number,
            kind: kind.clone(),
            issued_at: env.ledger().timestamp(),
        };
        let attestation_key = DataKey::Attestation(id);

        ids.push_back(id);
        env.storage().instance().set(&DataKey::Counter, &id);
        env.storage().persistent().set(&attestation_key, &attestation);
        env.storage().persistent().set(&recipient_key, &ids);
        env.storage().persistent().set(&duplicate_key, &true);

        Self::extend_instance_ttl(&env);
        Self::extend_persistent_ttl(&env, &attestation_key);
        Self::extend_persistent_ttl(&env, &recipient_key);
        Self::extend_persistent_ttl(&env, &duplicate_key);

        AttestationIssued {
            issuer,
            recipient,
            id,
            repo,
            pr_number,
            kind,
        }
        .publish(&env);

        Ok(id)
    }

    pub fn get(env: Env, id: u64) -> Result<Attestation, ContractError> {
        let key = DataKey::Attestation(id);
        let attestation = env
            .storage()
            .persistent()
            .get(&key)
            .ok_or(ContractError::AttestationNotFound)?;
        Self::extend_persistent_ttl(&env, &key);
        Ok(attestation)
    }

    pub fn list_for(env: Env, recipient: Address) -> Vec<Attestation> {
        let recipient_key = DataKey::Recipient(recipient);
        let ids: Vec<u64> = env
            .storage()
            .persistent()
            .get(&recipient_key)
            .unwrap_or_else(|| Vec::new(&env));
        let mut attestations = Vec::new(&env);

        for id in ids.iter() {
            let key = DataKey::Attestation(id);
            if let Some(attestation) = env.storage().persistent().get(&key) {
                attestations.push_back(attestation);
                Self::extend_persistent_ttl(&env, &key);
            }
        }

        if env.storage().persistent().has(&recipient_key) {
            Self::extend_persistent_ttl(&env, &recipient_key);
        }
        attestations
    }

    fn extend_instance_ttl(env: &Env) {
        env.storage()
            .instance()
            .extend_ttl(TTL_THRESHOLD, TTL_EXTEND_TO);
    }

    fn extend_persistent_ttl(env: &Env, key: &DataKey) {
        env.storage()
            .persistent()
            .extend_ttl(key, TTL_THRESHOLD, TTL_EXTEND_TO);
    }
}

#[cfg(test)]
mod test;

