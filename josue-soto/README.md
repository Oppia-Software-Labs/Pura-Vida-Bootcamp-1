# Raven DEX Assistant

**Pura Vida Bootcamp, Entregable 1, by Josue Soto**

An AI trading and analysis assistant for the **Stellar DEX**. You chat with it (in Spanish or English) to:

- **Check liquidity**: spread, depth within ±1% / ±5% of the mid price, and a simulated market-order slippage for any trade size.
- **Track order books**: a live bid/ask ladder that auto-refreshes every 15 s, plus recent fills (order book vs AMM).
- **Analyze token pairs** (XLM/USDC or any `CODE:ISSUER`): 24 h change, high/low, volume, hourly volatility, and how the AMM pool price compares with the order book.
- **Get recommendations and run simple strategies**: limit orders, grids/ladders around the mid, spread capture, DCA buys. The assistant **proposes** the orders. You review them and **sign them in your wallet**, and they are submitted together as one atomic transaction. You can cancel open offers the same way.

The wallet connection (a requirement for this assignment) uses the **Varial** extension (formerly Freighter) through `@stellar/varial-sdk`.

## How Stellar Raven was used

Stellar Raven (the official Stellar MCP) was the development assistant for this project:

| Question asked to Raven | What it gave me | Where it's used |
|---|---|---|
| How do I connect a browser wallet? | The `skills.stellar-dev.dapp` playbook: Varial SDK, `requestAccess`, `signTransaction` | `src/wallet.js` |
| Which Horizon endpoints cover order books, AMM pools and trade history? | Docs for `/order_book`, `/liquidity_pools`, `/trade_aggregations`, `/trades` | `server/horizon.js` |
| What units are order book amounts in? | The Order Book Object page | Normalization in `getOrderBook` (see note below) |
| Which networks and endpoints exist for mainnet and testnet? | The `skills.stellar-dev.data` Horizon guide | `NETWORKS` config |

> **Verified quirk:** the docs say ask `amount` is in the counter asset. When I checked against `/offers`, ask amounts are actually in the **base** asset, and bid amounts are in the **counter** asset. The app converts both to base units.

## Architecture

```
Browser (Vite)                              Node server (Express)
├── Wallet connect / sign (Varial)          ├── /api/market  → Horizon analytics (no AI)
├── Live market panel ─────── /api/market ──┤
├── Chat ──────────────────── /api/chat ────┤── /api/chat    → Claude (claude-opus-5-5) + tool runner
└── Proposal cards → build tx → sign → submit     tools: analyze_pair, get_order_book, get_price_history,
                     to Horizon (client-side)            get_recent_trades, get_my_account, propose_orders
```

Safety by design:
- The server **never holds keys** and never submits transactions. `propose_orders` only drafts orders.
- Proposals are validated: at most 10 orders, required fields present, and limit prices no more than 25% from the book mid.
- The app defaults to **testnet**. Switching to mainnet needs confirmation and shows a warning banner. Signing checks that the wallet is on the same network as the app.

## Run it

Requirements: Node 22+, the [Varial / Freighter](https://www.freighter.app/) browser extension, and a [Claude API key](https://platform.claude.com/).

```bash
cd josue-soto
npm install
cp .env.example .env        # paste your ANTHROPIC_API_KEY
npm run dev                 # API on :8787, web on http://localhost:5173
```

Testnet quick start:
1. Set the wallet to **Testnet** and click **Connect wallet**.
2. Click **Fund with Friendbot**.
3. Ask: *"Analiza la liquidez de XLM/USDC para 500 XLM"*, then *"Propose a small 3-level grid around the mid"*. Then click **Review & sign in wallet**.

> Recommendations are analysis, not financial advice.
