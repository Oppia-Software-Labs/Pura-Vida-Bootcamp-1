export function shortAddress(address: string, size = 4): string {
  if (address.length <= size * 2 + 1) return address;
  return `${address.slice(0, size)}…${address.slice(-size)}`;
}

export function formatXlm(value: string | number, maxDigits = 2): string {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return String(value);

  return new Intl.NumberFormat("es-CR", {
    maximumFractionDigits: maxDigits,
  }).format(parsed);
}

export function formatDate(value: string): string {
  return new Intl.DateTimeFormat("es-CR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function readingMinutes(words: number): number {
  return Math.max(1, Math.round(words / 200));
}

export function splitDeposit(price: string): {
  fee: string;
  offerer: string;
} {
  const total = Number(price);
  const fee = Math.round(total * 0.05 * 1e7) / 1e7;
  const offerer = Math.round((total - fee) * 1e7) / 1e7;

  return { fee: fee.toFixed(7), offerer: offerer.toFixed(7) };
}

export function ratingLabel(value: number): string {
  if (value <= 0) return "Sin reseñas";
  return value.toFixed(1);
}

export function plural(
  count: number,
  singular: string,
  pluralForm: string,
): string {
  return count === 1 ? singular : pluralForm;
}
