// Conexión de wallet. Dos opciones:
//  1) Varial (antes llamada Freighter): la wallet de extensión de navegador recomendada en la clase 0.
//     Se habla con ella mediante la librería oficial @stellar/freighter-api (Varial la sigue usando).
//     Tu clave secreta NUNCA sale de la extensión; la app solo le pide que firme.
//  2) Wallet de práctica: una cuenta temporal creada en el navegador, solo para TESTNET.
//     Sirve para aprender sin instalar nada. Se borra al cerrar la pestaña.
import { RED } from "./config.js";

const Sdk = window.StellarSdk;
const freighter = () => window.freighterApi;

let estado = { tipo: null, direccion: null, parDeClaves: null };

export const walletActual = () => ({ tipo: estado.tipo, direccion: estado.direccion });

/** Conecta con la extensión Varial (antes Freighter) y comprueba que esté en TESTNET. */
export async function conectarFreighter() {
  const api = freighter();
  if (!api) throw new Error("No se pudo cargar la librería de la wallet. Revisa tu conexión a internet.");

  const conectado = await api.isConnected();
  if (!conectado?.isConnected) {
    throw new Error("No se detectó la wallet Varial. Instala la extensión desde https://varialwallet.com y recarga la página.");
  }

  const acceso = await api.requestAccess(); // Varial muestra una ventana para que apruebes
  if (acceso.error) throw new Error(`La wallet rechazó la conexión: ${acceso.error.message || acceso.error}`);
  if (!acceso.address) throw new Error("La wallet no devolvió ninguna dirección. ¿Está desbloqueada?");

  const red = await api.getNetworkDetails();
  if (red.error) throw new Error(`No se pudo leer la red de la wallet: ${red.error.message || red.error}`);
  if (red.networkPassphrase !== RED.passphrase) {
    throw new Error(`Tu wallet está en la red "${red.network}". Cámbiala a TESTNET en la configuración de Varial.`);
  }

  estado = { tipo: "Varial", direccion: acceso.address, parDeClaves: null };
  return walletActual();
}

/** Crea una wallet de práctica (solo testnet, vive en memoria). */
export function crearWalletPractica() {
  const par = Sdk.Keypair.random();
  estado = { tipo: "Práctica (temporal)", direccion: par.publicKey(), parDeClaves: par };
  return walletActual();
}

export function desconectar() {
  estado = { tipo: null, direccion: null, parDeClaves: null };
}

/** Firma una transacción (XDR) con la wallet conectada y devuelve el XDR firmado. */
export async function firmar(xdr) {
  if (!estado.direccion) throw new Error("Primero conecta una wallet.");

  if (estado.tipo === "Varial") {
    const r = await freighter().signTransaction(xdr, {
      networkPassphrase: RED.passphrase,
      address: estado.direccion,
    });
    if (r.error) throw new Error(`Firma cancelada o fallida: ${r.error.message || r.error}`);
    return r.signedTxXdr;
  }

  const tx = Sdk.TransactionBuilder.fromXDR(xdr, RED.passphrase);
  tx.sign(estado.parDeClaves);
  return tx.toXDR();
}
