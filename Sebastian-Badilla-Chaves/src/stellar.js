import {
  Horizon,
  TransactionBuilder,
  Operation,
  Asset,
  Memo,
  StrKey,
  BASE_FEE,
} from "@stellar/stellar-sdk";
import { HORIZON_URL, FRIENDBOT_URL, NETWORK_PASSPHRASE } from "./config.js";

const server = new Horizon.Server(HORIZON_URL);

// Devuelve el saldo de XLM, o null si la cuenta todavía no existe en la red.
export async function getXlmBalance(address) {
  try {
    const account = await server.loadAccount(address);
    const native = account.balances.find((b) => b.asset_type === "native");
    return native ? native.balance : "0";
  } catch (err) {
    if (err?.response?.status === 404) return null;
    throw err;
  }
}

// Friendbot crea y fondea la cuenta en Testnet con 10 000 XLM de prueba.
export async function fundWithFriendbot(address) {
  const res = await fetch(`${FRIENDBOT_URL}?addr=${encodeURIComponent(address)}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || "Friendbot no pudo fondear la cuenta.");
  }
  return res.json();
}

export function isValidAddress(address) {
  return StrKey.isValidEd25519PublicKey(address);
}
