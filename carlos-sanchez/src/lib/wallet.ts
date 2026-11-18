import { Horizon } from "@stellar/stellar-sdk";
import { StellarWalletsKit } from "@creit.tech/stellar-wallets-kit/sdk";
import { defaultModules } from "@creit.tech/stellar-wallets-kit/modules/utils";
import { Networks } from "@creit.tech/stellar-wallets-kit/types";
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
let kitInitialized = false;

function initializeWalletsKit() {
  if (kitInitialized) return;

  StellarWalletsKit.init({
    modules: defaultModules(),
    network: Networks.TESTNET,
    authModal: {
      showInstallLabel: true,
      hideUnsupportedWallets: false,
    },
  });
  kitInitialized = true;
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

export async function signWithWalletsKit(
  xdr: string,
  options?: { networkPassphrase?: string; address?: string },
) {
  initializeWalletsKit();
  return StellarWalletsKit.signTransaction(xdr, {
    networkPassphrase: options?.networkPassphrase ?? NETWORK_PASSPHRASE,
    address: options?.address,
  });
}

export const stellarWalletsKitAdapter: WalletAdapter = {
  async connect() {
    initializeWalletsKit();
    StellarWalletsKit.setNetwork(Networks.TESTNET);

    try {
      const { address } = await StellarWalletsKit.authModal();
      const network = await StellarWalletsKit.getNetwork();

      if (network.networkPassphrase !== NETWORK_PASSPHRASE) {
        await StellarWalletsKit.disconnect();
        throw new WalletError("wrong-network", `Expected ${STELLAR_NETWORK}.`);
      }

      return {
        address,
        network: network.network || STELLAR_NETWORK,
        networkPassphrase: network.networkPassphrase,
      };
    } catch (error) {
      if (error instanceof WalletError) throw error;
      throw new WalletError(
        "access-denied",
        error instanceof Error ? error.message : "The wallet connection was cancelled.",
      );
    }
  },

  async disconnect() {
    initializeWalletsKit();
    try {
      await StellarWalletsKit.disconnect();
    } catch (error) {
      throw new WalletError(
        "unknown",
        error instanceof Error ? error.message : "The wallet could not disconnect.",
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
