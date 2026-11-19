#![no_std]
//! Factura Pura Vida: tokeniza una factura electrónica de Costa Rica y deja
//! que un inversionista la financie en USDC.
//!
//! Ciclo de vida de una factura:
//! `Registrada` → (inversionista paga el adelanto a la PYME) → `Financiada`
//! → (el pagador cancela el monto total al vencer) → `Pagada`.

use soroban_sdk::{contract, contracterror, contractimpl, contracttype, token, Address, BytesN, Env};

#[contracttype]
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
pub enum Estado {
    Registrada,
    Financiada,
    Pagada,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Factura {
    /// Hash de la clave numérica de 50 dígitos de Hacienda.
    pub clave: BytesN<32>,
    pub pyme: Address,
    /// Monto total de la factura, en unidades del token (USDC, 7 decimales).
    pub monto: i128,
    /// Lo que la PYME recibe hoy (monto menos el descuento).
    pub adelanto: i128,
    /// Fecha de vencimiento, en segundos Unix.
    pub vence: u64,
    pub inversionista: Option<Address>,
    pub estado: Estado,
}

#[contracttype]
enum Clave {
    Token,
    Factura(BytesN<32>),
}

#[contracterror]
#[derive(Clone, Copy, Debug, Eq, PartialEq)]
#[repr(u32)]
pub enum Error {
    YaExiste = 1,
    NoExiste = 2,
    EstadoInvalido = 3,
    MontoInvalido = 4,
}

#[contract]
pub struct FacturaPuraVida;

#[contractimpl]
impl FacturaPuraVida {
    /// Se llama una vez al desplegar: fija el token de pago (USDC).
    pub fn __constructor(env: Env, token_usdc: Address) {
        env.storage().instance().set(&Clave::Token, &token_usdc);
    }

    /// La PYME registra (tokeniza) una factura ya validada por Hacienda.
    pub fn registrar(
        env: Env,
        pyme: Address,
        clave: BytesN<32>,
        monto: i128,
        adelanto: i128,
        vence: u64,
    ) -> Result<(), Error> {
        pyme.require_auth();
        if monto <= 0 || adelanto <= 0 || adelanto > monto {
            return Err(Error::MontoInvalido);
        }
        let k = Clave::Factura(clave.clone());
        if env.storage().persistent().has(&k) {
            return Err(Error::YaExiste);
        }
        let factura = Factura { clave, pyme, monto, adelanto, vence, inversionista: None, estado: Estado::Registrada };
        env.storage().persistent().set(&k, &factura);
        Ok(())
    }

    /// El inversionista financia la factura: envía el adelanto en USDC a la PYME.
    pub fn financiar(env: Env, inversionista: Address, clave: BytesN<32>) -> Result<(), Error> {
        inversionista.require_auth();
        let k = Clave::Factura(clave);
        let mut f: Factura = env.storage().persistent().get(&k).ok_or(Error::NoExiste)?;
        if f.estado != Estado::Registrada {
            return Err(Error::EstadoInvalido);
        }
        Self::usdc(&env).transfer(&inversionista, &f.pyme, &f.adelanto);
        f.inversionista = Some(inversionista);
        f.estado = Estado::Financiada;
        env.storage().persistent().set(&k, &f);
        Ok(())
    }

    /// Al vencer, el pagador cancela el monto total y el inversionista lo recibe.
    pub fn pagar(env: Env, pagador: Address, clave: BytesN<32>) -> Result<(), Error> {
        pagador.require_auth();
        let k = Clave::Factura(clave);
        let mut f: Factura = env.storage().persistent().get(&k).ok_or(Error::NoExiste)?;
        if f.estado != Estado::Financiada {
            return Err(Error::EstadoInvalido);
        }
        let inversionista = f.inversionista.clone().ok_or(Error::EstadoInvalido)?;
        Self::usdc(&env).transfer(&pagador, &inversionista, &f.monto);
        f.estado = Estado::Pagada;
        env.storage().persistent().set(&k, &f);
        Ok(())
    }

    pub fn consultar(env: Env, clave: BytesN<32>) -> Result<Factura, Error> {
        env.storage().persistent().get(&Clave::Factura(clave)).ok_or(Error::NoExiste)
    }

    fn usdc(env: &Env) -> token::Client<'_> {
        let id: Address = env.storage().instance().get(&Clave::Token).unwrap();
        token::Client::new(env, &id)
    }
}

#[cfg(test)]
mod test;
