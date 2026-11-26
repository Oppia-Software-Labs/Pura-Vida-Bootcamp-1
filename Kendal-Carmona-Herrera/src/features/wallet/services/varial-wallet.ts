import * as varialSdk from "@stellar/varial-sdk";

import type { WalletError, WalletErrorCode } from "../types";

/**
 * Wallets phrase the refusal slightly differently across versions, so the refusal
 * wording is matched instead of the full sentence. It must stay narrow: a bare
 * "rejected" would also match network refusals and report them as a user cancel.
 * Numeric `code` values are undocumented and must never be branched on.
 */
const REJECTION_PATTERN = /\buser\s+rejected\b|\brejected\s+this\s+request\b/i;

const UNKNOWN_WALLET_ERROR_MESSAGE = "The wallet returned an unexpected response.";

/**
 * Carries a classified code alongside the wallet's own message so callers can branch
 * on `code` without re-parsing text.
 */
export class WalletAdapterError extends Error {
  readonly code: WalletErrorCode;

  constructor(code: WalletErrorCode, message: string) {
    super(message);
    this.name = "WalletAdapterError";
    this.code = code;
  }
}

function readErrorMessage(error: unknown): string | null {
  if (typeof error === "string") {
    const trimmed = error.trim();
    return trimmed === "" ? null : trimmed;
  }

  if (typeof error === "object" && error !== null && "message" in error) {
    const message = error.message;
    if (typeof message === "string" && message.trim() !== "") return message.trim();
  }

  return null;
}

/**
 * Pure classifier: `rejected` when the wallet reports a user refusal, `unknown`
 * otherwise. It only inspects the value it is given, never the SDK.
 */
export function mapSdkError(error: unknown): WalletError {
  const message = readErrorMessage(error);

  if (message !== null && REJECTION_PATTERN.test(message)) {
    return { code: "rejected", message };
  }

  return { code: "unknown", message: message ?? UNKNOWN_WALLET_ERROR_MESSAGE };
}

/** The SDK signals a missing grant with an empty string, not with an error. */
function normalizeAddress(address: string): string | null {
  const trimmed = address.trim();
  return trimmed === "" ? null : trimmed;
}

export async function isWalletInstalled(): Promise<boolean> {
  try {
    const result = await varialSdk.isConnected();
    return result.error === undefined && result.isConnected;
  } catch {
    // No documented throwing path; a throw still means no usable wallet.
    return false;
  }
}

export async function readAuthorizedAddress(): Promise<string | null> {
  try {
    const result = await varialSdk.getAddress();
    if (result.error !== undefined) return null;
    return normalizeAddress(result.address);
  } catch {
    return null;
  }
}

export async function requestWalletAccess(): Promise<string> {
  try {
    const result = await varialSdk.requestAccess();

    if (result.error !== undefined) {
      const mapped = mapSdkError(result.error);
      throw new WalletAdapterError(mapped.code, mapped.message);
    }

    const address = normalizeAddress(result.address);

    if (address === null) {
      throw new WalletAdapterError("unavailable", "The wallet did not share a public key.");
    }

    return address;
  } catch (error) {
    if (error instanceof WalletAdapterError) throw error;

    const mapped = mapSdkError(error);
    throw new WalletAdapterError(mapped.code, mapped.message);
  }
}

export async function readWalletNetwork(): Promise<{
  network: string;
  networkPassphrase: string;
} | null> {
  try {
    const result = await varialSdk.getNetwork();
    if (result.error !== undefined) return null;

    const network = result.network.trim();
    // An empty identifier would produce a false "connected on testnet" reading.
    if (network === "") return null;

    return { network, networkPassphrase: result.networkPassphrase.trim() };
  } catch {
    return null;
  }
}

/**
 * Asks the extension to sign the prepared XDR and returns only what it signed.
 * The SDK reports a refusal by resolving with an `error` field instead of throwing,
 * so both channels are checked; a blank signature is rejected as well.
 */
export async function signPaymentTransaction(
  xdr: string,
  networkPassphrase: string,
  address: string,
): Promise<string> {
  try {
    const result = await varialSdk.signTransaction(xdr, {
      networkPassphrase,
      address,
    });

    if (result.error !== undefined) {
      const mapped = mapSdkError(result.error);
      throw new WalletAdapterError(mapped.code, mapped.message);
    }

    const signedXdr = result.signedTxXdr.trim();

    if (signedXdr === "") {
      throw new WalletAdapterError(
        "unavailable",
        "The wallet returned an empty signature.",
      );
    }

    return signedXdr;
  } catch (error) {
    if (error instanceof WalletAdapterError) throw error;

    const mapped = mapSdkError(error);
    throw new WalletAdapterError(mapped.code, mapped.message);
  }
}

/**
 * Polls the extension for account and network changes. Creation failures are
 * returned as a no-op handle instead of throwing, so a wallet that disappears
 * mid-session never breaks the calling component.
 */
export function createWalletWatcher(
  onChange: (next: { address: string; network: string; networkPassphrase: string }) => void,
): { stop: () => void } {
  let watcher: varialSdk.WatchWalletChanges | null = null;
  let stopped = false;

  try {
    const instance = new varialSdk.WatchWalletChanges();

    // `watch` reports a failed start through its return value rather than throwing.
    const start = instance.watch((params) => {
      if (stopped || params.error !== undefined) return;

      const address = params.address.trim();
      // An empty address means the extension lost its grant; keep the last known
      // state instead of publishing a half-filled session.
      if (address === "") return;

      onChange({
        address,
        network: params.network,
        networkPassphrase: params.networkPassphrase,
      });
    });

    if (start.error !== undefined) {
      instance.stop();
    } else {
      watcher = instance;
    }
  } catch {
    watcher = null;
  }

  return {
    stop: () => {
      stopped = true;
      watcher?.stop();
    },
  };
}
