// Claude-powered DEX analyst. Market data tools are read-only; trading tools only
// *propose* orders. Nothing is signed or submitted here: the browser builds the
// transaction and the user signs it in their own wallet.
import Anthropic from "@anthropic-ai/sdk";
import { betaZodTool } from "@anthropic-ai/sdk/helpers/beta/zod";
import { z } from "zod";
import { analyzePair, getAccount, getOrderBook, getPriceHistory, getRecentTrades } from "./horizon.js";

const client = new Anthropic();
const MODEL = "claude-opus-5-5";
const MAX_PRICE_DEVIATION = 0.25; // reject limit prices >25% away from the book mid (fat-finger guard)

const SYSTEM = `You are Raven DEX Assistant, a trading and market-analysis copilot for the Stellar DEX (classic order books + constant-product liquidity pools).

What you can do:
- Measure liquidity: spread, depth near the mid, simulated slippage for a trade size, and whether an AMM pool exists and how its price compares to the order book.
- Track the order book and recent trades, and summarise short-term price action (24h change, range, volume, hourly volatility).
- Read the connected wallet's balances and open offers.
- Propose limit orders or simple automated strategies (for example a ladder/grid of offers around the mid, a spread-capturing pair of bid+ask, or a DCA-style set of buys) with the propose_orders tool.

Rules:
- Always fetch data with tools before giving numbers. Never invent prices or depth.
- Prices are always quoted as COUNTER asset per 1 BASE asset (e.g. XLM/USDC price = USDC per XLM). Amounts in orders are in BASE units.
- Assets are written as "XLM", "USDC" (well-known issuer for the active network) or "CODE:ISSUER".
- You never execute trades yourself. propose_orders only drafts orders; the user reviews them and signs with their wallet. Say so plainly, and never claim an order was placed.
- Before proposing orders, check the wallet (get_my_account) when one is connected: make sure the balances cover the orders, and include a "trust" action first if the account lacks a trustline for a non-XLM asset it would receive.
- Keep each proposal small and explain the rationale and the risks (thin books, inventory risk for market-making, price moving through a grid). Recommendations are analysis, not financial advice.
- If the user is on mainnet, remind them real funds are at stake.
- Answer concisely, in the user's language (Spanish or English). Use short sections and bullet points; include the key numbers.`;

const pair = {
  base: z.string().describe('Base asset, e.g. "XLM", "USDC" or "CODE:ISSUER"'),
  counter: z.string().describe('Counter (quote) asset, e.g. "USDC"'),
};

const OrderSchema = z.object({
  action: z.enum(["buy", "sell", "cancel", "trust"]).describe(
    "buy/sell = limit order on base/counter; cancel = remove an existing offer by offer_id; trust = add a trustline for `base`",
  ),
  base: z.string().describe("Base asset (for trust: the asset to trust)"),
  counter: z.string().optional().describe("Counter asset (required for buy/sell)"),
  amount_base: z.number().positive().optional().describe("Order size in BASE units (required for buy/sell)"),
  price: z.number().positive().optional().describe("Limit price, COUNTER per 1 BASE (required for buy/sell)"),
  offer_id: z.string().optional().describe("Existing offer id (required for cancel)"),
});

/** Tools are built per request so they close over the user's network, wallet and proposal list. */
export function buildTools({ network, address, proposals }) {
  const json = (x) => JSON.stringify(x);

  return [
    betaZodTool({
      name: "analyze_pair",
      description:
        "Liquidity snapshot for a Stellar DEX pair: best bid/ask, mid, spread, depth within 1%/5%, simulated market buy/sell slippage for trade_size, top of book, and the AMM liquidity pool (reserves, fee, price vs book).",
      inputSchema: z.object({
        ...pair,
        trade_size: z.number().positive().optional().describe("Size in BASE units for the slippage simulation (default 100)"),
      }),
      run: async ({ base, counter, trade_size }) => json(await analyzePair(network, base, counter, trade_size ?? 100)),
    }),
    betaZodTool({
      name: "get_order_book",
      description: "Raw order book levels (price in COUNTER per BASE, amounts normalised to BASE units). Use for detailed book inspection.",
      inputSchema: z.object({ ...pair, levels: z.number().int().min(1).max(50).optional() }),
      run: async ({ base, counter, levels }) => {
        const ob = await getOrderBook(network, base, counter, levels ?? 20);
        return json({ asks: ob.asks, bids: ob.bids });
      },
    }),
    betaZodTool({
      name: "get_price_history",
      description: "Hourly OHLCV candles from Horizon trade aggregations plus stats (change %, high/low, volume, hourly volatility).",
      inputSchema: z.object({ ...pair, hours: z.number().int().min(2).max(168).optional().describe("Lookback in hours (default 24)") }),
      run: async ({ base, counter, hours }) => json(await getPriceHistory(network, base, counter, hours ?? 24)),
    }),
    betaZodTool({
      name: "get_recent_trades",
      description: "Most recent fills for the pair (time, price, size) and whether they executed against the order book or a liquidity pool.",
      inputSchema: z.object({ ...pair, limit: z.number().int().min(1).max(100).optional() }),
      run: async ({ base, counter, limit }) => json(await getRecentTrades(network, base, counter, limit ?? 20)),
    }),
    betaZodTool({
      name: "get_my_account",
      description: "Balances, liabilities and open DEX offers of the user's connected wallet.",
      inputSchema: z.object({}),
      run: async () => {
        if (!address) return "No wallet connected. Ask the user to connect their wallet first.";
        try {
          return json(await getAccount(network, address));
        } catch (e) {
          if (e?.response?.status === 404) return `Account ${address} is not funded on ${network}. On testnet it can be funded with Friendbot.`;
          throw e;
        }
      },
    }),
    betaZodTool({
      name: "propose_orders",
      description:
        "Draft a set of orders (a single trade or a whole strategy) for the user to review and sign in their wallet. All orders are submitted together as ONE transaction (max 10). Does NOT execute anything.",
      inputSchema: z.object({
        strategy: z.string().describe('Short name, e.g. "Limit buy", "3-level grid", "Spread capture"'),
        rationale: z.string().describe("Why these orders, with the key numbers and the main risks"),
        orders: z.array(OrderSchema).min(1).max(10),
      }),
      run: async ({ strategy, rationale, orders }) => {
        if (!address) return "No wallet connected; ask the user to connect a wallet before proposing orders.";
        const problems = [];
        const mids = new Map();
        for (const [i, o] of orders.entries()) {
          if (o.action === "buy" || o.action === "sell") {
            if (!o.counter || !o.amount_base || !o.price) {
              problems.push(`order ${i}: buy/sell needs counter, amount_base and price`);
              continue;
            }
            const key = `${o.base}|${o.counter}`;
            if (!mids.has(key)) {
              const ob = await getOrderBook(network, o.base, o.counter, 1);
              const bid = ob.bids[0]?.price, ask = ob.asks[0]?.price;
              mids.set(key, bid && ask ? (bid + ask) / 2 : bid ?? ask ?? null);
            }
            const mid = mids.get(key);
            if (mid && Math.abs(o.price - mid) / mid > MAX_PRICE_DEVIATION) {
              problems.push(`order ${i}: price ${o.price} is more than ${MAX_PRICE_DEVIATION * 100}% from mid ${mid.toFixed(7)}`);
            }
          }
          if (o.action === "cancel" && !o.offer_id) problems.push(`order ${i}: cancel needs offer_id`);
        }
        if (problems.length) return `Proposal rejected, fix and retry:\n- ${problems.join("\n- ")}`;
        proposals.push({ id: crypto.randomUUID(), network, strategy, rationale, orders });
        return "Proposal shown to the user for review. It is NOT executed until they sign it in their wallet.";
      },
    }),
  ];
}

/**
 * @param {{ network: "testnet"|"mainnet", address?: string, history: {role:"user"|"assistant", text:string}[], message: string }} req
 */
export async function chat({ network, address, history, message }) {
  const proposals = [];
  const context = `[context] network=${network}; wallet=${address ?? "not connected"}; now=${new Date().toISOString()}`;

  /** @type {Anthropic.Beta.BetaMessageParam[]} */
  const messages = [
    ...history.slice(-20).map((m) => ({ role: m.role, content: m.text })),
    { role: "user", content: `${context}\n\n${message}` },
  ];

  const final = await client.beta.messages.toolRunner({
    model: MODEL,
    max_tokens: 16000,
    max_iterations: 10,
    thinking: { type: "adaptive" },
    output_config: { effort: "medium" },
    // Server-side refusal fallback: if a policy classifier declines, the API reruns on a fallback model.
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    system: [{ type: "text", text: SYSTEM, cache_control: { type: "ephemeral" } }],
    tools: buildTools({ network, address, proposals }),
    messages,
  });

  let text = final.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();
  if (final.stop_reason === "refusal") text ||= "I can't help with that request.";
  if (final.stop_reason === "max_tokens") text += "\n\n_(response truncated)_";
  return { reply: text || "(no answer)", proposals };
}
