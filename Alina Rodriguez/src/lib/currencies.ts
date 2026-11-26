// Monedas soportadas para registrar gastos.
export type Currency = {
  code: string;
  name: string;
  flag: string;
  symbol?: string;
  decimals: number;
  crypto?: boolean;
};

export const CURRENCIES: Currency[] = [
  { code: "CRC", name: "Colón costarricense", flag: "🇨🇷", symbol: "₡", decimals: 2 },
  { code: "USD", name: "Dólar estadounidense", flag: "🇺🇸", symbol: "$", decimals: 2 },
  { code: "EUR", name: "Euro", flag: "🇪🇺", symbol: "€", decimals: 2 },
  { code: "XLM", name: "Stellar Lumens", flag: "✦", decimals: 2, crypto: true },
  { code: "USDC", name: "USD Coin", flag: "◎", decimals: 2, crypto: true },
  { code: "MXN", name: "Peso mexicano", flag: "🇲🇽", decimals: 2 },
  { code: "GTQ", name: "Quetzal guatemalteco", flag: "🇬🇹", symbol: "Q", decimals: 2 },
  { code: "HNL", name: "Lempira hondureño", flag: "🇭🇳", symbol: "L", decimals: 2 },
  { code: "NIO", name: "Córdoba nicaragüense", flag: "🇳🇮", symbol: "C$", decimals: 2 },
  { code: "PAB", name: "Balboa panameño", flag: "🇵🇦", symbol: "B/.", decimals: 2 },
  { code: "DOP", name: "Peso dominicano", flag: "🇩🇴", symbol: "RD$", decimals: 2 },
  { code: "COP", name: "Peso colombiano", flag: "🇨🇴", decimals: 2 },
  { code: "PEN", name: "Sol peruano", flag: "🇵🇪", symbol: "S/", decimals: 2 },
  { code: "CLP", name: "Peso chileno", flag: "🇨🇱", decimals: 0 },
  { code: "ARS", name: "Peso argentino", flag: "🇦🇷", decimals: 2 },
  { code: "UYU", name: "Peso uruguayo", flag: "🇺🇾", decimals: 2 },
  { code: "BRL", name: "Real brasileño", flag: "🇧🇷", symbol: "R$", decimals: 2 },
  { code: "CAD", name: "Dólar canadiense", flag: "🇨🇦", symbol: "CA$", decimals: 2 },
  { code: "GBP", name: "Libra esterlina", flag: "🇬🇧", symbol: "£", decimals: 2 },
  { code: "CHF", name: "Franco suizo", flag: "🇨🇭", decimals: 2 },
  { code: "JPY", name: "Yen japonés", flag: "🇯🇵", symbol: "¥", decimals: 0 },
  { code: "CNY", name: "Yuan chino", flag: "🇨🇳", symbol: "CN¥", decimals: 2 },
  { code: "KRW", name: "Won surcoreano", flag: "🇰🇷", symbol: "₩", decimals: 0 },
  { code: "INR", name: "Rupia india", flag: "🇮🇳", symbol: "₹", decimals: 2 },
  { code: "AUD", name: "Dólar australiano", flag: "🇦🇺", symbol: "A$", decimals: 2 },
];

const BY_CODE = new Map(CURRENCIES.map((c) => [c.code, c]));

export function currency(code: string): Currency {
  return BY_CODE.get(code) ?? { code, name: code, flag: "", decimals: 2 };
}

export function decimals(code: string): number {
  return currency(code).decimals;
}

/** Convierte a unidades mínimas (enteros) para evitar errores de redondeo. */
export function toMinor(amount: number, code: string): number {
  return Math.round((amount || 0) * 10 ** decimals(code));
}

export function fromMinor(minor: number, code: string): number {
  return minor / 10 ** decimals(code);
}

export function roundTo(amount: number, code: string): number {
  return fromMinor(toMinor(amount, code), code);
}

export function formatMoney(amount: number, code: string, opts: { sign?: boolean } = {}): string {
  const c = currency(code);
  const abs = Math.abs(amount);
  const num = abs.toLocaleString("es-CR", {
    minimumFractionDigits: c.decimals === 0 || Number.isInteger(abs) ? 0 : c.decimals,
    maximumFractionDigits: c.decimals,
  });
  const neg = amount < 0 ? "−" : opts.sign && amount > 0 ? "+" : "";
  if (c.crypto) return `${neg}${num} ${c.code}`;
  if (c.symbol) return `${neg}${c.symbol}${num}`;
  return `${neg}${c.code} ${num}`;
}
