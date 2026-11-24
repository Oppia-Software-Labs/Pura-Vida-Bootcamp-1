"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { StellarServiceError } from "@/lib/stellar/errors";

import { loadRecentTransactions } from "../services/history";
import type { TransactionSummary } from "../types";

export type TransactionsStatus =
  | "idle"
  | "loading"
  | "ready"
  | "unfunded"
  | "error";

export interface UseTransactionsResult {
  status: TransactionsStatus;
  items: TransactionSummary[];
  error: StellarServiceError | null;
  refresh: () => void;
}

/**
 * The rows remember which address produced them, so a response that lands after
 * the address changed is inert instead of showing another account's history.
 */
interface LoadedHistory {
  address: string;
  status: "ready" | "unfunded" | "error";
  items: TransactionSummary[];
  error: StellarServiceError | null;
}

const NO_ITEMS: TransactionSummary[] = [];

export function useTransactions(address: string | null): UseTransactionsResult {
  const [loaded, setLoaded] = useState<LoadedHistory | null>(null);
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
      const result = await loadRecentTransactions(address);
      if (cancelled || generationRef.current !== generation) return;

      if (!result.ok) {
        setLoaded({
          address,
          status: "error",
          items: NO_ITEMS,
          error: result.error,
        });
        return;
      }

      if (result.data === null) {
        setLoaded({
          address,
          status: "unfunded",
          items: NO_ITEMS,
          error: null,
        });
        return;
      }

      setLoaded({
        address,
        status: "ready",
        items: result.data,
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
    return { status: "idle", items: NO_ITEMS, error: null, refresh };
  }

  if (loaded === null || loaded.address !== address) {
    return { status: "loading", items: NO_ITEMS, error: null, refresh };
  }

  return {
    status: loaded.status,
    items: loaded.items,
    error: loaded.error,
    refresh,
  };
}
