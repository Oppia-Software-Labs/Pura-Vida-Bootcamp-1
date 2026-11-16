// Read-only market data from Horizon (Stellar DEX order books, AMM pools, trades).
// Endpoint shapes were checked against the Stellar docs through Stellar Raven.
import { Asset, Horizon, Networks } from "@stellar/stellar-sdk";

export const NETWORKS = {
  testnet: {
    horizonUrl: "https://horizon-testnet.stellar.org",
    passphrase: Networks.TESTNET,
    // Circle's testnet USDC (it has an active XLM/USDC book on testnet).
    usdcIssuer: "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5",
  },
  mainnet: {
    horizonUrl: "https://horizon.stellar.org",
    passphrase: Networks.PUBLIC,
    usdcIssuer: "GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
  },
};

const servers = {};
export function server(network) {
  const cfg = NETWORKS[network];
  if (!cfg) throw new Error(`Unknown network "${network}"`);
  servers[network] ??= new Horizon.Server(cfg.horizonUrl);
  return servers[network];
}

/** "XLM" | "native" | "USDC" (well-known issuer) | "CODE:ISSUER" -> Asset */
export function parseAsset(str, network) {
  const s = String(str).trim();
  if (/^(xlm|native)$/i.test(s)) return Asset.native();
  if (/^usdc$/i.test(s)) return new Asset("USDC", NETWORKS[network].usdcIssuer);
  const [code, issuer] = s.split(":");
  if (!code || !issuer) {
    throw new Error(`Asset "${s}" must be "XLM", "USDC" or "CODE:ISSUER"`);
  }
  return new Asset(code, issuer);
}

export const assetLabel = (a) => (a.isNative() ? "XLM" : `${a.getCode()}:${a.getIssuer()}`);
const short = (a) => (a.isNative() ? "XLM" : a.getCode());
const num = (x) => Number.parseFloat(x);
const round = (x, d = 7) => (Number.isFinite(x) ? Number(x.toFixed(d)) : null);

/**
 * Order book for base/counter. Prices are counter per 1 base.
 * Horizon quirk (verified against /offers): ask `amount` is in BASE units,
 * bid `amount` is in COUNTER units. We normalise both to base units.
 */
export async function getOrderBook(network, baseStr, counterStr, limit = 50) {
  const base = parseAsset(baseStr, network);
  const counter = parseAsset(counterStr, network);
  const ob = await server(network).orderbook(base, counter).limit(limit).call();
  const asks = ob.asks.map((a) => ({ price: num(a.price), base_amount: num(a.amount) }));
  const bids = ob.bids.map((b) => ({ price: num(b.price), base_amount: num(b.amount) / num(b.price) }));
  return { base, counter, asks, bids };
}

function depthWithin(levels, mid, pct, side) {
  const limit = side === "ask" ? mid * (1 + pct) : mid * (1 - pct);
  return levels
    .filter((l) => (side === "ask" ? l.price <= limit : l.price >= limit))
    .reduce((sum, l) => sum + l.base_amount, 0);
}

/** Walk the book to fill `size` base units. side "buy" eats asks, "sell" eats bids. */
function simulateFill(levels, size) {
  let remaining = size;
  let cost = 0;
  for (const l of levels) {
    const take = Math.min(remaining, l.base_amount);
    cost += take * l.price;
    remaining -= take;
    if (remaining <= 1e-9) break;
  }
  const filled = size - remaining;
  return { filled, avgPrice: filled > 0 ? cost / filled : null, fullyFilled: remaining <= 1e-9 };
}

/** Constant-product pool for the pair, if one exists. */
export async function getLiquidityPool(network, base, counter) {
  const res = await server(network)
    .liquidityPools()
    .forAssets(base, counter)
    .limit(1)
    .call();
  const pool = res.records[0];
  if (!pool) return null;
  const reserve = (asset) =>
    num(pool.reserves.find((r) => r.asset === (asset.isNative() ? "native" : `${asset.getCode()}:${asset.getIssuer()}`))?.amount ?? 0);
  const rb = reserve(base);
  const rc = reserve(counter);
  return {
    id: pool.id,
    fee_bp: pool.fee_bp,
    reserves: { [short(base)]: rb, [short(counter)]: rc },
    amm_price: rb > 0 ? round(rc / rb) : null,
    total_shares: num(pool.total_shares),
    trustlines: Number(pool.total_trustlines),
  };
}

/** Hourly OHLCV over the last `hours`, plus simple stats. */
export async function getPriceHistory(network, baseStr, counterStr, hours = 24) {
  const base = parseAsset(baseStr, network);
  const counter = parseAsset(counterStr, network);
  const HOUR = 3_600_000;
  const end = Math.floor(Date.now() / HOUR) * HOUR + HOUR;
  const start = end - hours * HOUR;
  const res = await server(network)
    .tradeAggregation(base, counter, start, end, HOUR, 0)
    .limit(Math.min(hours, 200))
    .call();
  const candles = res.records.map((r) => ({
    t: new Date(Number(r.timestamp)).toISOString(),
    open: num(r.open),
    high: num(r.high),
    low: num(r.low),
    close: num(r.close),
    base_volume: num(r.base_volume),
    trades: Number(r.trade_count),
  }));
  if (candles.length === 0) return { candles, stats: null };
  const returns = candles.slice(1).map((c, i) => Math.log(c.close / candles[i].close));
  const mean = returns.reduce((a, b) => a + b, 0) / (returns.length || 1);
  const variance = returns.reduce((a, r) => a + (r - mean) ** 2, 0) / (returns.length || 1);
  const first = candles[0];
  const last = candles.at(-1);
  return {
    candles: candles.slice(-24),
    stats: {
      hours_with_trades: candles.length,
      open: first.open,
      last: last.close,
      high: Math.max(...candles.map((c) => c.high)),
      low: Math.min(...candles.map((c) => c.low)),
      change_pct: round(((last.close - first.open) / first.open) * 100, 2),
      base_volume: round(candles.reduce((a, c) => a + c.base_volume, 0), 2),
      trades: candles.reduce((a, c) => a + c.trades, 0),
      hourly_volatility_pct: round(Math.sqrt(variance) * 100, 3),
    },
  };
}

export async function getRecentTrades(network, baseStr, counterStr, limit = 20) {
  const base = parseAsset(baseStr, network);
  const counter = parseAsset(counterStr, network);
  const res = await server(network).trades().forAssetPair(base, counter).order("desc").limit(limit).call();
  return res.records.map((t) => ({
    time: t.ledger_close_time,
    price: round(num(t.price.n) / num(t.price.d)), // counter per base
    base_amount: num(t.base_amount),
    venue: t.trade_type, // "orderbook" | "liquidity_pool"
  }));
}

/** One-call liquidity/spread/slippage snapshot used by the assistant. */
export async function analyzePair(network, baseStr, counterStr, tradeSize = 100) {
  const { base, counter, asks, bids } = await getOrderBook(network, baseStr, counterStr, 100);
  const pool = await getLiquidityPool(network, base, counter).catch(() => null);
  const bestAsk = asks[0]?.price ?? null;
  const bestBid = bids[0]?.price ?? null;
  const mid = bestAsk && bestBid ? (bestAsk + bestBid) / 2 : bestAsk ?? bestBid;

  const slip = (side) => {
    const levels = side === "buy" ? asks : bids;
    const f = simulateFill(levels, tradeSize);
    return {
      size_base: tradeSize,
      filled_base: round(f.filled),
      fully_filled_by_book: f.fullyFilled,
      avg_price: round(f.avgPrice),
      slippage_vs_mid_pct: f.avgPrice && mid ? round(((f.avgPrice - mid) / mid) * 100 * (side === "buy" ? 1 : -1), 3) : null,
    };
  };

  return {
    network,
    pair: `${short(base)}/${short(counter)}`,
    base: assetLabel(base),
    counter: assetLabel(counter),
    price_unit: `${short(counter)} per 1 ${short(base)}`,
    order_book: {
      best_bid: round(bestBid),
      best_ask: round(bestAsk),
      mid: round(mid),
      spread_pct: bestAsk && bestBid ? round(((bestAsk - bestBid) / mid) * 100, 3) : null,
      ask_levels: asks.length,
      bid_levels: bids.length,
      depth_base: mid
        ? {
            asks_within_1pct: round(depthWithin(asks, mid, 0.01, "ask"), 2),
            bids_within_1pct: round(depthWithin(bids, mid, 0.01, "bid"), 2),
            asks_within_5pct: round(depthWithin(asks, mid, 0.05, "ask"), 2),
            bids_within_5pct: round(depthWithin(bids, mid, 0.05, "bid"), 2),
          }
        : null,
      top_asks: asks.slice(0, 5).map((l) => ({ price: round(l.price), base_amount: round(l.base_amount, 2) })),
      top_bids: bids.slice(0, 5).map((l) => ({ price: round(l.price), base_amount: round(l.base_amount, 2) })),
    },
    market_order_simulation: { buy: slip("buy"), sell: slip("sell") },
    liquidity_pool: pool
      ? { ...pool, amm_vs_book_mid_pct: mid && pool.amm_price ? round(((pool.amm_price - mid) / mid) * 100, 3) : null }
      : null,
  };
}

/** Balances and open offers of the connected wallet (public data only). */
export async function getAccount(network, address) {
  const s = server(network);
  const account = await s.loadAccount(address);
  const offers = await s.offers().forAccount(address).limit(50).call();
  return {
    address,
    balances: account.balances.map((b) => ({
      asset: b.asset_type === "native" ? "XLM" : b.asset_type === "liquidity_pool_shares" ? `pool:${b.liquidity_pool_id}` : `${b.asset_code}:${b.asset_issuer}`,
      balance: num(b.balance),
      selling_liabilities: num(b.selling_liabilities ?? 0),
    })),
    subentries: account.subentry_count,
    open_offers: offers.records.map((o) => ({
      id: o.id,
      selling: o.selling.asset_type === "native" ? "XLM" : o.selling.asset_code,
      buying: o.buying.asset_type === "native" ? "XLM" : o.buying.asset_code,
      // Horizon offer fields: amount is in the SELLING asset, price is BUYING per 1 SELLING.
      amount_selling: num(o.amount),
      price_buying_per_selling: num(o.price),
    })),
  };
}
