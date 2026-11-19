import * as StellarSdk from "@stellar/stellar-sdk";
import {
  HORIZON_URL,
  SOROBAN_RPC_URL,
  FRIENDBOT_URL,
  NETWORK_PASSPHRASE,
  VAULT_ADDRESS,
  USDC_CODE,
  USDC_ISSUER,
  USDC_DECIMALS,
  BLEND_FAUCET_URL,
} from "@/constants/stellar";

// ─── types ───────────────────────────────────────────────────────────────────

export type SignXDR = (xdr: string) => Promise<string>;

export interface AccountInfo {
  id: string;
  sequence: string;
  xlmBalance: string;
  usdcBalance: string;
  hasUsdcTrustline: boolean;
}

export type PaymentKind = "deposit" | "withdraw" | "received" | "sent" | "create_account" | "contract";

export interface PaymentRecord {
  id: string;
  type: string;
  kind: PaymentKind;
  createdAt: string;
  sourceAccount: string;
  transactionHash: string;
  amount: string | null;
  assetCode: string | null;
  from: string | null;
  to: string | null;
}

export interface VaultInfo {
  tvl: string;
  invested: string;
  idle: string;
  totalShares: string;
  /** USDC per dfToken */
  sharePrice: string;
}

export interface VaultPosition {
  shares: string;
  usdc: string;
}

export interface TxResult {
  hash: string;
}

interface ManagedFunds {
  asset: string;
  idle_amount: bigint;
  invested_amount: bigint;
  total_amount: bigint;
}

// The vault's methods are discovered at runtime from its on-chain spec.
type AssembledTx<T> = StellarSdk.contract.AssembledTransaction<T>;
interface VaultClient {
  deposit(args: {
    amounts_desired: bigint[];
    amounts_min: bigint[];
    from: string;
    invest: boolean;
  }): Promise<AssembledTx<unknown>>;
  withdraw(args: { withdraw_shares: bigint; min_amounts_out: bigint[]; from: string }): Promise<AssembledTx<unknown>>;
  balance(args: { id: string }): Promise<AssembledTx<bigint>>;
  total_supply(): Promise<AssembledTx<bigint>>;
  fetch_total_managed_funds(): Promise<AssembledTx<ManagedFunds[] | StellarSdk.contract.Result<ManagedFunds[]>>>;
  get_asset_amounts_per_shares(args: {
    vault_shares: bigint;
  }): Promise<AssembledTx<bigint[] | StellarSdk.contract.Result<bigint[]>>>;
}

// ─── helpers ─────────────────────────────────────────────────────────────────

const server = new StellarSdk.Horizon.Server(HORIZON_URL);
const UNIT = 10n ** BigInt(USDC_DECIMALS);

function toStroops(amount: string | number): bigint {
  const [whole, frac = ""] = String(amount).trim().split(".");
  const fracPadded = (frac + "0".repeat(USDC_DECIMALS)).slice(0, USDC_DECIMALS);
  return BigInt(whole || "0") * UNIT + BigInt(fracPadded || "0");
}

function fromStroops(value: bigint | number | string): string {
  const v = BigInt(value);
  const whole = v / UNIT;
  const frac = (v % UNIT).toString().padStart(USDC_DECIMALS, "0");
  return `${whole}.${frac}`;
}

function unwrap<T>(value: T | StellarSdk.contract.Result<T>): T {
  const maybe = value as { unwrap?: () => T };
  return typeof maybe?.unwrap === "function" ? maybe.unwrap() : (value as T);
}

type Balance = StellarSdk.Horizon.HorizonApi.BalanceLine;
const isUsdc = (b: Balance) =>
  "asset_code" in b && b.asset_code === USDC_CODE && b.asset_issuer === USDC_ISSUER;

// Read-only client (simulations only) or signing client when publicKey/signXDR are given
async function vaultClient(publicKey?: string, signXDR?: SignXDR): Promise<VaultClient> {
  const client = await StellarSdk.contract.Client.from({
    contractId: VAULT_ADDRESS,
    rpcUrl: SOROBAN_RPC_URL,
    networkPassphrase: NETWORK_PASSPHRASE,
    publicKey,
    signTransaction: signXDR ? async (xdr: string) => ({ signedTxXdr: await signXDR(xdr) }) : undefined,
  });
  return client as unknown as VaultClient;
}

let readClientPromise: Promise<VaultClient> | undefined;
function readVault(): Promise<VaultClient> {
  readClientPromise ??= vaultClient().catch((err) => {
    readClientPromise = undefined;
    throw err;
  });
  return readClientPromise;
}

async function signAndSend(tx: AssembledTx<unknown>): Promise<TxResult> {
  const sent = await tx.signAndSend();
  const hash = sent.sendTransactionResponse?.hash ?? sent.getTransactionResponse?.txHash ?? "";
  return { hash };
}

// ─── account ─────────────────────────────────────────────────────────────────

export async function fetchAccount(publicKey: string): Promise<AccountInfo> {
  const account = await server.loadAccount(publicKey);
  const xlm = account.balances.find((b) => b.asset_type === "native");
  const usdc = account.balances.find(isUsdc);
  return {
    id: account.id,
    sequence: account.sequence,
    xlmBalance: xlm ? xlm.balance : "0",
    usdcBalance: usdc ? usdc.balance : "0",
    hasUsdcTrustline: !!usdc,
  };
}

export async function fundAccountWithFriendbot(publicKey: string): Promise<unknown> {
  const response = await fetch(`${FRIENDBOT_URL}/?addr=${publicKey}`);
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Friendbot failed: ${body}`);
  }
  return response.json();
}

// Blend testnet faucet: returns a tx (pre-signed by the issuer) that adds the
// trustlines and sends 1000 USDC. The user only has to co-sign it.
export async function getTestUsdc(publicKey: string, signXDR: SignXDR): Promise<TxResult> {
  const resp = await fetch(`${BLEND_FAUCET_URL}?userId=${publicKey}`);
  if (!resp.ok) throw new Error(`Faucet de USDC falló (${resp.status})`);
  const xdr = (await resp.text()).trim().replace(/^"|"$/g, "");
  const signed = await signXDR(xdr);
  const tx = StellarSdk.TransactionBuilder.fromXDR(signed, NETWORK_PASSPHRASE);
  const res = await server.submitTransaction(tx);
  return { hash: res.hash };
}

// ─── history ─────────────────────────────────────────────────────────────────

interface BalanceChange {
  asset_code?: string;
  from: string;
  to: string;
  amount: string;
}

// Vault deposits/withdrawals are Soroban calls; Horizon reports them as
// invoke_host_function records with the resulting USDC transfers.
export async function fetchPaymentHistory(publicKey: string, limit = 20): Promise<PaymentRecord[]> {
  const page = await server.payments().forAccount(publicKey).order("desc").limit(limit).call();

  return page.records.map((record) => {
    const p = record as unknown as Record<string, unknown> & {
      id: string;
      type: string;
      created_at: string;
      source_account: string;
      transaction_hash: string;
    };
    const base = {
      id: p.id,
      type: p.type,
      createdAt: p.created_at,
      sourceAccount: p.source_account,
      transactionHash: p.transaction_hash,
    };

    if (p.type === "invoke_host_function") {
      const changes = (p.asset_balance_changes as BalanceChange[] | undefined) ?? [];
      const change = changes.find((c) => c.from === VAULT_ADDRESS || c.to === VAULT_ADDRESS);
      if (!change) {
        return { ...base, kind: "contract", amount: null, assetCode: null, from: null, to: null };
      }
      return {
        ...base,
        kind: change.to === VAULT_ADDRESS ? "deposit" : "withdraw",
        amount: change.amount,
        assetCode: change.asset_code ?? "XLM",
        from: change.from,
        to: change.to,
      };
    }

    const to = (p.to ?? p.account ?? null) as string | null;
    const isNative = p.asset_type === "native" || p.type === "create_account";
    return {
      ...base,
      kind: p.type === "create_account" ? "create_account" : to === publicKey ? "received" : "sent",
      amount: (p.amount ?? p.starting_balance ?? null) as string | null,
      assetCode: isNative ? "XLM" : ((p.asset_code as string | undefined) ?? null),
      from: (p.from ?? p.funder ?? null) as string | null,
      to,
    };
  });
}

// ─── vault ───────────────────────────────────────────────────────────────────

// Vault-wide numbers: TVL, how much is invested vs idle, total shares, share price
export async function fetchVaultInfo(): Promise<VaultInfo> {
  const v = await readVault();
  const [fundsTx, supplyTx] = await Promise.all([v.fetch_total_managed_funds(), v.total_supply()]);
  const funds: Partial<ManagedFunds> = unwrap(fundsTx.result)?.[0] ?? {};
  const total = BigInt(funds.total_amount ?? 0n);
  const shares = BigInt(supplyTx.result ?? 0n);
  return {
    tvl: fromStroops(total),
    invested: fromStroops(funds.invested_amount ?? 0n),
    idle: fromStroops(funds.idle_amount ?? 0n),
    totalShares: fromStroops(shares),
    sharePrice: shares > 0n ? fromStroops((total * UNIT) / shares) : "1.0000000",
  };
}

// User position: vault shares (dfTokens) and their USDC value
export async function fetchVaultPosition(publicKey: string): Promise<VaultPosition> {
  const v = await readVault();
  const shares = BigInt((await v.balance({ id: publicKey })).result ?? 0n);
  if (shares === 0n) return { shares: "0", usdc: "0" };
  const { result } = await v.get_asset_amounts_per_shares({ vault_shares: shares });
  return { shares: fromStroops(shares), usdc: fromStroops(unwrap(result)?.[0] ?? 0n) };
}

// Deposit USDC into the DeFindex vault (invest=true → goes to the Blend strategy)
export async function depositToVault(publicKey: string, amount: string, signXDR: SignXDR): Promise<TxResult> {
  const amt = toStroops(amount);
  if (amt <= 0n) throw new Error("Monto inválido");
  const v = await vaultClient(publicKey, signXDR);
  const tx = await v.deposit({
    amounts_desired: [amt],
    amounts_min: [(amt * 99n) / 100n],
    from: publicKey,
    invest: true,
  });
  return signAndSend(tx);
}

// Withdraw a USDC amount (converted to shares) from the vault
export async function withdrawFromVault(
  publicKey: string,
  amount: string,
  position: VaultPosition,
  signXDR: SignXDR,
): Promise<TxResult> {
  const want = toStroops(amount);
  const totalShares = toStroops(position.shares);
  const totalUsdc = toStroops(position.usdc);
  if (want <= 0n || totalUsdc === 0n) throw new Error("Monto inválido");
  const out = want >= totalUsdc ? totalUsdc : want;
  const shares = want >= totalUsdc ? totalShares : (want * totalShares) / totalUsdc;
  const v = await vaultClient(publicKey, signXDR);
  const tx = await v.withdraw({
    withdraw_shares: shares,
    min_amounts_out: [(out * 98n) / 100n],
    from: publicKey,
  });
  return signAndSend(tx);
}
