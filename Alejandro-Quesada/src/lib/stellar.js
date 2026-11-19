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
} from "../constants/stellar.js";

const server = new StellarSdk.Horizon.Server(HORIZON_URL);
const UNIT = 10n ** BigInt(USDC_DECIMALS);

// ─── helpers ─────────────────────────────────────────────────────────────────

function toStroops(amount) {
  const [whole, frac = ""] = String(amount).trim().split(".");
  const fracPadded = (frac + "0".repeat(USDC_DECIMALS)).slice(0, USDC_DECIMALS);
  return BigInt(whole || "0") * UNIT + BigInt(fracPadded || "0");
}

function fromStroops(value) {
  const v = BigInt(value);
  const whole = v / UNIT;
  const frac = (v % UNIT).toString().padStart(USDC_DECIMALS, "0");
  return `${whole}.${frac}`;
}

const isUsdc = (b) => b.asset_code === USDC_CODE && b.asset_issuer === USDC_ISSUER;

// Read-only client (simulations only) or signing client when publicKey/signXDR are given
function vaultClient(publicKey, signXDR) {
  return StellarSdk.contract.Client.from({
    contractId: VAULT_ADDRESS,
    rpcUrl: SOROBAN_RPC_URL,
    networkPassphrase: NETWORK_PASSPHRASE,
    publicKey,
    signTransaction: signXDR
      ? async (xdr) => ({ signedTxXdr: await signXDR(xdr) })
      : undefined,
  });
}

let readClientPromise;
function readVault() {
  readClientPromise ??= vaultClient().catch((err) => {
    readClientPromise = undefined;
    throw err;
  });
  return readClientPromise;
}

// ─── account ─────────────────────────────────────────────────────────────────

export async function fetchAccount(publicKey) {
  const account = await server.loadAccount(publicKey);
  const xlm = account.balances.find((b) => b.asset_type === "native");
  const usdc = account.balances.find(isUsdc);
  return {
    id: account.id,
    sequence: account.sequence,
    xlmBalance: xlm ? xlm.balance : "0",
    usdcBalance: usdc ? usdc.balance : "0",
    hasUsdcTrustline: !!usdc,
    balances: account.balances,
  };
}

export async function fundAccountWithFriendbot(publicKey) {
  const response = await fetch(`${FRIENDBOT_URL}/?addr=${publicKey}`);
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Friendbot failed: ${body}`);
  }
  return response.json();
}

// Blend testnet faucet: returns a tx (pre-signed by the issuer) that adds the
// trustlines and sends 1000 USDC. The user only has to co-sign it.
export async function getTestUsdc(publicKey, signXDR) {
  const resp = await fetch(`${BLEND_FAUCET_URL}?userId=${publicKey}`);
  if (!resp.ok) throw new Error(`Faucet de USDC falló (${resp.status})`);
  const xdr = (await resp.text()).trim().replace(/^"|"$/g, "");
  const signed = await signXDR(xdr);
  const tx = StellarSdk.TransactionBuilder.fromXDR(signed, NETWORK_PASSPHRASE);
  return server.submitTransaction(tx);
}

// ─── history ─────────────────────────────────────────────────────────────────

// Vault deposits/withdrawals are Soroban calls; Horizon reports them as
// invoke_host_function records with the resulting USDC transfers.
export async function fetchPaymentHistory(publicKey, limit = 20) {
  const page = await server
    .payments()
    .forAccount(publicKey)
    .order("desc")
    .limit(limit)
    .call();

  return page.records.map((p) => {
    const base = {
      id: p.id,
      type: p.type,
      createdAt: p.created_at,
      sourceAccount: p.source_account,
      transactionHash: p.transaction_hash,
    };

    if (p.type === "invoke_host_function") {
      const change = (p.asset_balance_changes ?? []).find(
        (c) => c.from === VAULT_ADDRESS || c.to === VAULT_ADDRESS
      );
      if (!change) return { ...base, kind: "contract", amount: null, assetCode: null, from: null, to: null };
      const deposit = change.to === VAULT_ADDRESS;
      return {
        ...base,
        kind: deposit ? "deposit" : "withdraw",
        amount: change.amount,
        assetCode: change.asset_code ?? "XLM",
        from: change.from,
        to: change.to,
      };
    }

    return {
      ...base,
      kind: p.type === "create_account" ? "create_account" : p.to === publicKey ? "received" : "sent",
      amount: p.amount ?? p.starting_balance ?? null,
      assetCode: p.asset_type === "native" || p.type === "create_account" ? "XLM" : p.asset_code,
      from: p.from ?? p.funder ?? null,
      to: p.to ?? p.account ?? null,
    };
  });
}

// ─── vault ───────────────────────────────────────────────────────────────────

// Total USDC managed by the vault (idle + invested in Blend)
export async function fetchPoolBalance() {
  try {
    const v = await readVault();
    const { result } = await v.fetch_total_managed_funds();
    const funds = result?.unwrap ? result.unwrap() : result;
    return fromStroops(funds?.[0]?.total_amount ?? 0n);
  } catch {
    return "0";
  }
}

// Vault-wide numbers: TVL, how much is invested vs idle, total shares, share price
export async function fetchVaultInfo() {
  const v = await readVault();
  const [{ result: fundsRes }, { result: supply }] = await Promise.all([
    v.fetch_total_managed_funds(),
    v.total_supply(),
  ]);
  const funds = (fundsRes?.unwrap ? fundsRes.unwrap() : fundsRes)?.[0] ?? {};
  const total = BigInt(funds.total_amount ?? 0n);
  const shares = BigInt(supply ?? 0n);
  return {
    tvl: fromStroops(total),
    invested: fromStroops(funds.invested_amount ?? 0n),
    idle: fromStroops(funds.idle_amount ?? 0n),
    totalShares: fromStroops(shares),
    // USDC per dfToken, 7 decimals
    sharePrice: shares > 0n ? fromStroops((total * UNIT) / shares) : "1.0000000",
  };
}

// User position: vault shares (dfTokens) and their USDC value
export async function fetchVaultPosition(publicKey) {
  const v = await readVault();
  const shares = BigInt((await v.balance({ id: publicKey })).result ?? 0n);
  if (shares === 0n) return { shares: "0", usdc: "0" };
  const { result } = await v.get_asset_amounts_per_shares({ vault_shares: shares });
  const amounts = result?.unwrap ? result.unwrap() : result;
  return { shares: fromStroops(shares), usdc: fromStroops(amounts?.[0] ?? 0n) };
}

// Deposit USDC into the DeFindex vault (invest=true → goes to the Blend strategy)
export async function sendContribution(publicKey, amount, signXDR) {
  const amt = toStroops(amount);
  if (amt <= 0n) throw new Error("Monto inválido");
  const v = await vaultClient(publicKey, signXDR);
  const tx = await v.deposit({
    amounts_desired: [amt],
    amounts_min: [(amt * 99n) / 100n],
    from: publicKey,
    invest: true,
  });
  const sent = await tx.signAndSend();
  return { hash: sent.sendTransactionResponse?.hash ?? sent.getTransactionResponse?.txHash };
}

// Withdraw a USDC amount (converted to shares) from the vault
export async function withdrawFromVault(publicKey, amount, position, signXDR) {
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
  const sent = await tx.signAndSend();
  return { hash: sent.sendTransactionResponse?.hash ?? sent.getTransactionResponse?.txHash };
}
