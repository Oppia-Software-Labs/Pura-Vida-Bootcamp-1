import { StellarError } from "./errors.ts";

const UNITS_PER_XLM = 10_000_000n;
export const MAX_PAYMENT = 10;

export function decimalUnits(value: string): bigint {
  if (!/^\d+(?:\.\d{1,7})?$/.test(value)) {
    throw new StellarError("balance", "El monto debe tener como máximo siete decimales.");
  }
  const [whole, fraction = ""] = value.split(".");
  return BigInt(whole) * UNITS_PER_XLM + BigInt(fraction.padEnd(7, "0"));
}

export function xlmFromUnits(units: bigint): string {
  const fraction = (units % UNITS_PER_XLM).toString().padStart(7, "0").replace(/0+$/, "");
  return `${units / UNITS_PER_XLM}${fraction ? `.${fraction}` : ""}`;
}

export function paymentAmount(raw: string) {
  const clean = raw.trim().replace(",", ".");
  if (clean.length > 12) throw new StellarError("balance", "Ingresá un monto mayor a cero y de hasta 10 XLM de prueba.");
  const units = decimalUnits(clean);
  if (units < 1n || units > BigInt(MAX_PAYMENT) * UNITS_PER_XLM) {
    throw new StellarError("balance", "Ingresá un monto mayor a cero y de hasta 10 XLM de prueba.");
  }
  return xlmFromUnits(units);
}

export function displayDecimal(value: string) {
  const [whole, fraction] = value.split(".");
  const significant = fraction?.replace(/0+$/, "");
  return `${whole}${significant ? `,${significant}` : ""}`;
}
