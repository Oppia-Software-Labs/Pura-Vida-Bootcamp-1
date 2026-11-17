extern crate std;

use super::*;
use soroban_sdk::{
    testutils::{storage::Persistent as _, Address as _, Events as _, Ledger as _},
    Address, Env, String,
};

fn repo(env: &Env, value: &str) -> String {
    String::from_str(env, value)
}

fn setup() -> (Env, Address, ProofolioContractClient<'static>) {
    let env = Env::default();
    env.mock_all_auths();
    env.ledger().set_timestamp(1_800_000_000);
    let contract_id = env.register(ProofolioContract, ());
    let client = ProofolioContractClient::new(&env, &contract_id);
    (env, contract_id, client)
}

#[test]
fn issues_and_lists_attestations_in_order() {
    let (env, _, client) = setup();
    let issuer = Address::generate(&env);
    let recipient = Address::generate(&env);

    let first = client.issue(
        &issuer,
        &recipient,
        &repo(&env, "stellar/example"),
        &12,
        &ContributionKind::Code,
    );
    let second = client.issue(
        &issuer,
        &recipient,
        &repo(&env, "stellar/another"),
        &34,
        &ContributionKind::Docs,
    );

    assert_eq!(first, 1);
    assert_eq!(second, 2);
    let listed = client.list_for(&recipient);
    assert_eq!(listed.len(), 2);
    assert_eq!(listed.get(0).unwrap().id, 1);
    assert_eq!(listed.get(1).unwrap().id, 2);
    assert_eq!(client.get(&1).repo, repo(&env, "stellar/example"));
}

#[test]
fn requires_issuer_authorization() {
    let (env, _, client) = setup();
    let issuer = Address::generate(&env);
    let recipient = Address::generate(&env);

    client.issue(
        &issuer,
        &recipient,
        &repo(&env, "stellar/example"),
        &1,
        &ContributionKind::Testing,
    );

    let auths = env.auths();
    assert_eq!(auths.len(), 1);
    assert_eq!(auths.get(0).unwrap().0, issuer);
}

#[test]
fn rejects_self_attestation() {
    let (env, _, client) = setup();
    let issuer = Address::generate(&env);

    assert_eq!(
        client.try_issue(
            &issuer,
            &issuer,
            &repo(&env, "stellar/example"),
            &2,
            &ContributionKind::Design,
        ),
        Err(Ok(ContractError::SelfAttestation))
    );
}

#[test]
fn rejects_duplicate_for_same_pair_and_pull_request() {
    let (env, _, client) = setup();
    let issuer = Address::generate(&env);
    let recipient = Address::generate(&env);
    let repository = repo(&env, "stellar/example");

    client.issue(
        &issuer,
        &recipient,
        &repository,
        &8,
        &ContributionKind::Code,
    );

    assert_eq!(
        client.try_issue(
            &issuer,
            &recipient,
            &repository,
            &8,
            &ContributionKind::Code,
        ),
        Err(Ok(ContractError::DuplicateAttestation))
    );
}

#[test]
fn enforces_profile_limit() {
    let (env, _, client) = setup();
    let issuer = Address::generate(&env);
    let recipient = Address::generate(&env);
    let repository = repo(&env, "stellar/example");

    for pr_number in 1..=MAX_ATTESTATIONS_PER_PROFILE {
        client.issue(
            &issuer,
            &recipient,
            &repository,
            &pr_number,
            &ContributionKind::Other,
        );
    }

    assert_eq!(
        client.try_issue(
            &issuer,
            &recipient,
            &repository,
            &(MAX_ATTESTATIONS_PER_PROFILE + 1),
            &ContributionKind::Other,
        ),
        Err(Ok(ContractError::ProfileFull))
    );
}

#[test]
fn emits_event_and_extends_ttl() {
    let (env, contract_id, client) = setup();
    let issuer = Address::generate(&env);
    let recipient = Address::generate(&env);
    let repository = repo(&env, "stellar/example");

    client.issue(
        &issuer,
        &recipient,
        &repository,
        &21,
        &ContributionKind::Testing,
    );

    assert_eq!(env.events().all().events().len(), 1);

    let ttl = env.as_contract(&contract_id, || {
        env.storage()
            .persistent()
            .get_ttl(&DataKey::Attestation(1))
    });
    assert!(ttl >= TTL_EXTEND_TO - 1);
}

#[test]
fn validates_repository_and_pull_request_number() {
    let (env, _, client) = setup();
    let issuer = Address::generate(&env);
    let recipient = Address::generate(&env);

    assert_eq!(
        client.try_issue(
            &issuer,
            &recipient,
            &repo(&env, ""),
            &1,
            &ContributionKind::Code,
        ),
        Err(Ok(ContractError::InvalidRepository))
    );
    assert_eq!(
        client.try_issue(
            &issuer,
            &recipient,
            &repo(&env, "stellar/example"),
            &0,
            &ContributionKind::Code,
        ),
        Err(Ok(ContractError::InvalidPullRequest))
    );
}
