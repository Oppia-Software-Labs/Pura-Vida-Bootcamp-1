"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { StellarServiceError } from "@/lib/stellar/errors";

import { loadAccountSnapshot } from "../services/account";
import type { AccountSnapshot, AccountStatus } from "../types";

export interface UseAccountResult {
  status: AccountStatus;
  snapshot: AccountSnapshot | null;
  error: StellarServiceError | null;
  refresh: () => void;
}

/**
 * The snapshot remembers which address produced it, so a response that lands
 * after the address changed is inert instead of showing another account's balance.
 */
interface LoadedAccount {
  address: string;
  status: "funded" | "unfunded" | "error";
  snapshot: AccountSnapshot | null;
  error: StellarServiceError | null;
}

const IDLE_RESULT = {
  status: "idle" as const,
  snapshot: null,
  error: null,
};

const LOADING_RESULT = {
  status: "loading" as const,
  snapshot: null,
  error: null,
};

export function useAccount(address: string | null): UseAccountResult {
  const [loaded, setLoaded] = useState<LoadedAccount | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);
  /** Bumped per request so a slow response for a previous address is discarded. */
  const generationRef = useRef(0);

  useEffect(() => {
    if (address === null) {
      // No request to run, but any read still in flight for the previous address
      // must not be able to settle into state.
      generationRef.current += 1;
      return;
    }

    let cancelled = false;
    const generation = generationRef.current + 1;
    generationRef.current = generation;

    const load = async () => {
      const result = await loadAccountSnapshot(address);
      if (cancelled || generationRef.current !== generation) return;

      if (!result.ok) {
        setLoaded({
          address,
          status: "error",
          snapshot: null,
          error: result.error,
        });
        return;
      }

      if (result.data === null) {
        setLoaded({
          address,
          status: "unfunded",
          snapshot: null,
          error: null,
        });
        return;
      }

      setLoaded({
        address,
        status: "funded",
        snapshot: result.data,
        error: null,
      });
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [address, refreshToken]);

  const refresh = useCallback(() => {
    // Invalidate in-flight reads and drop the rows so the reload is visible.
    generationRef.current += 1;
    setLoaded(null);
    setRefreshToken((token) => token + 1);
  }, []);

  if (address === null) {
    return { ...IDLE_RESULT, refresh };
  }

  if (loaded === null || loaded.address !== address) {
    return { ...LOADING_RESULT, refresh };
  }

  return {
    status: loaded.status,
    snapshot: loaded.snapshot,
    error: loaded.error,
    refresh,
  };
}
