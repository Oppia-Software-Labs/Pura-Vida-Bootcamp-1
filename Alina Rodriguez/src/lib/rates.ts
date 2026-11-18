// Tipos de cambio: unidades de cada moneda por 1 USD.
// Fuentes públicas sin llave: open.er-api.com (monedas del mundo) y el DEX de Stellar (XLM).

export type Rates = { perUsd: Record<string, number>; updatedAt: number; live: boolean };

const CACHE_KEY = "teja-a-teja:rates-v2";
const MAX_AGE = 60 * 60 * 1000; // 1 hora

// Valores aproximados por si no hay internet o las APIs fallan.
const FALLBACK: Record<string, number> = {
  USD: 1, USDC: 1, CRC: 446, EUR: 0.86, XLM: 7.3, MXN: 18.4, GTQ: 7.7, HNL: 26.2,
  NIO: 36.8, PAB: 1, DOP: 63, COP: 3900, PEN: 3.4, CLP: 940, ARS: 1450, UYU: 40,
  BRL: 5.4, CAD: 1.4, GBP: 0.76, CHF: 0.8, JPY: 152, CNY: 7.1, KRW: 1430, INR: 88.5, AUD: 1.53,
};

let current: Rates = loadCached() ?? { perUsd: FALLBACK, updatedAt: 0, live: false };
let inflight: Promise<Rates> | null = null;

function loadCached(): Rates | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? (JSON.parse(raw) as Rates) : null;
  } catch {
    return null;
  }
}

export function getRates(): Rates {
  return current;
}

export async function refreshRates(force = false): Promise<Rates> {
  if (!force && current.live && Date.now() - current.updatedAt < MAX_AGE) return current;
  if (inflight) return inflight;
  inflight = (async () => {
    const perUsd: Record<string, number> = { ...FALLBACK };
    let live = false;
    try {
      const res = await fetch("https://open.er-api.com/v6/latest/USD");
      const json = await res.json();
      if (json?.rates) {
        for (const [k, v] of Object.entries(json.rates)) if (typeof v === "number") perUsd[k] = v;
        live = true;
      }
    } catch {
      /* usamos valores aproximados */
    }
    perUsd.XLM = (await xlmPerUsdFromDex()) ?? (await xlmPerUsdFromCoinGecko()) ?? FALLBACK.XLM;
    perUsd.USDC = 1;
    current = { perUsd, updatedAt: Date.now(), live };
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(current));
    } catch {
      /* sin almacenamiento */
    }
    inflight = null;
    return current;
  })();
  return inflight;
}

// Precio de XLM desde el DEX de Stellar (mainnet): libro de órdenes XLM/USDC de Circle.
const USDC_ISSUER = "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN";
async function xlmPerUsdFromDex(): Promise<number | null> {
  try {
    const url =
      "https://horizon.stellar.org/order_book?selling_asset_type=native&buying_asset_type=credit_alphanum4" +
      `&buying_asset_code=USDC&buying_asset_issuer=${USDC_ISSUER}&limit=1`;
    const json = await (await fetch(url)).json();
    const bid = parseFloat(json?.bids?.[0]?.price);
    const ask = parseFloat(json?.asks?.[0]?.price);
    const mid = bid && ask ? (bid + ask) / 2 : bid || ask; // USDC por 1 XLM
    return mid > 0 ? 1 / mid : null;
  } catch {
    return null;
  }
}

async function xlmPerUsdFromCoinGecko(): Promise<number | null> {
  try {
    const json = await (await fetch("https://api.coingecko.com/api/v3/simple/price?ids=stellar&vs_currencies=usd")).json();
    const usd = json?.stellar?.usd;
    return typeof usd === "number" && usd > 0 ? 1 / usd : null;
  } catch {
    return null;
  }
}

/** Convierte un monto entre monedas usando USD como puente. */
export function convert(amount: number, from: string, to: string, rates: Rates = current): number {
  if (from === to) return amount;
  const f = rates.perUsd[from];
  const t = rates.perUsd[to];
  if (!f || !t) return NaN;
  return (amount / f) * t;
}
