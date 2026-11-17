import { useCallback, useState } from "react";
import {
  varialWalletAdapter,
  WalletError,
  type AccountSnapshot,
  type WalletAdapter,
  type WalletConnection,
  type WalletErrorCode,
} from "../lib/wallet";

export type WalletStatus =
  | "idle"
  | "connecting"
  | "connected"
  | "funding"
  | "wrong-network"
  | "error";

export interface WalletState {
  status: WalletStatus;
  connection: WalletConnection | null;
  account: AccountSnapshot | null;
  errorCode: WalletErrorCode | null;
  errorMessage: string | null;
}

const initialState: WalletState = {
  status: "idle",
  connection: null,
  account: null,
  errorCode: null,
  errorMessage: null,
};

function normalizeError(error: unknown) {
  if (error instanceof WalletError) {
    return { code: error.code, message: error.message };
  }
  return {
    code: "unknown" as const,
    message: error instanceof Error ? error.message : "Unexpected wallet error.",
  };
}

export function useWallet(adapter: WalletAdapter = varialWalletAdapter) {
  const [state, setState] = useState<WalletState>(initialState);

  const connect = useCallback(async () => {
    setState({ ...initialState, status: "connecting" });
    try {
      const connection = await adapter.connect();
      const account = await adapter.getAccount(connection.address);
      setState({
        status: "connected",
        connection,
        account,
        errorCode: null,
        errorMessage: null,
      });
    } catch (error) {
      const normalized = normalizeError(error);
      setState({
        ...initialState,
        status: normalized.code === "wrong-network" ? "wrong-network" : "error",
        errorCode: normalized.code,
        errorMessage: normalized.message,
      });
    }
  }, [adapter]);

  const fund = useCallback(async () => {
    if (!state.connection) return;
    setState((current) => ({ ...current, status: "funding", errorMessage: null }));
    try {
      const account = await adapter.fundWithFriendbot(state.connection.address);
      setState((current) => ({
        ...current,
        status: "connected",
        account,
        errorCode: null,
        errorMessage: null,
      }));
    } catch (error) {
      const normalized = normalizeError(error);
      setState((current) => ({
        ...current,
        status: "connected",
        errorCode: normalized.code,
        errorMessage: normalized.message,
      }));
    }
  }, [adapter, state.connection]);

  const disconnect = useCallback(async () => {
    try {
      await adapter.disconnect();
    } finally {
      setState(initialState);
    }
  }, [adapter]);

  return { state, connect, fund, disconnect };
}
