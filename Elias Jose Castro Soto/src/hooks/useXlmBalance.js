import { useCallback, useEffect, useState } from "react";
import { getXlmBalance } from "@/lib/stellar";

// balance: undefined = consultando, null = cuenta sin fondear, string = XLM
export function useXlmBalance(address) {
  const [balance, setBalance] = useState(undefined);
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

  return { balance, error, refresh };
}
