# StellarView

A **Stellar Testnet only** dashboard: connect a wallet, see your XLM balance and
recent payments, and send XLM. No backend, no database, no account system — the
wallet is the identity.

Built as a bootcamp deliverable.

## What it does

- Connect and disconnect a Stellar wallet without a page reload.
- Show the connected address, the network, and a one-click copy.
- Show the XLM balance, how much of it is actually spendable, and the locked reserve.
- List the 10 most recent payments, newest first, classified as **In**, **Out** or **Self**,
  each linking to Stellar Expert.
- Send XLM to any Testnet account with an optional text memo, signing in the wallet.
- Explain every failure where it happened: unfunded account, wrong network, empty
  history, rejected signature, insufficient balance, unfunded destination.

## Requirements

| Need | Version | Why |
| --- | --- | --- |
| Node.js | 22.12+ | `@stellar/stellar-sdk` declares `engines.node >= 22.12.0` |
| pnpm | 11 | pinned in `packageManager` |
| Varial wallet | latest | browser extension; Freighter's successor |

## Running it

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

Open <http://localhost:3000>.

> If `pnpm dev` dies with `unable to start FSEvent stream`, your environment cannot
> give Turbopack a file watcher (common in sandboxes and some CI images). Use
> `pnpm exec next dev --webpack` instead. Nothing else changes.

## Scripts

| Command | Does |
| --- | --- |
| `pnpm dev` | Development server (Turbopack) |
| `pnpm build` | Production build |
| `pnpm start` | Serve the production build |
| `pnpm lint` | ESLint |
| `pnpm test` | Vitest, one run |
| `pnpm exec tsc --noEmit` | Type check |

## Environment

Everything lives in `.env.local`, copied from `.env.example`.

| Variable | Default | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_STELLAR_NETWORK` | `testnet` | Anything else disables the app |
| `NEXT_PUBLIC_STELLAR_HORIZON_URL` | `https://horizon-testnet.stellar.org` | Classic API |
| `NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE` | `Test SDF Network ; September 2015` | Must match, or signing produces invalid transactions |

**All three are public.** They are inlined into the browser bundle at build time.
This project has no secret to configure, and that is deliberate — see below.

`src/lib/stellar/config.ts` validates them and reports a mismatch as *data*, so a
broken `.env` renders an explanation instead of a blank error page.

## This app never touches a private key

There is no field for a seed phrase and no key material in memory, in storage, or in
a log. Signing happens inside the wallet extension; the app receives only a signed
envelope, and even that is re-parsed and verified before it reaches the network.

If you are reviewing this project, that is the invariant worth checking:
**a search for `secret`, `seed` or `privateKey` in `src/` should return nothing.**

## How it is put together

```
src/
  app/                  Route, layout, Tailwind theme
  components/
    feedback/           StateMessage: one block for loading/empty/error/unfunded
    ui/                 shadcn Button (Base UI)
  features/
    wallet/             Varial adapter, useWallet, header controls
    dashboard/          Account service, useAccount, balance card, page composition
    transactions/       Payment history service, useTransactions, list
    payments/           Validation, send service, usePayment, send form
  lib/
    stellar/            constants, config, client, reserves, errors
    clipboard.ts        navigator.clipboard with a textarea fallback
    format.ts           Address shortening, date formatting
```

Each feature owns its `components`, `hooks`, `services` and `types`. Nothing outside
`features/wallet/services/varial-wallet.ts` imports the wallet SDK, so replacing the
wallet provider means touching one file.

## Four decisions that explain the code

**1. Money is never a `number`.** Every amount is converted to stroops (`1 XLM =
10,000,000 stroops`) and handled as a `bigint` in `lib/stellar/reserves.ts`. Float
arithmetic on a balance accumulates error until a perfectly valid payment is refused
by one stroop.

**2. Failures are values, not exceptions.** Services return
`{ ok: true, data } | { ok: false, error }`. A Horizon outage renders an explanation
next to the form instead of taking the page down through an error boundary.

**3. The network is verified before every read and every write.** A wallet on another
network stays connected but `isTestnet: false`; the dashboard then passes `null` to
the data hooks, which is how reads get blocked in one place instead of six.

**4. The signed envelope is verified before submission.** The wallet's return value is
not proof of what it signed. `payments/services/payment.ts` re-parses the envelope and
compares source, operation count, operation type, destination, asset and amount in
stroops. A mismatch submits nothing.

## Why "spendable" is not the balance

Stellar locks **0.5 XLM per ledger entry**: an account itself costs two base reserves
(1 XLM) and each subentry adds one (0.5 XLM). Selling liabilities are locked too. An
account showing `10 XLM` with three subentries can send roughly `7.5 XLM`, not 10.

The dashboard shows both numbers because the difference is exactly what makes a
"valid looking" payment fail:

```
spendable = balance − (2 + subentries) × 0.5 − selling_liabilities   (never below 0)
```

## History: why `payments()` and not `transactions()`

The transaction endpoint returns hashes and fees; to fill the table with direction,
counterparty and amount you would need one extra request per row. The payments
endpoint already carries all of it, so the list costs **one** request.

The trade-off is honest: the list covers the payments family (`payment`,
`create_account`, `account_merge`, `path_payment_*`). A trustline change or an offer
will not appear there.

## Testing

```bash
pnpm test
```

29 tests over the two modules where a bug means money moves wrongly:

- `lib/stellar/reserves.ts` — conversions, the smallest unit, reserve and spendable
  arithmetic, and the clamp that stops a negative balance from reaching the screen.
- `payments/services/validation.ts` — address checksums, amount format, the
  fee-inclusive balance boundary (pinned from both sides), and memo length in UTF-8
  **bytes**, since 28 characters of emoji is 35 bytes.

Not covered yet, and worth knowing before you trust a screen:

- No browser or end-to-end test. Rendering is verified by hand.
- No test touches `payments/services/payment.ts` itself, because it needs a live
  Horizon and a wallet to sign.
- **No real payment has been sent with this code at the time of writing.**

## Manual checklist on Testnet

1. Fund an account: <https://friendbot.stellar.org> with your address.
2. Connect the wallet and confirm the badge reads `Testnet`.
3. Send `1 XLM` to another Testnet account and follow the hash to Stellar Expert.
4. Switch the wallet to Mainnet and reload: reads must pause, the warning must appear,
   and the send form must disappear.
5. Try to send the full spendable amount: it must be refused, because the fee is
   charged on top.

## Known limits

- **Testnet only**, by design and enforced in `config.ts`.
- **Classic payments only.** No Soroban; `invokeHostFunction` would need RPC instead of
  Horizon.
- **Text memo only**, 28 UTF-8 bytes. Memo IDs and hashes would need a type selector.
- **One operation per transaction**, which is why a payment to a brand-new account
  fails with `op_no_destination`: that needs `create_account`, not `payment`.
- **No transaction history beyond the last 10 payments**, and no pagination.
- The signed-envelope check proves *what* will be submitted, not that the user typed
  the right address. Always read the destination back before signing.
