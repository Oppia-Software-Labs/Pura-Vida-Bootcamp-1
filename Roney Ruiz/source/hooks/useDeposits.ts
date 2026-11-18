import { useEffect, useState } from "react";
import { getDepositById } from "@bloc/stellar/getDeposit";
import { listDepositsFor } from "@bloc/stellar/listDeposits";
import { loadDepositIds, readSharedDepositId } from "@bloc/storage/deposits";
import type { Deposit } from "@bloc/entity/types";

type Result = { address: string; deposits: Deposit[]; partial: boolean; error: Error | null };

async function loadDeposits(address: string): Promise<Omit<Result, "address">> {
  const shared = readSharedDepositId();
  const knownIds = [...new Set([...loadDepositIds(), ...(shared ? [shared] : [])])];
  const outcomes = await Promise.allSettled([
    listDepositsFor(address),
    ...knownIds.map((id) => getDepositById(id, address)),
  ]);
  const [listed, ...known] = outcomes;

  if (outcomes.every((outcome) => outcome.status === "rejected")) throw listed.status === "rejected" ? listed.reason : new Error("Horizon request failed");

  const found: Deposit[] = [];
  if (listed.status === "fulfilled") found.push(...listed.value);
  for (const outcome of known) if (outcome.status === "fulfilled" && outcome.value) found.push(outcome.value);

  const deposits = [...new Map(found.map((deposit) => [deposit.id, deposit])).values()];
  deposits.sort((a, b) => Number(b.id === shared) - Number(a.id === shared));
  return { deposits, partial: listed.status === "rejected", error: null };
}

export function useDeposits(address: string, refreshKey: number) {
  const [result, setResult] = useState<Result | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadDeposits(address).then(
      (loaded) => !cancelled && setResult({ address, ...loaded }),
      (e) =>
        !cancelled &&
        setResult({ address, deposits: [], partial: false, error: e instanceof Error ? e : new Error(String(e)) }),
    );
    return () => {
      cancelled = true;
    };
  }, [address, refreshKey]);

  const current = result?.address === address ? result : null;
  return {
    deposits: current?.deposits ?? [],
    partial: current?.partial ?? false,
    error: current?.error ?? null,
    loading: !current,
  };
}
