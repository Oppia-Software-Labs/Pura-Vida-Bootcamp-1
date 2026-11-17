import { Networks, StrKey } from "@stellar/stellar-sdk";

export const STELLAR_NETWORK = "TESTNET";
export const NETWORK_PASSPHRASE = Networks.TESTNET;
export const HORIZON_URL = "https://horizon-testnet.stellar.org";
export const RPC_URL = "https://soroban-testnet.stellar.org";
export const FRIENDBOT_URL = "https://friendbot.stellar.org";

export function isValidAccountAddress(value: string) {
  return StrKey.isValidEd25519PublicKey(value.trim());
}

export function truncateAddress(address: string, edge = 5) {
  if (address.length <= edge * 2 + 3) return address;
  return `${address.slice(0, edge)}…${address.slice(-edge)}`;
}
