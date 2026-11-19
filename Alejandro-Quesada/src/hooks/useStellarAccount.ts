"use client";

import { useState, useEffect, useCallback } from "react";
import {
  fetchAccount,
  fetchPaymentHistory,
  fetchVaultInfo,
  fetchVaultPosition,
  fundAccountWithFriendbot,
  type AccountInfo,
  type PaymentRecord,
  type VaultInfo,
  type VaultPosition,
} from "@/lib/stellar";

const REFRESH_INTERVAL = 15_000;
const EMPTY_POSITION: VaultPosition = { shares: "0", usdc: "0" };
const EMPTY_VAULT: VaultInfo = { tvl: "0", invested: "0", idle: "0", totalShares: "0", sharePrice: "1" };

export function useStellarAccount(publicKey: string | null) {
  const [account, setAccount] = useState<AccountInfo | null>(null);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [vault, setVault] = useState<VaultInfo>(EMPTY_VAULT);
  const [position, setPosition] = useState<VaultPosition>(EMPTY_POSITION);
  const [loading, setLoading] = useState(false);
  const [fundingLoading, setFundingLoading] = useState(false);
  const [accountNotFound, setAccountNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!publicKey) return;
    setLoading(true);
    setError(null);
    try {
      const [acc, hist, info, pos] = await Promise.all([
        fetchAccount(publicKey),
        fetchPaymentHistory(publicKey, 20),
        fetchVaultInfo().catch(() => EMPTY_VAULT),
        fetchVaultPosition(publicKey).catch(() => EMPTY_POSITION),
      ]);
      setAccount(acc);
      setPayments(hist);
      setVault(info);
      setPosition(pos);
      setAccountNotFound(false);
    } catch (err) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 404) setAccountNotFound(true);
      else setError(err instanceof Error ? err.message : "No se pudo cargar la cuenta");
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
      setError(err instanceof Error ? err.message : "Friendbot falló");
    } finally {
      setFundingLoading(false);
    }
  }, [publicKey, refresh]);

  return {
    account,
    payments,
    vault,
    position,
    loading,
    fundingLoading,
    accountNotFound,
    error,
    refresh,
    fundAccount,
  };
}
