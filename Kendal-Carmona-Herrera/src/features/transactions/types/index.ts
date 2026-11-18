/**
 * One row of the dashboard transaction table.
 *
 * The shape is deliberately flat: Horizon returns five different payment record
 * layouts, and the table must not know which one a row came from.
 */

export type TransactionDirection = "incoming" | "outgoing" | "self";

export interface TransactionSummary {
  id: string;
  hash: string;
  /** Raw Horizon type, e.g. "payment". */
  type: string;
  /** Human label, e.g. "Payment", "Create Account". */
  typeLabel: string;
  direction: TransactionDirection;
  counterparty: string | null;
  /** Amount in the asset's units, when the record carries one. */
  amount: string | null;
  /** "XLM" or the asset code. */
  asset: string;
  /** ISO timestamp. */
  createdAt: string;
  successful: boolean;
  explorerUrl: string;
}
