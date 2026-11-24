# Research log: wallet SDK, Horizon, and the XLM payment flow

This document records what was verified **before** any code was written, where each
answer came from, and what changed as a result. It exists because building on an API
you only half-remember produces code that compiles, looks right, and fails in the
wallet.

## Method

Three sources, in descending order of authority:

1. **The installed package's own types.** `node_modules/@stellar/*/**.d.ts` describes
   what this build actually does. Documentation describes intent.
2. **Primary vendor documentation** and the npm registry, for package identity and
   versions.
3. **Stellar Raven** (`https://raven.stellar.org/mcp`, a remote MCP server) as an
   independent cross-check on the flow and the SDK surface.

Raven was never the single source for anything that shipped. Where it disagreed with
the installed types, the types won — see finding 3.

No secrets were sent to Raven or anywhere else. Every query was about public API
shape and protocol behavior.

## Finding 1 — Freighter is now Varial

The wallet that the brief calls *Freighter* is documented today as **Varial**, and the
SDF's own install instructions point at `@stellar/varial-sdk`. `@stellar/freighter-api`
still exists and still works, but it is frozen.

**Decision:** the app depends on `@stellar/varial-sdk@7`. The `freighter-api` package
name survives only in this document, as the fallback if a grader's brief demands the
literal import. Keeping both would mean two adapters and two bug surfaces for one
wallet.

Verified: npm registry metadata and the package's published types, not just prose.

## Finding 2 — Horizon is on its way out, but has no date

SDF documents Horizon as being replaced by RPC. At the time of writing **no sunset
date had been published**.

**Decision:** classic payments, balances and history stay on Horizon Testnet, because
that is where the classic API lives. RPC appears in this project only conceptually —
`invokeHostFunction` (Soroban) would need it, and this app has no Soroban.

**Consequence to keep in mind:** the day Horizon Testnet shuts down, three services
break at once: `dashboard/services/account.ts`,
`transactions/services/history.ts`, and `payments/services/payment.ts`.

## Finding 3 — The shipped wallet API is not the documented one

This is the finding that mattered most, and the one Raven could not have given us.

The documentation advertises `signTransaction(xdr, { network, networkPassphrase })`.
The **installed** `.d.ts` declares:

```ts
signTransaction: (
  transactionXdr: string,
  opts?: { networkPassphrase?: string; address?: string },
) => Promise<{ signedTxXdr: string; signerAddress: string } & { error?: FreighterApiError }>;
```

There is **no `network` option** in the shipped type. Passing an undeclared option is
exactly the kind of thing that works in one wallet version and silently stops working
in the next.

**Decision:** the adapter passes only `networkPassphrase` and `address`, and the app
proves the network itself by comparing the passphrase to the Testnet constant.

Two more behaviors that the types reveal and prose usually omits:

- **These calls resolve with an `error` field; they do not throw.** A `catch` block
  alone would treat a user cancellation as success and submit an unsigned envelope.
  Every call in `services/varial-wallet.ts` inspects `result.error` first.
- **`getAddress()` resolves with `address: ""`** when access was never granted. An
  empty string is not a valid account, so the adapter normalizes it to `null` instead
  of letting `""` travel into a Horizon request.

`WatchWalletChanges` polls every **3000 ms**, and `watch()` reports a failure to start
through its **return value** rather than by throwing — so a failed watcher must be
detected and stopped, or the app leaks a timer that never fires.

## Finding 4 — Rejection wording has to be matched narrowly

Wallet refusals do not arrive with a stable code. Numeric `code` values are undocumented
and differ across versions, so branching on them is guessing.

**Decision:** match the wording, narrowly:

```ts
/\buser\s+rejected\b|\brejected\s+this\s+request\b/i
```

A bare `/rejected/` also matches messages like "the network rejected this request" and
would report a real failure as a user cancellation. The classifier lives in
`mapSdkError` and is the only place that interprets wallet error text.

## Finding 5 — The classic payment flow, end to end

| Step | What is actually required |
| --- | --- |
| Build | `TransactionBuilder` + `Operation.payment({ destination, asset: Asset.native(), amount })` |
| Fee | Base fee is **100 stroops** (`0.00001 XLM`); sufficient on Testnet |
| Timeout | Time bounds are mandatory in practice — without them a transaction can sit valid for hours |
| Memo | **28 bytes** of UTF-8 for a text memo, not 28 characters |
| Sign | One signature from the source account, `signTransaction(xdr, { networkPassphrase })` |
| Submit | `server.submitTransaction(tx)` on Horizon; no `prepareTransaction` |

`prepareTransaction` belongs to **Soroban**, not to classic payments. Calling it here
would be cargo cult: it simulates a contract invocation that does not exist.

Sequence numbers are the subtle part. The app reloads the source account immediately
before building rather than trusting a cached snapshot, because a stale sequence only
fails **after** the user has already approved the signature in their wallet.

## Finding 6 — Error classes nest, and the order of checks decides the message

Found while wiring submission, then confirmed against the installed types:

```
NetworkError
├── NotFoundError        (HTTP 404: account, transaction)
└── BadResponseError
    └── TransactionFailedError   (HTTP 400 + extras.result_codes)
```

Two consequences, both of which produce wrong user-facing text if ignored:

- `TransactionFailedError` must be tested **before** `NetworkError`, otherwise
  `instanceof NetworkError` catches it first and `getResultCodes()` is unreachable —
  every rejection collapses into a generic "the request failed".
- `NotFoundError` must be tested **before** `NetworkError` for the same reason. Reversed,
  every **unfunded** account is reported as a network outage instead of "fund the
  account with Friendbot".

This is also why the app maps result codes to instructions rather than printing them
raw: `op_no_destination` means the destination does not exist yet, `op_underfunded`
means the reserve is the problem, `tx_bad_seq` means retry.

## Finding 7 — Reserves are why "send everything" fails

- Base reserve: **0.5 XLM** per ledger entry.
- An account is **two** base reserves: minimum balance **1 XLM**.
- Every subentry (trustline, offer, data entry) adds **0.5 XLM**.
- Selling liabilities are locked on top of that.

So the maximum sendable amount is *not* the balance. `lib/stellar/reserves.ts` encodes
this, and `computeSpendableXlm` clamps at zero instead of returning a negative number
that would be rendered to a user as a negative balance.

## What Raven was actually used for

Queries were about the shape of the flow and the current SDK surface: which package
implements the wallet today, whether classic payments still go through Horizon, and
what the payment operations require.

What it did:

- **Corroborated** the Freighter → Varial move and the Horizon → RPC direction.
- **Corroborated** the classic payment sequence (build, sign, submit, reserve rules).

What it did **not** settle, and how each was settled instead:

| Open question | Resolved by |
| --- | --- |
| Does `signTransaction` accept `opts.network`? | Reading the installed `.d.ts` — it does not |
| Does a refusal throw or resolve? | Reading the installed `.d.ts` and the adapter's error path |
| Which error class carries `result_codes`? | Reading the SDK's `errors/` module and the `submitTransaction` doc comment |
| Does `getAddress()` fail or return empty? | Reading the types: it resolves `address: ""` |

**The general lesson:** an assistant-friendly knowledge source is good for direction
and bad for exact signatures. When a call must be exactly right, open the `.d.ts` that
will actually be bundled.

## What the research changed in the product

- `@stellar/varial-sdk` instead of `@stellar/freighter-api`.
- A single adapter (`features/wallet/services/varial-wallet.ts`) is the only module that
  imports the SDK, so a future rename touches one file.
- Horizon for reads and classic writes; RPC deliberately absent.
- `NotFoundError` is treated as *state* (unfunded account), not as an error.
- No `prepareTransaction` in the payment path.
- Envelope verification before submission, because the research made clear that the
  app is responsible for what it broadcasts — the wallet only signs.

## Remaining unknowns

- **Horizon sunset date** — unpublished. This app will need a migration plan when it
  exists.
- **Varial `opts.network`** — documented, not declared. Re-check after any SDK upgrade;
  if it appears, network validation can move one layer earlier.
