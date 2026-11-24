import {
  Asset, BASE_FEE, Memo, NotFoundError, Operation, StrKey, TransactionBuilder,
} from "@stellar/stellar-sdk";
import { config, horizon } from "./stellar";

export type TipInput = { from: string; to: string; amount: string; memo: string };

export function validateTip({ from, to, amount, memo }: TipInput): string | null {
  if (!StrKey.isValidEd25519PublicKey(to)) return "La dirección destino no es una cuenta Stellar válida (G…).";
  if (to === from) return "No puedes enviarte una propina a ti mismo.";
  if (!/^\d+(\.\d{1,7})?$/.test(amount) || Number(amount) <= 0) return "Monto inválido (máx. 7 decimales).";
  if (new TextEncoder().encode(memo).length > 28) return "El memo admite máximo 28 bytes.";
  return null;
}

/** Construye la transacción. Si el destino no existe en Testnet usa createAccount (mín. 1 XLM). */
export async function buildTipTx({ from, to, amount, memo }: TipInput) {
  const source = await horizon.loadAccount(from);

  let destinationExists = true;
  try { await horizon.loadAccount(to); } catch (e) {
    if (e instanceof NotFoundError) destinationExists = false; else throw e;
  }
  if (!destinationExists && Number(amount) < 1) {
    throw new Error("La cuenta destino no existe aún: la primera propina debe ser de al menos 1 XLM para crearla.");
  }

  const op = destinationExists
    ? Operation.payment({ destination: to, asset: Asset.native(), amount })
    : Operation.createAccount({ destination: to, startingBalance: amount });

  const builder = new TransactionBuilder(source, { fee: BASE_FEE, networkPassphrase: config.networkPassphrase })
    .addOperation(op)
    .setTimeout(180);
  if (memo) builder.addMemo(Memo.text(memo));
  return builder.build().toXDR();
}

export async function submitSigned(signedXdr: string) {
  const tx = TransactionBuilder.fromXDR(signedXdr, config.networkPassphrase);
  const res = await horizon.submitTransaction(tx);
  return res.hash;
}

/** Traduce los errores de Horizon a mensajes entendibles. */
export function explainError(e: unknown): string {
  const codes = (e as { response?: { data?: { extras?: { result_codes?: { transaction?: string; operations?: string[] } } } } })
    ?.response?.data?.extras?.result_codes;
  const op = codes?.operations?.[0];
  if (op === "op_underfunded") return "Saldo insuficiente (recuerda la reserva mínima de la cuenta).";
  if (op === "op_low_reserve") return "El monto no alcanza la reserva mínima para crear la cuenta destino.";
  if (codes?.transaction === "tx_bad_seq") return "Secuencia desactualizada, intenta de nuevo.";
  if (codes?.transaction === "tx_too_late") return "La transacción expiró antes de enviarse.";
  if (codes) return `Horizon rechazó la transacción: ${codes.transaction ?? ""} ${codes.operations?.join(", ") ?? ""}`.trim();
  const msg = e instanceof Error ? e.message : (e as { message?: string })?.message ?? String(e);
  if (/reject|declin|cancel/i.test(msg)) return "Firma cancelada en la wallet.";
  return msg;
}
