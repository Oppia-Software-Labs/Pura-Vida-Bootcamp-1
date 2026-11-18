import {
  Asset,
  BASE_FEE,
  Horizon,
  Networks,
  Operation,
  StrKey,
  TransactionBuilder,
} from "@stellar/stellar-sdk";

export const STELLAR = {
  network: "Testnet",
  networkPassphrase: Networks.TESTNET,
  horizonUrl: "https://horizon-testnet.stellar.org",
  friendbotUrl: "https://friendbot.stellar.org",
  explorerUrl: "https://stellar.expert/explorer/testnet",
} as const;

export const horizon = new Horizon.Server(STELLAR.horizonUrl);

export interface WalletBalance {
  asset: string;
  balance: string;
}

export interface AccountSnapshot {
  balances: WalletBalance[];
  nativeBalance: string;
  sequence: string;
}

export type PaymentKind = "received" | "sent" | "created";

export interface PaymentRecord {
  id: string;
  kind: PaymentKind;
  amount: string;
  asset: string;
  counterparty: string;
  createdAt: string;
  transactionHash: string;
}

interface RawPayment {
  id: string;
  type: string;
  created_at: string;
  transaction_hash: string;
  from?: string;
  to?: string;
  funder?: string;
  account?: string;
  amount?: string;
  starting_balance?: string;
  asset_type?: string;
  asset_code?: string;
}

function isNotFound(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof (error as { response?: { status?: number } }).response?.status ===
      "number" &&
    (error as { response: { status: number } }).response.status === 404
  );
}

export function shortAddress(address: string, size = 4): string {
  if (address.length <= size * 2 + 1) return address;
  return `${address.slice(0, size)}…${address.slice(-size)}`;
}

export function formatAmount(value: string): string {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return value;
  return new Intl.NumberFormat("es-CR", {
    maximumFractionDigits: 7,
  }).format(parsed);
}

export function isValidAddress(address: string): boolean {
  return StrKey.isValidEd25519PublicKey(address.trim());
}

export function explorerAccountUrl(address: string): string {
  return `${STELLAR.explorerUrl}/account/${address}`;
}

export function explorerTxUrl(hash: string): string {
  return `${STELLAR.explorerUrl}/tx/${hash}`;
}

export async function loadAccount(
  address: string,
): Promise<AccountSnapshot | null> {
  try {
    const account = await horizon.loadAccount(address);
    const balances: WalletBalance[] = account.balances.flatMap((balance) => {
      if (balance.asset_type === "native") {
        return [{ asset: "XLM", balance: balance.balance }];
      }

      if (balance.asset_type === "liquidity_pool_shares") {
        return [];
      }

      return [
        {
          asset: balance.asset_code,
          balance: balance.balance,
        },
      ];
    });

    return {
      balances,
      nativeBalance:
        balances.find((balance) => balance.asset === "XLM")?.balance ?? "0",
      sequence: account.sequenceNumber(),
    };
  } catch (error) {
    if (isNotFound(error)) return null;
    throw error;
  }
}

export async function loadPayments(address: string): Promise<PaymentRecord[]> {
  const page = await horizon
    .payments()
    .forAccount(address)
    .order("desc")
    .limit(12)
    .call();

  const records = page.records as unknown as RawPayment[];

  return records
    .filter((record) =>
      ["payment", "create_account"].includes(record.type),
    )
    .map((record) => {
      if (record.type === "create_account") {
        return {
          id: record.id,
          kind: "created" as const,
          amount: record.starting_balance ?? "0",
          asset: "XLM",
          counterparty: record.funder ?? record.account ?? "",
          createdAt: record.created_at,
          transactionHash: record.transaction_hash,
        };
      }

      const incoming = record.to === address;

      return {
        id: record.id,
        kind: incoming ? ("received" as const) : ("sent" as const),
        amount: record.amount ?? "0",
        asset:
          record.asset_type === "native" ? "XLM" : (record.asset_code ?? "—"),
        counterparty: incoming ? (record.from ?? "") : (record.to ?? ""),
        createdAt: record.created_at,
        transactionHash: record.transaction_hash,
      };
    });
}

export async function fundWithFriendbot(address: string): Promise<void> {
  const response = await fetch(
    `${STELLAR.friendbotUrl}?addr=${encodeURIComponent(address)}`,
  );

  if (!response.ok) {
    let detail = "";

    try {
      const body = (await response.json()) as {
        detail?: string;
        title?: string;
      };
      detail = body.detail ?? body.title ?? "";
    } catch {
      detail = "";
    }

    if (/already|exist/i.test(detail)) {
      throw new Error("Esta cuenta ya tiene fondos en Testnet.");
    }

    throw new Error(
      detail || "Friendbot no pudo fondear la cuenta. Intenta de nuevo.",
    );
  }
}

export function validatePayment(
  destination: string,
  amount: string,
  availableBalance: string,
): string | null {
  const cleanDestination = destination.trim();
  const cleanAmount = amount.trim();

  if (!cleanDestination) return "Escribe la dirección de destino.";
  if (!isValidAddress(cleanDestination)) {
    return "Esa dirección no es una cuenta Stellar válida.";
  }
  if (!cleanAmount) return "Escribe el monto a enviar.";
  if (!/^\d+(\.\d{1,7})?$/.test(cleanAmount)) {
    return "Usa un monto válido con máximo 7 decimales.";
  }

  const parsedAmount = Number(cleanAmount);
  if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
    return "El monto debe ser mayor que cero.";
  }

  const parsedBalance = Number(availableBalance);
  if (!Number.isFinite(parsedBalance) || parsedBalance <= 0) {
    return "Tu cuenta no tiene XLM disponible en Testnet.";
  }

  if (parsedAmount > parsedBalance) {
    return "No tienes suficiente XLM para cubrir ese monto.";
  }

  return null;
}

export async function buildPaymentXdr(
  sourceAddress: string,
  destination: string,
  amount: string,
): Promise<string> {
  const account = await horizon.loadAccount(sourceAddress);

  const transaction = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: STELLAR.networkPassphrase,
  })
    .addOperation(
      Operation.payment({
        destination: destination.trim(),
        asset: Asset.native(),
        amount: amount.trim(),
      }),
    )
    .setTimeout(180)
    .build();

  return transaction.toXDR();
}

export async function submitSignedXdr(
  signedXdr: string,
): Promise<{ hash: string; ledger: number }> {
  const transaction = TransactionBuilder.fromXDR(
    signedXdr,
    STELLAR.networkPassphrase,
  );

  const response = await horizon.submitTransaction(transaction);

  return { hash: response.hash, ledger: response.ledger };
}
