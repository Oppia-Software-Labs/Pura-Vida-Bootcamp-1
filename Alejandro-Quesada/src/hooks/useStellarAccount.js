import { useState, useEffect, useCallback } from "react";
import {
  fetchAccount,
  fetchPaymentHistory,
  fetchVaultInfo,
  fetchVaultPosition,
  fundAccountWithFriendbot,
} from "../lib/stellar.js";

const REFRESH_INTERVAL = 15_000;
const EMPTY_POSITION = { shares: "0", usdc: "0" };
const EMPTY_VAULT = { tvl: "0", invested: "0", idle: "0", totalShares: "0", sharePrice: "1" };

export function useStellarAccount(publicKey) {
  const [account, setAccount] = useState(null);
  const [payments, setPayments] = useState([]);
  const [vault, setVault] = useState(EMPTY_VAULT);
  const [position, setPosition] = useState(EMPTY_POSITION);
  const [loading, setLoading] = useState(false);
  const [fundingLoading, setFundingLoading] = useState(false);
  const [accountNotFound, setAccountNotFound] = useState(false);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    if (!publicKey) return;
    setLoading(true);
    setError(null);
    try {
      const [acc, hist, pool, pos] = await Promise.all([
        fetchAccount(publicKey),
        fetchPaymentHistory(publicKey, 20),
        fetchVaultInfo().catch(() => EMPTY_VAULT),
        fetchVaultPosition(publicKey).catch(() => EMPTY_POSITION),
      ]);
      setAccount(acc);
      setPayments(hist);
      setVault(pool);
      setPosition(pos);
      setAccountNotFound(false);
    } catch (err) {
      if (err.response?.status === 404) {
        setAccountNotFound(true);
      } else {
        setError(err.message ?? "Failed to load account");
      }
    } finally {
      setLoading(false);
    }
  }, [publicKey]);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [refresh]);

  const fundAccount = useCallback(async () => {
    if (!publicKey) return;
    setFundingLoading(true);
    setError(null);
    try {
      await fundAccountWithFriendbot(publicKey);
      await refresh();
    } catch (err) {
      setError(err.message ?? "Friendbot funding failed");
    } finally {
      setFundingLoading(false);
    }
  }, [publicKey, refresh]);

  return {
    account,
    payments,
    vault,
    poolBalance: vault.tvl,
    position,
    loading,
    fundingLoading,
    accountNotFound,
    error,
    refresh,
    fundAccount,
  };
}
