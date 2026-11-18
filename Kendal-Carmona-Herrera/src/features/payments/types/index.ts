/**
 * Payments domain types.
 *
 * The error code is a closed union rather than Horizon's raw result codes: the UI
 * renders one sentence per case, and a code the app does not know how to explain
 * would otherwise leak into the interface.
 */

export type PaymentErrorCode =
  | "invalid_destination"
  | "invalid_amount"
  | "invalid_memo"
  | "insufficient_balance"
  | "wrong_network"
  | "not_connected"
  | "rejected"
  | "unfunded_destination"
  | "stale_transaction"
  | "insufficient_fee"
  | "expired"
  | "submit_failed"
  | "network"
  | "unknown";

export interface PaymentError {
  code: PaymentErrorCode;
  message: string;
}

export type PaymentStatus = "idle" | "signing" | "submitting" | "success" | "error";

/**
 * What the user gets after the network accepted the payment. The amount is the
 * normalized XLM string that was actually signed, not the raw input.
 */
export interface PaymentReceipt {
  hash: string;
  explorerUrl: string;
  amount: string;
  destination: string;
  memo: string | null;
}

export interface PaymentFieldError {
  field: "destination" | "amount" | "memo";
  message: string;
}
