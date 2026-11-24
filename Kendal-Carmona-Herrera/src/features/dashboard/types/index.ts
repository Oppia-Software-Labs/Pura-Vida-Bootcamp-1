/**
 * Read-only view of one Stellar account, as the dashboard needs it.
 *
 * Amounts stay as strings: XLM has seven decimals and a `number` would silently
 * round a balance the user is about to move.
 */

export interface AccountSnapshot {
  address: string;
  balanceXlm: string;
  minimumBalanceXlm: string;
  spendableXlm: string;
  subentryCount: number;
  sequence: string;
  sellingLiabilitiesXlm: string;
}

/**
 * `unfunded` is a normal Testnet state, not a failure: an account only exists
 * after Friendbot (or another account) funds it.
 */
export type AccountStatus = "idle" | "loading" | "funded" | "unfunded" | "error";
