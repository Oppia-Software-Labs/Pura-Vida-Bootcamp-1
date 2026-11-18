import { useCallback, useState } from "react";
import { buildCreateDeposit } from "@bloc/stellar/buildCreateDeposit";
import { submitCreateDeposit } from "@bloc/stellar/submit";
import { saveDepositId } from "@bloc/storage/deposits";
import { signXdr } from "@bloc/wallet/varial";
import type { DepositPlan } from "@bloc/entity/types";

export function useCreateDeposit(address: string, onCreated?: () => void) {
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [depositId, setDepositId] = useState<string | null>(null);
  const [createdPlan, setCreatedPlan] = useState<DepositPlan | null>(null);

  const create = useCallback(
    async (plan: DepositPlan) => {
      setCreating(true);
      setError(null);
      try {
        const xdr = await buildCreateDeposit(plan);
        const signed = await signXdr(xdr, address);
        const id = await submitCreateDeposit(signed);
        saveDepositId(id);
        setDepositId(id);
        setCreatedPlan(plan);
        onCreated?.();
      } catch (e) {
        setError(e instanceof Error ? e : new Error(String(e)));
      } finally {
        setCreating(false);
      }
    },
    [address, onCreated],
  );

  const reset = useCallback(() => {
    setDepositId(null);
    setCreatedPlan(null);
    setError(null);
  }, []);

  return { creating, error, depositId, createdPlan, create, reset };
}
