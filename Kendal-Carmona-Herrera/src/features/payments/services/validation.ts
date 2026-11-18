import { StrKey } from "@stellar/stellar-sdk";

import { BASE_FEE_STROOPS, MEMO_TEXT_MAX_BYTES } from "@/lib/stellar/constants";
import { stroopsToXlm, xlmToStroops } from "@/lib/stellar/reserves";

import type { PaymentFieldError } from "../types";

/**
 * Pure payment validation: no Horizon client, no React. Every rule here has to be
 * testable by calling one function with strings.
 */

/** No sign, no exponent, no thousands separator, seven decimals at most. */
const AMOUNT_PATTERN = /^\d+(\.\d{1,7})?$/;

const TEXT_ENCODER = new TextEncoder();

export interface ValidatePaymentInput {
  destination: string;
  amount: string;
  memo: string;
  spendableXlm: string;
}

export function validateDestination(value: string): string | null {
  const trimmed = value.trim();

  if (trimmed === "") return "Enter a destination address.";

  if (!StrKey.isValidEd25519PublicKey(trimmed)) {
    return "That is not a valid Stellar account address.";
  }

  return null;
}

export function validateAmount(
  value: string,
  spendableXlm: string,
): string | null {
  const trimmed = value.trim();

  if (trimmed === "") return "Enter an amount to send.";

  if (!AMOUNT_PATTERN.test(trimmed)) {
    return "Use a plain decimal amount with up to 7 decimals.";
  }

  const amountStroops = xlmToStroops(trimmed);

  if (amountStroops <= BigInt(0)) {
    return "The amount must be greater than 0.";
  }

  // The spendable figure already excludes the account's minimum reserve; the fee
  // is charged on top of the payment, so both have to fit in it.
  if (
    amountStroops + BigInt(BASE_FEE_STROOPS) >
    xlmToStroops(spendableXlm)
  ) {
    return `That is more than your spendable balance of ${spendableXlm} XLM, which already reserves the transaction fee.`;
  }

  return null;
}

export function validateMemo(value: string): string | null {
  // Text memos are capped in UTF-8 bytes, so "ñ" or an emoji counts more than one.
  const byteLength = TEXT_ENCODER.encode(value).length;

  if (byteLength > MEMO_TEXT_MAX_BYTES) {
    return `The memo is ${byteLength} bytes. A text memo holds at most ${MEMO_TEXT_MAX_BYTES} bytes of UTF-8, not ${MEMO_TEXT_MAX_BYTES} characters.`;
  }

  return null;
}

/** Returns the first error in field order, so one message is shown at a time. */
export function validatePayment(
  input: ValidatePaymentInput,
): PaymentFieldError | null {
  const destination = validateDestination(input.destination);
  if (destination !== null) return { field: "destination", message: destination };

  const amount = validateAmount(input.amount, input.spendableXlm);
  if (amount !== null) return { field: "amount", message: amount };

  const memo = validateMemo(input.memo);
  if (memo !== null) return { field: "memo", message: memo };

  return null;
}

/**
 * Canonical amount used to build the operation. Raw user input ("12.50", "007")
 * must never reach `Operation.payment`: the protocol expects a plain seven-decimal
 * string, and `xlmToStroops` would reject the same input further down the line.
 */
export function normalizeAmount(value: string): string {
  return stroopsToXlm(xlmToStroops(value));
}
