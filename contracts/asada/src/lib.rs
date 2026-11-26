#![no_std]
//! # ASADA Pagos
//!
//! Contrato inteligente para que una ASADA (Asociación Administradora de
//! Sistemas de Acueductos y Alcantarillados comunales de Costa Rica) cobre la
//! cuota mensual del agua a sus abonados de forma transparente.
//!
//! - La junta directiva (admin) registra abonados y define la cuota.
//! - Cada abonado paga su mes (periodo `AAAAMM`, por ejemplo `202611`).
//! - Cualquiera puede verificar si un abonado está al día con un periodo.
//! - Los fondos quedan en el contrato y solo la junta puede retirarlos
//!   (por ejemplo para reparar una tubería), dejando un evento público.

use soroban_sdk::{
    contract, contracterror, contractevent, contractimpl, contracttype, token, Address, Env,
    String,
};

/// ~30 días en ledgers (1 ledger ≈ 5 s).
const TTL_UMBRAL: u32 = 17_280 * 30;
/// ~1 año en ledgers.
const TTL_EXTENDER: u32 = 17_280 * 365;

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    /// La cuota debe ser mayor a cero.
    CuotaInvalida = 1,
    /// El abonado ya está registrado.
    AbonadoYaExiste = 2,
    /// El abonado no está registrado.
    AbonadoNoExiste = 3,
    /// El abonado fue dado de baja.
    AbonadoInactivo = 4,
    /// El periodo no tiene formato AAAAMM válido.
    PeriodoInvalido = 5,
    /// Ese periodo ya fue pagado.
    PeriodoYaPagado = 6,
    /// El monto a retirar debe ser mayor a cero.
    MontoInvalido = 7,
    /// El contrato no tiene fondos suficientes.
    FondosInsuficientes = 8,
}

#[contracttype]
#[derive(Clone)]
enum DataKey {
    Admin,
    Token,
    Cuota,
    Abonado(Address),
    Pago(Address, u32),
}

/// Información pública de un abonado.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Abonado {
    /// Número de medidor asignado por la ASADA.
    pub medidor: String,
    /// `false` si fue dado de baja.
    pub activo: bool,
    /// Cantidad de meses pagados.
    pub meses_pagados: u32,
}

/// Comprobante de un pago, guardado on-chain.
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Recibo {
    pub monto: i128,
    pub ledger: u32,
    pub fecha: u64,
}

#[contractevent]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct AbonadoRegistrado {
    #[topic]
    pub abonado: Address,
    pub medidor: String,
}

#[contractevent]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct CuotaPagada {
    #[topic]
    pub abonado: Address,
    #[topic]
    pub periodo: u32,
    pub monto: i128,
}

#[contractevent]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct FondosRetirados {
    #[topic]
    pub destino: Address,
    pub monto: i128,
}

#[contract]
pub struct AsadaContract;

#[contractimpl]
impl AsadaContract {
    /// Se ejecuta una sola vez al desplegar el contrato.
    ///
    /// - `admin`: cuenta de la junta directiva de la ASADA.
    /// - `token`: token con el que se cobra (ej. XLM o USDC en Stellar).
    /// - `cuota`: monto mensual en la unidad mínima del token.
    pub fn __constructor(env: Env, admin: Address, token: Address, cuota: i128) {
        if cuota <= 0 {
            panic!("la cuota debe ser mayor a cero");
        }
        let st = env.storage().instance();
        st.set(&DataKey::Admin, &admin);
        st.set(&DataKey::Token, &token);
        st.set(&DataKey::Cuota, &cuota);
    }

    // ------------------------------------------------------------------
    // Funciones de la junta directiva (requieren firma del admin)
    // ------------------------------------------------------------------

    /// Registra un nuevo abonado con su número de medidor.
    pub fn registrar_abonado(env: Env, abonado: Address, medidor: String) -> Result<(), Error> {
        Self::exigir_admin(&env);
        let key = DataKey::Abonado(abonado.clone());
        if env.storage().persistent().has(&key) {
            return Err(Error::AbonadoYaExiste);
        }
        let datos = Abonado {
            medidor: medidor.clone(),
            activo: true,
            meses_pagados: 0,
        };
        Self::guardar(&env, &key, &datos);
        AbonadoRegistrado { abonado, medidor }.publish(&env);
        Ok(())
    }

    /// Da de baja a un abonado (ya no puede pagar). Su historial se conserva.
    pub fn dar_de_baja(env: Env, abonado: Address) -> Result<(), Error> {
        Self::exigir_admin(&env);
        let key = DataKey::Abonado(abonado);
        let mut datos: Abonado = env
            .storage()
            .persistent()
            .get(&key)
            .ok_or(Error::AbonadoNoExiste)?;
        datos.activo = false;
        Self::guardar(&env, &key, &datos);
        Ok(())
    }

    /// Cambia la cuota mensual (aplica a pagos futuros).
    pub fn cambiar_cuota(env: Env, nueva_cuota: i128) -> Result<(), Error> {
        Self::exigir_admin(&env);
        if nueva_cuota <= 0 {
            return Err(Error::CuotaInvalida);
        }
        env.storage().instance().set(&DataKey::Cuota, &nueva_cuota);
        Ok(())
    }

    /// Retira fondos del contrato hacia `destino` (ej. pagar una reparación).
    pub fn retirar_fondos(env: Env, destino: Address, monto: i128) -> Result<(), Error> {
        Self::exigir_admin(&env);
        if monto <= 0 {
            return Err(Error::MontoInvalido);
        }
        let token = Self::cliente_token(&env);
        let contrato = env.current_contract_address();
        if token.balance(&contrato) < monto {
            return Err(Error::FondosInsuficientes);
        }
        token.transfer(&contrato, &destino, &monto);
        FondosRetirados { destino, monto }.publish(&env);
        Ok(())
    }

    // ------------------------------------------------------------------
    // Funciones del abonado
    // ------------------------------------------------------------------

    /// El abonado paga la cuota de un periodo `AAAAMM` (ej. `202611`).
    /// Devuelve el recibo del pago.
    pub fn pagar_cuota(env: Env, abonado: Address, periodo: u32) -> Result<Recibo, Error> {
        abonado.require_auth();
        Self::validar_periodo(periodo)?;

        let key_ab = DataKey::Abonado(abonado.clone());
        let mut datos: Abonado = env
            .storage()
            .persistent()
            .get(&key_ab)
            .ok_or(Error::AbonadoNoExiste)?;
        if !datos.activo {
            return Err(Error::AbonadoInactivo);
        }

        let key_pago = DataKey::Pago(abonado.clone(), periodo);
        if env.storage().persistent().has(&key_pago) {
            return Err(Error::PeriodoYaPagado);
        }

        let monto = Self::cuota(env.clone());
        Self::cliente_token(&env).transfer(&abonado, &env.current_contract_address(), &monto);

        let recibo = Recibo {
            monto,
            ledger: env.ledger().sequence(),
            fecha: env.ledger().timestamp(),
        };
        Self::guardar(&env, &key_pago, &recibo);

        datos.meses_pagados += 1;
        Self::guardar(&env, &key_ab, &datos);

        CuotaPagada {
            abonado,
            periodo,
            monto,
        }
        .publish(&env);
        Ok(recibo)
    }

    // ------------------------------------------------------------------
    // Consultas públicas (no requieren firma)
    // ------------------------------------------------------------------

    /// `true` si el abonado ya pagó ese periodo.
    pub fn esta_al_dia(env: Env, abonado: Address, periodo: u32) -> bool {
        env.storage()
            .persistent()
            .has(&DataKey::Pago(abonado, periodo))
    }

    /// Devuelve el recibo de un periodo, si existe.
    pub fn recibo(env: Env, abonado: Address, periodo: u32) -> Option<Recibo> {
        env.storage()
            .persistent()
            .get(&DataKey::Pago(abonado, periodo))
    }

    /// Datos del abonado.
    pub fn abonado(env: Env, abonado: Address) -> Result<Abonado, Error> {
        env.storage()
            .persistent()
            .get(&DataKey::Abonado(abonado))
            .ok_or(Error::AbonadoNoExiste)
    }

    /// Cuota mensual vigente.
    pub fn cuota(env: Env) -> i128 {
        env.storage().instance().get(&DataKey::Cuota).unwrap()
    }

    /// Saldo acumulado en la caja de la ASADA.
    pub fn saldo(env: Env) -> i128 {
        Self::cliente_token(&env).balance(&env.current_contract_address())
    }

    /// Cuenta administradora.
    pub fn admin(env: Env) -> Address {
        env.storage().instance().get(&DataKey::Admin).unwrap()
    }

    // ------------------------------------------------------------------
    // Utilidades internas
    // ------------------------------------------------------------------

    fn exigir_admin(env: &Env) {
        let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        admin.require_auth();
        env.storage()
            .instance()
            .extend_ttl(TTL_UMBRAL, TTL_EXTENDER);
    }

    fn cliente_token(env: &Env) -> token::Client<'_> {
        let token: Address = env.storage().instance().get(&DataKey::Token).unwrap();
        token::Client::new(env, &token)
    }

    fn guardar<V: soroban_sdk::IntoVal<Env, soroban_sdk::Val>>(
        env: &Env,
        key: &DataKey,
        valor: &V,
    ) {
        let st = env.storage().persistent();
        st.set(key, valor);
        st.extend_ttl(key, TTL_UMBRAL, TTL_EXTENDER);
    }

    /// Periodo válido: AAAAMM con año 2000–2100 y mes 01–12.
    fn validar_periodo(periodo: u32) -> Result<(), Error> {
        let anio = periodo / 100;
        let mes = periodo % 100;
        if !(2000..=2100).contains(&anio) || !(1..=12).contains(&mes) {
            return Err(Error::PeriodoInvalido);
        }
        Ok(())
    }
}

#[cfg(test)]
mod test;
