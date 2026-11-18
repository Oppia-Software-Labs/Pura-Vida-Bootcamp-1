import {
  Asset,
  Horizon,
  Memo,
  Networks,
  Operation,
  TransactionBuilder,
} from "@stellar/stellar-sdk";
import { FRIENDBOT_URL, HORIZON_URL } from "./config";
import type { PaymentRequest } from "./links";
import { formatXlm, toStroops } from "./validation";

export const server = new Horizon.Server(HORIZON_URL);

const DEFAULT_BASE_RESERVE = 5_000_000n; // 0.5 XLM
const DEFAULT_FEE = 100; // stroops

export const isNotFound = (e: any) =>
  e?.response?.status === 404 || e?.status === 404 || e?.name === "NotFoundError";

/** Reintenta errores de red/5xx. No reintenta 4xx (404, 400…): esos son respuestas reales. */
export async function withRetry<T>(fn: () => Promise<T>, tries = 3): Promise<T> {
  let last: unknown;
  for (let i = 0; i < tries; i++) {
    try {
      return await fn();
    } catch (e: any) {
      last = e;
      const status = e?.response?.status ?? e?.status;
      if (status && status < 500) throw e;
      await new Promise((r) => setTimeout(r, 600 * (i + 1)));
    }
  }
  throw last;
}

export interface AccountInfo {
  exists: boolean;
  balance: bigint; // stroops
  reserve: bigint; // stroops bloqueados por reserva mínima
  spendable: bigint; // stroops que realmente se pueden gastar
}

export const EMPTY_ACCOUNT: AccountInfo = { exists: false, balance: 0n, reserve: 0n, spendable: 0n };

async function getBaseReserve(): Promise<bigint> {
  try {
    const page = await withRetry(() => server.ledgers().order("desc").limit(1).call());
    const v = (page.records[0] as any)?.base_reserve_in_stroops;
    return v ? BigInt(v) : DEFAULT_BASE_RESERVE;
  } catch {
    return DEFAULT_BASE_RESERVE;
  }
}

export async function getBaseFee(): Promise<number> {
  try {
    return await withRetry(() => server.fetchBaseFee());
  } catch {
    return DEFAULT_FEE;
  }
}

export async function getAccountInfo(address: string): Promise<AccountInfo> {
  try {
    const acc: any = await withRetry(() => server.loadAccount(address));
    const native = acc.balances.find((b: any) => b.asset_type === "native");
    const balance = toStroops(native?.balance ?? "0");
    const selling = toStroops(native?.selling_liabilities ?? "0");
    const base = await getBaseReserve();
    const entries =
      2n + BigInt(acc.subentry_count ?? 0) + BigInt(acc.num_sponsoring ?? 0) - BigInt(acc.num_sponsored ?? 0);
    const reserve = (entries < 2n ? 2n : entries) * base;
    const spendable = balance - reserve - selling;
    return { exists: true, balance, reserve, spendable: spendable > 0n ? spendable : 0n };
  } catch (e) {
    if (isNotFound(e)) return EMPTY_ACCOUNT;
    throw e;
  }
}

export async function accountExists(address: string): Promise<boolean> {
  try {
    await withRetry(() => server.loadAccount(address));
    return true;
  } catch (e) {
    if (isNotFound(e)) return false;
    throw e;
  }
}

export async function fundWithFriendbot(address: string): Promise<void> {
  const res = await fetch(`${FRIENDBOT_URL}/?addr=${encodeURIComponent(address)}`);
  if (!res.ok) throw new Error("Friendbot no pudo fondear la cuenta. Inténtalo de nuevo en unos segundos.");
}

/** Arma la transacción de pago (Operation.payment + memo de texto). */
export async function buildPaymentXdr(payer: string, req: PaymentRequest, fee: number): Promise<string> {
  const source = await withRetry(() => server.loadAccount(payer));
  const tx = new TransactionBuilder(source, { fee: String(fee), networkPassphrase: Networks.TESTNET })
    .addOperation(Operation.payment({ destination: req.to, asset: Asset.native(), amount: req.amount }))
    .addMemo(Memo.text(req.memo))
    .setTimeout(180)
    .build();
  return tx.toXDR();
}

export async function submitSignedXdr(signedXdr: string): Promise<string> {
  const tx = TransactionBuilder.fromXDR(signedXdr, Networks.TESTNET);
  const res = await server.submitTransaction(tx);
  return res.hash;
}

/** Traduce cualquier error (wallet, Horizon, red) a un mensaje claro en español. */
export function explainError(e: any): string {
  const msg = String(e?.message ?? e ?? "");
  if (e?.code === -4 || /reject|declin|cancel|denied|closed/i.test(msg))
    return "Cancelaste la firma en la wallet. No se envió ningún pago.";

  const codes = e?.response?.data?.extras?.result_codes;
  if (codes) {
    const all = [codes.transaction, ...(codes.operations ?? [])].join(",");
    if (/underfunded|insufficient_balance/.test(all)) return "Saldo insuficiente para completar el pago.";
    if (/no_destination/.test(all)) return "La cuenta destino no existe en Testnet, el pago fallaría.";
    if (/bad_seq/.test(all)) return "La cuenta cambió mientras firmabas. Intenta de nuevo.";
    if (/insufficient_fee/.test(all)) return "La red está congestionada: la comisión quedó corta. Intenta de nuevo.";
    return `La red rechazó la transacción (${all}).`;
  }
  if (/network|fetch|failed to|timeout|503|502|504/i.test(msg) || e?.response?.status >= 500)
    return "Horizon no responde en este momento. Revisa tu conexión e inténtalo otra vez.";
  if (/not (installed|found)|no wallet/i.test(msg)) return "No encontramos una wallet instalada. Instala Varial, xBull o usa Albedo.";
  return msg || "Algo salió mal. Inténtalo de nuevo.";
}

export const formatBalance = (s: bigint) => formatXlm(s);
