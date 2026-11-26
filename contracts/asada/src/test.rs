#![cfg(test)]
extern crate std;

use super::*;
use soroban_sdk::{
    testutils::{Address as _, AuthorizedFunction, AuthorizedInvocation},
    token::{StellarAssetClient, TokenClient},
    IntoVal, Symbol,
};

const CUOTA: i128 = 5_000; // ej. ₡5 000 representados en el token

struct Escenario<'a> {
    env: Env,
    admin: Address,
    contrato: AsadaContractClient<'a>,
    token: TokenClient<'a>,
    token_admin: StellarAssetClient<'a>,
}

fn escenario<'a>() -> Escenario<'a> {
    let env = Env::default();
    env.mock_all_auths();

    let admin = Address::generate(&env);
    let emisor = Address::generate(&env);
    let sac = env.register_stellar_asset_contract_v2(emisor);
    let token = TokenClient::new(&env, &sac.address());
    let token_admin = StellarAssetClient::new(&env, &sac.address());

    let id = env.register(AsadaContract, (&admin, &sac.address(), CUOTA));
    let contrato = AsadaContractClient::new(&env, &id);

    Escenario {
        env,
        admin,
        contrato,
        token,
        token_admin,
    }
}

/// Crea un abonado registrado y con saldo para pagar `meses` cuotas.
fn nuevo_abonado(e: &Escenario, medidor: &str, meses: i128) -> Address {
    let vecino = Address::generate(&e.env);
    e.token_admin.mint(&vecino, &(CUOTA * meses));
    e.contrato
        .registrar_abonado(&vecino, &String::from_str(&e.env, medidor));
    vecino
}

#[test]
fn registra_abonado() {
    let e = escenario();
    let vecino = nuevo_abonado(&e, "MED-001", 1);

    let datos = e.contrato.abonado(&vecino);
    assert_eq!(datos.medidor, String::from_str(&e.env, "MED-001"));
    assert!(datos.activo);
    assert_eq!(datos.meses_pagados, 0);
}

#[test]
fn pago_mensual_exitoso() {
    let e = escenario();
    let vecino = nuevo_abonado(&e, "MED-001", 2);

    assert!(!e.contrato.esta_al_dia(&vecino, &202611));
    let recibo = e.contrato.pagar_cuota(&vecino, &202611);

    // Se pidió la firma del vecino para exactamente esta llamada
    assert_eq!(
        e.env.auths(),
        std::vec![(
            vecino.clone(),
            AuthorizedInvocation {
                function: AuthorizedFunction::Contract((
                    e.contrato.address.clone(),
                    Symbol::new(&e.env, "pagar_cuota"),
                    (vecino.clone(), 202611_u32).into_val(&e.env),
                )),
                sub_invocations: std::vec![AuthorizedInvocation {
                    function: AuthorizedFunction::Contract((
                        e.token.address.clone(),
                        Symbol::new(&e.env, "transfer"),
                        (vecino.clone(), e.contrato.address.clone(), CUOTA).into_val(&e.env),
                    )),
                    sub_invocations: std::vec![],
                }],
            }
        )]
    );

    assert_eq!(recibo.monto, CUOTA);
    assert!(e.contrato.esta_al_dia(&vecino, &202611));
    assert_eq!(e.contrato.recibo(&vecino, &202611), Some(recibo));
    assert_eq!(e.contrato.saldo(), CUOTA);
    assert_eq!(e.token.balance(&vecino), CUOTA); // le queda 1 cuota
    assert_eq!(e.contrato.abonado(&vecino).meses_pagados, 1);
}

#[test]
fn no_se_puede_pagar_dos_veces_el_mismo_mes() {
    let e = escenario();
    let vecino = nuevo_abonado(&e, "MED-001", 2);

    e.contrato.pagar_cuota(&vecino, &202611);
    let r = e.contrato.try_pagar_cuota(&vecino, &202611);
    assert_eq!(r, Err(Ok(Error::PeriodoYaPagado)));
    assert_eq!(e.contrato.saldo(), CUOTA); // no se cobró doble
}

#[test]
fn varios_meses_y_varios_vecinos() {
    let e = escenario();
    let ana = nuevo_abonado(&e, "MED-001", 3);
    let luis = nuevo_abonado(&e, "MED-002", 1);

    e.contrato.pagar_cuota(&ana, &202610);
    e.contrato.pagar_cuota(&ana, &202611);
    e.contrato.pagar_cuota(&luis, &202611);

    assert!(e.contrato.esta_al_dia(&ana, &202610));
    assert!(e.contrato.esta_al_dia(&luis, &202611));
    assert!(!e.contrato.esta_al_dia(&luis, &202610)); // Luis debe octubre
    assert_eq!(e.contrato.abonado(&ana).meses_pagados, 2);
    assert_eq!(e.contrato.saldo(), CUOTA * 3);
}

#[test]
fn rechaza_periodo_invalido() {
    let e = escenario();
    let vecino = nuevo_abonado(&e, "MED-001", 1);

    for p in [202613_u32, 202600, 11, 999912] {
        assert_eq!(
            e.contrato.try_pagar_cuota(&vecino, &p),
            Err(Ok(Error::PeriodoInvalido))
        );
    }
}

#[test]
fn no_registrado_no_puede_pagar() {
    let e = escenario();
    let extrano = Address::generate(&e.env);
    e.token_admin.mint(&extrano, &CUOTA);

    assert_eq!(
        e.contrato.try_pagar_cuota(&extrano, &202611),
        Err(Ok(Error::AbonadoNoExiste))
    );
}

#[test]
fn no_se_registra_dos_veces() {
    let e = escenario();
    let vecino = nuevo_abonado(&e, "MED-001", 1);
    let r = e
        .contrato
        .try_registrar_abonado(&vecino, &String::from_str(&e.env, "MED-999"));
    assert_eq!(r, Err(Ok(Error::AbonadoYaExiste)));
}

#[test]
fn abonado_dado_de_baja_no_paga() {
    let e = escenario();
    let vecino = nuevo_abonado(&e, "MED-001", 1);
    e.contrato.dar_de_baja(&vecino);

    assert!(!e.contrato.abonado(&vecino).activo);
    assert_eq!(
        e.contrato.try_pagar_cuota(&vecino, &202611),
        Err(Ok(Error::AbonadoInactivo))
    );
}

#[test]
fn cambio_de_cuota_aplica_a_pagos_nuevos() {
    let e = escenario();
    let vecino = nuevo_abonado(&e, "MED-001", 3);

    e.contrato.pagar_cuota(&vecino, &202611);
    e.contrato.cambiar_cuota(&6_000);
    assert_eq!(e.contrato.cuota(), 6_000);

    let recibo = e.contrato.pagar_cuota(&vecino, &202612);
    assert_eq!(recibo.monto, 6_000);
    assert_eq!(e.contrato.saldo(), CUOTA + 6_000);

    assert_eq!(
        e.contrato.try_cambiar_cuota(&0),
        Err(Ok(Error::CuotaInvalida))
    );
}

#[test]
fn junta_retira_fondos_para_reparacion() {
    let e = escenario();
    let a = nuevo_abonado(&e, "MED-001", 1);
    let b = nuevo_abonado(&e, "MED-002", 1);
    e.contrato.pagar_cuota(&a, &202611);
    e.contrato.pagar_cuota(&b, &202611);

    let fontanero = Address::generate(&e.env);
    e.contrato.retirar_fondos(&fontanero, &7_000);

    assert_eq!(e.token.balance(&fontanero), 7_000);
    assert_eq!(e.contrato.saldo(), CUOTA * 2 - 7_000);

    assert_eq!(
        e.contrato.try_retirar_fondos(&fontanero, &1_000_000),
        Err(Ok(Error::FondosInsuficientes))
    );
    assert_eq!(
        e.contrato.try_retirar_fondos(&fontanero, &0),
        Err(Ok(Error::MontoInvalido))
    );
}

#[test]
fn retiro_requiere_firma_del_admin() {
    let e = escenario();
    let destino = Address::generate(&e.env);
    let a = nuevo_abonado(&e, "MED-001", 1);
    e.contrato.pagar_cuota(&a, &202611);

    e.contrato.retirar_fondos(&destino, &1_000);
    let (quien, _) = e.env.auths().pop().unwrap();
    assert_eq!(quien, e.admin);
}

#[test]
#[should_panic]
fn sin_firma_del_admin_no_se_registra() {
    let env = Env::default(); // SIN mock_all_auths
    let admin = Address::generate(&env);
    let sac = env.register_stellar_asset_contract_v2(Address::generate(&env));
    let id = env.register(AsadaContract, (&admin, &sac.address(), CUOTA));
    let contrato = AsadaContractClient::new(&env, &id);

    contrato.registrar_abonado(&Address::generate(&env), &String::from_str(&env, "X"));
}
