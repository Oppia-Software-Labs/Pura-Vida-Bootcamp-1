import {
  FRIENDBOT_URL,
  STELLAR_EXPERT_TESTNET_URL,
  TESTNET,
} from "./constants";

/**
 * Environment is read through static `process.env.NEXT_PUBLIC_*` property access so
 * Next.js can inline the values at build time. Dynamic access would be undefined in
 * the browser bundle.
 */
const requestedNetwork = process.env.NEXT_PUBLIC_STELLAR_NETWORK ?? TESTNET.network;
const requestedHorizonUrl =
  process.env.NEXT_PUBLIC_STELLAR_HORIZON_URL ?? TESTNET.horizonUrl;
const requestedPassphrase =
  process.env.NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE ?? TESTNET.passphrase;

const normalizedNetwork = requestedNetwork.trim().toLowerCase();
const isTestnet =
  normalizedNetwork === TESTNET.network && requestedPassphrase === TESTNET.passphrase;

/**
 * Misconfiguration is reported as data instead of thrown at import time: a wrong
 * `.env` should render an explanation, not a blank error page.
 */
function describeMisconfiguration(): string | null {
  if (normalizedNetwork !== TESTNET.network) {
    return `Unsupported network "${requestedNetwork}". StellarView only supports Stellar Testnet.`;
  }

  if (requestedPassphrase !== TESTNET.passphrase) {
    return "The configured network passphrase does not match Stellar Testnet. Signing would produce invalid transactions.";
  }

  return null;
}

export const stellarConfig = Object.freeze({
  network: requestedNetwork,
  walletNetwork: TESTNET.walletNetwork,
  horizonUrl: requestedHorizonUrl,
  networkPassphrase: requestedPassphrase,
  explorerUrl: STELLAR_EXPERT_TESTNET_URL,
  friendbotUrl: FRIENDBOT_URL,
  isTestnet,
  misconfiguration: describeMisconfiguration(),
});

export type StellarConfig = typeof stellarConfig;

export class StellarConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "StellarConfigurationError";
  }
}

/**
 * Fail closed before any read or write reaches the network.
 */
export function assertTestnetConfiguration(): void {
  if (stellarConfig.misconfiguration) {
    throw new StellarConfigurationError(stellarConfig.misconfiguration);
  }
}

/**
 * A wallet can be configured for a different network than the app. Both signals are
 * checked: the network identifier and, when exposed, the passphrase it would sign with.
 */
export function isWalletOnTestnet(
  network: string | null | undefined,
  passphrase?: string | null,
): boolean {
  if (!network) return false;
  if (network.trim().toUpperCase() !== TESTNET.walletNetwork) return false;
  if (passphrase == null || passphrase === "") return true;
  return passphrase === TESTNET.passphrase;
}
