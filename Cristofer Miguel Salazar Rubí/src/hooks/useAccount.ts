import { useCallback, useEffect, useRef, useState } from "react";
import {
  loadAccount,
  type AccountSnapshot,
} from "../lib/stellar";

export type AccountStatus =
  | "idle"
  | "loading"
  | "ready"
  | "unfunded"
  | "error";

export interface AccountState {
  account: AccountSnapshot | null;
  status: AccountStatus;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useAccount(address: string | null): AccountState {
  const [account, setAccount] = useState<AccountSnapshot | null>(null);
  const [status, setStatus] = useState<AccountStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const requestId = useRef(0);

  const refresh = useCallback(async () => {
    if (!address) {
      setAccount(null);
      setStatus("idle");
      setError(null);
      return;
    }

    const currentRequest = ++requestId.current;
    setStatus("loading");
    setError(null);

    try {
      const snapshot = await loadAccount(address);
      if (currentRequest !== requestId.current) return;

      setAccount(snapshot);
      setStatus(snapshot ? "ready" : "unfunded");
    } catch (loadError) {
      if (currentRequest !== requestId.current) return;

      setAccount(null);
      setStatus("error");
      setError(
        loadError instanceof Error
          ? loadError.message
          : "No se pudo consultar la cuenta en Horizon.",
      );
    }
  }, [address]);

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect -- refresh() flips the loading state before fetching
    void refresh();

    return () => {
      requestId.current += 1;
    };
  }, [refresh]);

  return { account, status, error, refresh };
}
