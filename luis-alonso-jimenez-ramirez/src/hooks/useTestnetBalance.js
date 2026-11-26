import { useState, useEffect, useCallback } from "react";
import {
  fetchTestnetXlmBalance,
  fundTestnetAccount,
} from "../lib/stellar.js";

export function useTestnetBalance(address) {
  const [balance, setBalance] = useState(null);
  const [funded, setFunded] = useState(true);
  const [loading, setLoading] = useState(false);
  const [funding, setFunding] = useState(false);
  const [error, setError] = useState(null);

  const refreshBalance = useCallback(async () => {
    if (!address) {
      setBalance(null);
      setFunded(true);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await fetchTestnetXlmBalance(address);
      setFunded(result.funded);
      setBalance(result.balance);
    } catch (err) {
      setError(
        err?.message ||
          "No se pudo consultar el balance en Horizon Testnet. Intenta de nuevo."
      );
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => {
    refreshBalance();
  }, [refreshBalance]);

  const fundWithFriendbot = useCallback(async () => {
    if (!address) return;

    setFunding(true);
    setError(null);

    try {
      await fundTestnetAccount(address);
      await refreshBalance();
    } catch (err) {
      setError(
        err?.message ||
          "No se pudo fondear la cuenta con Friendbot en Testnet."
      );
    } finally {
      setFunding(false);
    }
  }, [address, refreshBalance]);

  return {
    balance,
    funded,
    loading,
    funding,
    error,
    refreshBalance,
    fundWithFriendbot,
  };
}
