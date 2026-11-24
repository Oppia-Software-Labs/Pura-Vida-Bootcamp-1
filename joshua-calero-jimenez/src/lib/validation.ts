import { StrKey } from "@stellar/stellar-sdk";
import { DESC_MAX, LABEL_MAX, MAX_AMOUNT, MEMO_MAX_BYTES } from "./config";

export const byteLength = (s: string) => new TextEncoder().encode(s).length;

export const isValidAddress = (a: string) => StrKey.isValidEd25519PublicKey(a);

export const shortAddress = (a: string) =>
  a.length > 12 ? `${a.slice(0, 4)}…${a.slice(-4)}` : a;

/** Devuelve null si es válido, o un mensaje en español. */
export function validateAmount(raw: string): string | null {
  const v = raw.trim();
  if (!v) return "Escribe un monto.";
  if (!/^\d+(\.\d+)?$/.test(v)) return "El monto debe ser un número positivo.";
  const decimals = v.split(".")[1]?.length ?? 0;
  if (decimals > 7) return "El monto admite máximo 7 decimales.";
  const n = Number(v);
  if (!(n > 0)) return "El monto debe ser mayor que 0.";
  if (n > MAX_AMOUNT) return "El monto es demasiado grande.";
  return null;
}

export function validateMemo(raw: string): string | null {
  if (!raw.trim()) return "El concepto es obligatorio.";
  if (byteLength(raw) > MEMO_MAX_BYTES)
    return `El concepto admite máximo ${MEMO_MAX_BYTES} bytes (acentos y emojis pesan más).`;
  return null;
}

export const validateLabel = (raw: string) =>
  raw.length > LABEL_MAX ? `La etiqueta admite máximo ${LABEL_MAX} caracteres.` : null;

export const validateDesc = (raw: string) =>
  raw.length > DESC_MAX ? `La descripción admite máximo ${DESC_MAX} caracteres.` : null;

/** "5" -> 50000000n. Compara montos sin errores de coma flotante. */
export function toStroops(amount: string): bigint {
  const [i, f = ""] = amount.trim().split(".");
  return BigInt(i || "0") * 10_000_000n + BigInt(f.padEnd(7, "0").slice(0, 7) || "0");
}

export function formatXlm(stroops: bigint): string {
  const neg = stroops < 0n;
  const abs = neg ? -stroops : stroops;
  const i = abs / 10_000_000n;
  const f = (abs % 10_000_000n).toString().padStart(7, "0").replace(/0+$/, "");
  return `${neg ? "-" : ""}${i}${f ? "." + f : ""}`;
}
