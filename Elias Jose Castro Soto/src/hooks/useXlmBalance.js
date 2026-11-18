import { useCallback, useEffect, useState } from "react";
import { getXlmBalance, fundWithFriendbot } from "@/lib/stellar";

// balance: undefined = consultando, null = cuenta sin fondear, string = XLM
export function useXlmBalance(address) {
  const [balance, setBalance] = useState(undefined);
  const [funding, setFunding] = useState(false);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    if (!address) return;
    setError(null);
    try {
      setBalance(await getXlmBalance(address));
    } catch (e) {
      setError(e.message);
    }
  }, [address]);

  useEffect(() => {
    if (!address) {
      setBalance(undefined);
      return;
    }
    refresh();
  }, [address, refresh]);

  const fund = useCallback(async () => {
    setFunding(true);
    setError(null);
    try {
      await fundWithFriendbot(address);
      await refresh();
    } catch (e) {
      setError(e.message);
    } finally {
      setFunding(false);
    }
  }, [address, refresh]);

  return { balance, funding, error, refresh, fund };
}
