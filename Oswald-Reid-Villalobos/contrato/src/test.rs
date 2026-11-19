extern crate std;

use super::*;
use soroban_sdk::testutils::Address as _;
use soroban_sdk::token::{StellarAssetClient, TokenClient};

#[test]
fn ciclo_completo_de_una_factura() {
    let env = Env::default();
    env.mock_all_auths();

    let emisor_usdc = Address::generate(&env);
    let usdc = env.register_stellar_asset_contract_v2(emisor_usdc).address();
    let contrato = env.register(FacturaPuraVida, (usdc.clone(),));
    let cliente = FacturaPuraVidaClient::new(&env, &contrato);

    let pyme = Address::generate(&env);
    let inversionista = Address::generate(&env);
    let pagador = Address::generate(&env);
    StellarAssetClient::new(&env, &usdc).mint(&inversionista, &1_000);
    StellarAssetClient::new(&env, &usdc).mint(&pagador, &1_000);
    let saldo = TokenClient::new(&env, &usdc);

    let clave = BytesN::from_array(&env, &[7; 32]);
    cliente.registrar(&pyme, &clave, &1_000, &960, &1_800_000_000);
    assert_eq!(cliente.consultar(&clave).estado, Estado::Registrada);

    cliente.financiar(&inversionista, &clave);
    assert_eq!(saldo.balance(&pyme), 960);
    assert_eq!(cliente.consultar(&clave).estado, Estado::Financiada);

    cliente.pagar(&pagador, &clave);
    assert_eq!(saldo.balance(&inversionista), 1_000 - 960 + 1_000);
    assert_eq!(cliente.consultar(&clave).estado, Estado::Pagada);
}

#[test]
fn no_se_puede_registrar_dos_veces() {
    let env = Env::default();
    env.mock_all_auths();
    let usdc = env.register_stellar_asset_contract_v2(Address::generate(&env)).address();
    let cliente = FacturaPuraVidaClient::new(&env, &env.register(FacturaPuraVida, (usdc,)));
    let pyme = Address::generate(&env);
    let clave = BytesN::from_array(&env, &[1; 32]);

    cliente.registrar(&pyme, &clave, &100, &90, &0);
    assert_eq!(cliente.try_registrar(&pyme, &clave, &100, &90, &0), Err(Ok(Error::YaExiste)));
}
