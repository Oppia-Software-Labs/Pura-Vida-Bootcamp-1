import { useCallback, useEffect, useState } from "react";
import { explainError, getAccountInfo, type AccountInfo } from "./horizon";

/** Lee el balance de Horizon Testnet para una dirección. */
export function useAccount(address: string | null) {
  const [info, setInfo] = useState<AccountInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!address) {
      setInfo(null);
      setError(null);
      return;
    }
    let alive = true;
    setLoading(true);
    setError(null);
    getAccountInfo(address)
      .then((r) => alive && setInfo(r))
      .catch((e) => alive && setError(explainError(e)))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [address, tick]);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  return { info, loading, error, reload };
}
