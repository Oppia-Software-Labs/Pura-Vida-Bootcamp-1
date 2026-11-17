/**
 * Canonical Stellar Testnet values.
 *
 * This module is the single source of truth for network identity across the app.
 * Every other module must import from here instead of inlining a URL, a passphrase
 * or a reserve constant: duplicated network configuration is how a Testnet app ends
 * up signing a Mainnet transaction.
 */

export const TESTNET = {
  network: "testnet",
  /** Varial/Horizon report the network as an upper-case identifier. */
  walletNetwork: "TESTNET",
  passphrase: "Test SDF Network ; September 2015",
  horizonUrl: "https://horizon-testnet.stellar.org",
} as const;

export const STELLAR_EXPERT_TESTNET_URL = "https://stellar.expert/explorer/testnet";
export const FRIENDBOT_URL = "https://friendbot.stellar.org";

/** Ledger entries lock 0.5 XLM each; an account is two base reserves. */
export const BASE_RESERVE_XLM = "0.5";
export const MINIMUM_ACCOUNT_BALANCE_XLM = "1";

/** A text memo is capped at 28 bytes of UTF-8, not 28 characters. */
export const MEMO_TEXT_MAX_BYTES = 28;

export const TRANSACTION_TIMEOUT_SECONDS = 180;
export const TRANSACTIONS_PAGE_SIZE = 10;

export const STELLAR_ADDRESS_PREFIX = "G";
export const STELLAR_ADDRESS_LENGTH = 56;

export function explorerTransactionUrl(hash: string): string {
  return `${STELLAR_EXPERT_TESTNET_URL}/tx/${hash}`;
}

export function explorerAccountUrl(address: string): string {
  return `${STELLAR_EXPERT_TESTNET_URL}/account/${address}`;
}
