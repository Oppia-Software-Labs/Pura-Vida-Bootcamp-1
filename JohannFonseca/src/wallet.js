import {
  isConnected,
  requestAccess,
  getAddress,
  getNetwork,
  signTransaction,
} from "@stellar/freighter-api";
import { Keypair, StrKey } from "@stellar/stellar-sdk";

const DEMO_STORAGE_KEY = "splitxlm_demo_keypair_v1";

/**
 * Verifica si la extension oficial Freighter Wallet esta instalada en el navegador.
 */
export async function isFreighterAvailable() {
  try {
    const res = await isConnected();
    return Boolean(!res.error && res.isConnected);
  } catch {
    return false;
  }
}

/**
 * Conecta la wallet de Stellar usando Freighter.
 */
export async function connectFreighterWallet() {
  const installed = await isFreighterAvailable();
  if (!installed) {
    throw new Error(
      "Freighter Wallet no fue detectada en este navegador. Instala la extension desde freighter.app o usa el modo Wallet Demo integrada en Testnet."
    );
  }
  const res = await requestAccess();
  if (res.error) {
    throw new Error(formatWalletError(res.error));
  }
  localStorage.removeItem(DEMO_STORAGE_KEY);
  return {
    address: res.address,
    mode: "freighter",
  };
}

/**
 * Crea o recupera una Wallet de Stellar real en Testnet integrada en el navegador
 * para usuarios o amigos que abran el link de pago desde un dispositivo sin Freighter.
 */
export function connectInstantTestnetWallet() {
  let secret = localStorage.getItem(DEMO_STORAGE_KEY);
  let pair;
  if (secret && StrKey.isValidEd25519SecretSeed(secret)) {
    pair = Keypair.fromSecret(secret);
  } else {
    pair = Keypair.random();
    localStorage.setItem(DEMO_STORAGE_KEY, pair.secret());
  }
  return {
    address: pair.publicKey(),
    mode: "instant-testnet",
  };
}

/**
 * Recupera una sesion activa (Freighter o Instant Testnet Wallet).
 */
export async function restoreWalletSession() {
  const secret = localStorage.getItem(DEMO_STORAGE_KEY);
  if (secret && StrKey.isValidEd25519SecretSeed(secret)) {
    const pair = Keypair.fromSecret(secret);
    return {
      address: pair.publicKey(),
      mode: "instant-testnet",
    };
  }

  if (await isFreighterAvailable()) {
    const res = await getAddress();
    if (!res.error && res.address) {
      return {
        address: res.address,
        mode: "freighter",
      };
    }
  }
  return null;
}

export function disconnectWalletSession() {
  localStorage.removeItem(DEMO_STORAGE_KEY);
}

export async function getActiveNetwork(mode) {
  if (mode === "instant-testnet") {
    return { network: "TESTNET" };
  }
  const res = await getNetwork();
  if (res.error) throw new Error(formatWalletError(res.error));
  return res;
}

/**
 * Firma una transaccion XDR con Freighter o con la llave local de Testnet.
 */
export async function signStellarTransaction(xdr, networkPassphrase, address, mode) {
  if (mode === "instant-testnet") {
    const secret = localStorage.getItem(DEMO_STORAGE_KEY);
    if (!secret) throw new Error("No se encontro la llave de la Wallet de Testnet.");
    return { mode: "local-secret", secret };
  }

  const res = await signTransaction(xdr, {
    networkPassphrase,
    address,
  });
  if (res.error) throw new Error(formatWalletError(res.error));
  return { mode: "signed-xdr", signedTxXdr: res.signedTxXdr };
}

export function shortenAddress(addr) {
  if (!addr || addr.length < 12) return addr || "";
  return `${addr.slice(0, 6)}...${addr.slice(-6)}`;
}

function formatWalletError(err) {
  if (typeof err === "string") return err;
  return err?.message || "Error al comunicarse con la wallet de Stellar.";
}
