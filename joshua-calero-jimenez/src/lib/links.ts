import {
  isValidAddress,
  validateAmount,
  validateDesc,
  validateLabel,
  validateMemo,
} from "./validation";
import { TESTNET_PASSPHRASE } from "./config";

export interface PaymentRequest {
  to: string;
  amount: string;
  memo: string;
  label?: string;
  desc?: string;
}

export function buildPayLink(r: PaymentRequest, origin = window.location.origin): string {
  const p = new URLSearchParams({ to: r.to, amount: r.amount, memo: r.memo });
  if (r.label) p.set("label", r.label);
  if (r.desc) p.set("desc", r.desc);
  return `${origin}/pagar?${p.toString()}`;
}

/** URI SEP-7 (extra): algunas wallets lo abren directamente. */
export function buildSep7Uri(r: PaymentRequest): string {
  const p = new URLSearchParams({
    destination: r.to,
    amount: r.amount,
    memo: r.memo,
    memo_type: "MEMO_TEXT",
    network_passphrase: TESTNET_PASSPHRASE,
  });
  if (r.label) p.set("msg", r.label);
  return `web+stellar:pay?${p.toString()}`;
}

export type ParsedLink = { ok: true; request: PaymentRequest } | { ok: false; error: string };

export function parsePayParams(search: string): ParsedLink {
  const p = new URLSearchParams(search);
  const to = (p.get("to") ?? "").trim();
  const amount = (p.get("amount") ?? "").trim();
  const memo = p.get("memo") ?? "";
  const label = p.get("label") ?? "";
  const desc = p.get("desc") ?? "";

  if (!to || !amount || !memo)
    return { ok: false, error: "El link está incompleto: faltan datos del cobro." };
  if (!isValidAddress(to))
    return { ok: false, error: "La dirección de destino del link no es válida." };
  const err =
    validateAmount(amount) ?? validateMemo(memo) ?? validateLabel(label) ?? validateDesc(desc);
  if (err) return { ok: false, error: `El link trae datos inválidos o alterados. ${err}` };

  return {
    ok: true,
    request: { to, amount, memo, label: label || undefined, desc: desc || undefined },
  };
}
