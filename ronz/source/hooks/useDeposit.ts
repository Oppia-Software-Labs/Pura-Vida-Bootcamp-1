import { useEffect, useState } from "react";
import { getDepositById } from "@bloc/stellar/getDeposit";
import type { Deposit } from "@bloc/entity/types";

type Result = { key: string; deposit: Deposit | null; error: Error | null };

export function useDeposit(address: string, id: string) {
  const [result, setResult] = useState<Result | null>(null);
  const [version, setVersion] = useState(0);
  const key = `${address}:${id}`;

  useEffect(() => {
    let cancelled = false;
    getDepositById(id, address).then(
      (deposit) => !cancelled && setResult({ key, deposit, error: null }),
      (e) =>
        !cancelled && setResult({ key, deposit: null, error: e instanceof Error ? e : new Error(String(e)) }),
    );
    return () => {
      cancelled = true;
    };
  }, [address, id, key, version]);

  const current = result?.key === key ? result : null;
  return {
    deposit: current?.deposit ?? null,
    error: current?.error ?? null,
    loading: !current,
    retry: () => setVersion((value) => value + 1),
  };
}
