import * as StellarSdk from "@stellar/stellar-sdk";

export type StellarNetworkId = "testnet" | "mainnet";

export interface StellarNetworkConfig {
  id: StellarNetworkId;
  label: string;
  shortLabel: string;
  horizonUrl: string;
  networkPassphrase: string;
  friendbotUrl: string | null;
  explorerUrl: string;
}

export const NETWORK_CONFIGS: Record<StellarNetworkId, StellarNetworkConfig> = {
  testnet: {
    id: "testnet",
    label: "Stellar Testnet",
    shortLabel: "Testnet",
    horizonUrl: "https://horizon-testnet.stellar.org",
    networkPassphrase: StellarSdk.Networks.TESTNET,
    friendbotUrl: "https://friendbot.stellar.org",
    explorerUrl: "https://stellar.expert/explorer/testnet",
  },
  mainnet: {
    id: "mainnet",
    label: "Stellar Mainnet",
    shortLabel: "Mainnet",
    horizonUrl: "https://horizon.stellar.org",
    networkPassphrase: StellarSdk.Networks.PUBLIC,
    friendbotUrl: null,
    explorerUrl: "https://stellar.expert/explorer/public",
  },
};

const horizonServers: Record<StellarNetworkId, StellarSdk.Horizon.Server> = {
  testnet: new StellarSdk.Horizon.Server(NETWORK_CONFIGS.testnet.horizonUrl),
  mainnet: new StellarSdk.Horizon.Server(NETWORK_CONFIGS.mainnet.horizonUrl),
};

export function getNetworkConfig(networkId: StellarNetworkId): StellarNetworkConfig {
  return NETWORK_CONFIGS[networkId];
}

export function getHorizonServer(
  networkId: StellarNetworkId
): StellarSdk.Horizon.Server {
  return horizonServers[networkId];
}

export interface AssetBalance {
  code: string;
  issuer: string | null;
  balance: string;
  isNative: boolean;
}

export interface AccountSnapshot {
  address: string;
  funded: boolean;
  xlmBalance: string;
  balances: AssetBalance[];
  subentryCount: number;
  sequence: string | null;
  lastModifiedLedger: number | null;
}

export interface PaymentRecord {
  id: string;
  transactionHash: string;
  createdAt: string;
  type: "create_account" | "payment" | "path_payment" | "other";
  direction: "in" | "out" | "self";
  counterparty: string;
  amount: string;
  assetCode: string;
  successful: boolean;
}

export function isValidStellarAddress(address: string): boolean {
  return StellarSdk.StrKey.isValidEd25519PublicKey(address.trim());
}

export function shortenAddress(address: string, head = 6, tail = 6): string {
  if (address.length <= head + tail + 3) return address;
  return `${address.slice(0, head)}…${address.slice(-tail)}`;
}

export function formatXlm(value: string | number): string {
  const num = typeof value === "number" ? value : Number.parseFloat(value);
  if (Number.isNaN(num)) return "0.00";
  return new Intl.NumberFormat("es-CR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 7,
  }).format(num);
}

export async function fetchAccountSnapshot(
  address: string,
  networkId: StellarNetworkId = "testnet"
): Promise<AccountSnapshot> {
  const horizon = getHorizonServer(networkId);
  try {
    const account = await horizon.loadAccount(address);

    const balances: AssetBalance[] = account.balances
      .map((entry): AssetBalance | null => {
        if (entry.asset_type === "native") {
          return {
            code: "XLM",
            issuer: null,
            balance: entry.balance,
            isNative: true,
          };
        }
        if (
          entry.asset_type === "credit_alphanum4" ||
          entry.asset_type === "credit_alphanum12"
        ) {
          return {
            code: entry.asset_code,
            issuer: entry.asset_issuer,
            balance: entry.balance,
            isNative: false,
          };
        }
        return null;
      })
      .filter((item): item is AssetBalance => item !== null)
      .sort((a, b) => Number(b.isNative) - Number(a.isNative));

    const native = balances.find((b) => b.isNative);

    return {
      address,
      funded: true,
      xlmBalance: native?.balance ?? "0",
      balances,
      subentryCount: account.subentry_count,
      sequence: account.sequence,
      lastModifiedLedger: account.last_modified_ledger ?? null,
    };
  } catch (error) {
    if (error instanceof StellarSdk.NotFoundError) {
      return {
        address,
        funded: false,
        xlmBalance: "0",
        balances: [],
        subentryCount: 0,
        sequence: null,
        lastModifiedLedger: null,
      };
    }
    throw error;
  }
}

export async function fundWithFriendbot(
  address: string
): Promise<{ hash: string | null }> {
  const friendbotUrl = NETWORK_CONFIGS.testnet.friendbotUrl;
  if (!friendbotUrl) {
    throw new Error("Friendbot solo está disponible en Stellar Testnet.");
  }

  const response = await fetch(
    `${friendbotUrl}?addr=${encodeURIComponent(address)}`
  );

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as {
      detail?: string;
    } | null;
    throw new Error(
      body?.detail ||
        `Friendbot respondió con estado ${response.status}. Intenta de nuevo.`
    );
  }

  const data = (await response.json().catch(() => null)) as {
    hash?: string;
  } | null;
  return { hash: data?.hash ?? null };
}

export async function fetchRecentPayments(
  address: string,
  networkId: StellarNetworkId = "testnet",
  limit = 10
): Promise<PaymentRecord[]> {
  const horizon = getHorizonServer(networkId);
  try {
    const page = await horizon
      .payments()
      .forAccount(address)
      .order("desc")
      .limit(limit)
      .call();

    return page.records.map((raw): PaymentRecord => {
      const record = raw as unknown as Record<string, unknown>;
      const opType = String(record.type ?? "other");
      const txHash = String(record.transaction_hash ?? "");
      const createdAt = String(record.created_at ?? "");
      const successful = Boolean(record.transaction_successful ?? true);

      if (opType === "create_account") {
        const funder = String(record.funder ?? "");
        const created = String(record.account ?? "");
        const direction = created === address ? "in" : "out";
        return {
          id: String(record.id ?? txHash),
          transactionHash: txHash,
          createdAt,
          type: "create_account",
          direction,
          counterparty: direction === "in" ? funder : created,
          amount: String(record.starting_balance ?? "0"),
          assetCode: "XLM",
          successful,
        };
      }

      if (
        opType === "payment" ||
        opType === "path_payment_strict_receive" ||
        opType === "path_payment_strict_send"
      ) {
        const from = String(record.from ?? "");
        const to = String(record.to ?? "");
        const direction =
          from === address && to === address
            ? "self"
            : to === address
              ? "in"
              : "out";
        const assetType = String(record.asset_type ?? "native");
        const assetCode =
          assetType === "native" ? "XLM" : String(record.asset_code ?? "ASSET");
        return {
          id: String(record.id ?? txHash),
          transactionHash: txHash,
          createdAt,
          type: opType === "payment" ? "payment" : "path_payment",
          direction,
          counterparty: direction === "in" ? from : to,
          amount: String(record.amount ?? "0"),
          assetCode,
          successful,
        };
      }

      return {
        id: String(record.id ?? txHash),
        transactionHash: txHash,
        createdAt,
        type: "other",
        direction: "out",
        counterparty: String(record.source_account ?? address),
        amount: "0",
        assetCode: "XLM",
        successful,
      };
    });
  } catch (error) {
    if (error instanceof StellarSdk.NotFoundError) {
      return [];
    }
    throw error;
  }
}

export function getExplorerAccountUrl(
  address: string,
  networkId: StellarNetworkId = "testnet"
): string {
  return `${getNetworkConfig(networkId).explorerUrl}/account/${address}`;
}

export function getExplorerTxUrl(
  hash: string,
  networkId: StellarNetworkId = "testnet"
): string {
  return `${getNetworkConfig(networkId).explorerUrl}/tx/${hash}`;
}
