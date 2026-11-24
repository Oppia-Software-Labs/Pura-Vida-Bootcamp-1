/**
 * Wallet domain types shared by the adapter, the hook and the UI.
 *
 * The state is a discriminated union on purpose: `checking` must be handled
 * explicitly, otherwise the first paint shows a "Connect wallet" button to a user
 * whose silent reconnect is still in flight.
 */

export type WalletErrorCode =
  | "not_installed"
  | "rejected"
  | "wrong_network"
  | "unavailable"
  | "unknown";

export interface WalletError {
  /** Machine-readable category the UI maps to copy and to recovery actions. */
  code: WalletErrorCode;
  /** Human-readable message, safe to render as-is. Never a raw stack trace. */
  message: string;
}

export type WalletState =
  | { status: "checking" }
  | { status: "disconnected"; error?: WalletError }
  | { status: "connecting" }
  | {
      status: "connected";
      address: string;
      network: string;
      networkPassphrase: string;
      isTestnet: boolean;
    }
  | { status: "failed"; error: WalletError };
