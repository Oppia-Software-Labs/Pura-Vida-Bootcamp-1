import { NetworkError, NotFoundError } from "@stellar/stellar-sdk";

/**
 * Horizon failures translated into data the UI can switch on.
 *
 * Services never throw at their callers: a page must render an explanation
 * instead of a blank error boundary, so every failure travels as a value.
 */

export type StellarServiceErrorReason = "not_found" | "network" | "unknown";

export interface StellarServiceError {
  /** Machine-readable category the UI maps to copy and recovery actions. */
  reason: StellarServiceErrorReason;
  /** Readable, single-line message. Never a raw stack trace. */
  message: string;
}

export type ServiceResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: StellarServiceError };

const FALLBACK_MESSAGE = "The Stellar Testnet request failed.";
const MAX_MESSAGE_LENGTH = 200;

function toReadableMessage(message: string, fallback: string): string {
  const singleLine = message.replace(/\s+/g, " ").trim();

  if (singleLine === "") return fallback;

  return singleLine.length > MAX_MESSAGE_LENGTH
    ? `${singleLine.slice(0, MAX_MESSAGE_LENGTH - 1)}…`
    : singleLine;
}

export function classifyHorizonError(error: unknown): StellarServiceError {
  // NotFoundError extends NetworkError, so the missing-resource check comes first.
  if (error instanceof NotFoundError) {
    return {
      reason: "not_found",
      message: toReadableMessage(
        error.message,
        "The account was not found on Stellar Testnet.",
      ),
    };
  }

  if (error instanceof NetworkError) {
    return {
      reason: "network",
      message: toReadableMessage(
        error.message,
        "Horizon could not be reached. Check the connection and try again.",
      ),
    };
  }

  if (error instanceof Error) {
    return {
      reason: "unknown",
      message: toReadableMessage(error.message, FALLBACK_MESSAGE),
    };
  }

  return { reason: "unknown", message: FALLBACK_MESSAGE };
}
