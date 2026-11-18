import { useEffect, useState } from "react";
import { getXlmBalance } from "@bloc/stellar/balance";

type Result = { address: string; balance: bigint | null; error: Error | null };

export function useBalance(address: string | null) {
  const [result, setResult] = useState<Result | null>(null);

  useEffect(() => {
    if (!address) return;
    let cancelled = false;
    getXlmBalance(address).then(
      (balance) => !cancelled && setResult({ address, balance, error: null }),
      (e) =>
        !cancelled &&
        setResult({ address, balance: null, error: e instanceof Error ? e : new Error(String(e)) }),
    );
    return () => {
      cancelled = true;
    };
  }, [address]);

  const current = result?.address === address ? result : null;
  return { balance: current?.balance ?? null, error: current?.error ?? null, loading: !current };
}
