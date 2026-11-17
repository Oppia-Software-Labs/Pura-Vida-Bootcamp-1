import { Horizon } from "@stellar/stellar-sdk";
import {
  disconnect,
  getNetworkDetails,
  isConnected,
  requestAccess,
} from "@stellar/varial-sdk";
import {
  FRIENDBOT_URL,
  HORIZON_URL,
  NETWORK_PASSPHRASE,
  STELLAR_NETWORK,
} from "./stellar";

export type WalletErrorCode =
  | "not-installed"
  | "access-denied"
  | "wrong-network"
  | "friendbot-failed"
  | "unknown";

export class WalletError extends Error {
  constructor(
    public readonly code: WalletErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "WalletError";
  }
}

export interface WalletConnection {
  address: string;
  network: string;
  networkPassphrase: string;
}

export interface AccountSnapshot {
  exists: boolean;
  xlmBalance: string | null;
}

export interface WalletAdapter {
  connect(): Promise<WalletConnection>;
  disconnect(): Promise<void>;
  getAccount(address: string): Promise<AccountSnapshot>;
  fundWithFriendbot(address: string): Promise<AccountSnapshot>;
}

const horizon = new Horizon.Server(HORIZON_URL);

function extensionMessage(error: { message?: string } | undefined, fallback: string) {
  return error?.message || fallback;
}

function isNotFound(error: unknown) {
  if (!error || typeof error !== "object" || !("response" in error)) return false;
  const response = (error as { response?: { status?: number } }).response;
  return response?.status === 404;
}

async function readAccount(address: string): Promise<AccountSnapshot> {
  try {
    const account = await horizon.loadAccount(address);
    const native = account.balances.find((balance) => balance.asset_type === "native");
    return { exists: true, xlmBalance: native?.balance ?? "0" };
  } catch (error) {
    if (isNotFound(error)) return { exists: false, xlmBalance: null };
    throw error;
  }
}

export const varialWalletAdapter: WalletAdapter = {
  async connect() {
    const availability = await isConnected();
    if (availability.error) {
      throw new WalletError(
        "not-installed",
        extensionMessage(availability.error, "Varial is not available."),
      );
    }
    if (!availability.isConnected) {
      throw new WalletError("not-installed", "Varial is not installed or enabled.");
    }

    const access = await requestAccess();
    if (access.error || !access.address) {
      throw new WalletError(
        "access-denied",
        extensionMessage(access.error, "The wallet connection was rejected."),
      );
    }

    const network = await getNetworkDetails();
    if (network.error) {
      throw new WalletError(
        "unknown",
        extensionMessage(network.error, "Varial did not return its network."),
      );
    }

    if (
      network.network.toUpperCase() !== STELLAR_NETWORK ||
      network.networkPassphrase !== NETWORK_PASSPHRASE
    ) {
      throw new WalletError("wrong-network", `Expected ${STELLAR_NETWORK}.`);
    }

    return {
      address: access.address,
      network: network.network,
      networkPassphrase: network.networkPassphrase,
    };
  },

  async disconnect() {
    const result = await disconnect();
    if (result.error) {
      throw new WalletError(
        "unknown",
        extensionMessage(result.error, "Varial could not disconnect."),
      );
    }
  },

  getAccount: readAccount,

  async fundWithFriendbot(address: string) {
    const response = await fetch(`${FRIENDBOT_URL}?addr=${encodeURIComponent(address)}`);
    if (!response.ok) {
      let detail = "Friendbot could not fund this account.";
      try {
        const payload = (await response.json()) as { detail?: string };
        detail = payload.detail || detail;
      } catch {
        // Friendbot may return a non-JSON upstream error.
      }
      throw new WalletError("friendbot-failed", detail);
    }
    return readAccount(address);
  },
};
