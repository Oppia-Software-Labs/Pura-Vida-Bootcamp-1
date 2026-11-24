import { useCallback, useState } from "react";
import { buildClaim } from "@bloc/stellar/buildClaim";
import { submitSigned } from "@bloc/stellar/submit";
import { signXdr } from "@bloc/wallet/varial";

type Failure = { id: string; error: Error };

export function useClaim(address: string, onClaimed?: () => void) {
  const [claimingId, setClaimingId] = useState<string | null>(null);
  const [failure, setFailure] = useState<Failure | null>(null);
  const [claimedIds, setClaimedIds] = useState<ReadonlySet<string>>(new Set());

  const markClaimed = (id: string) => setClaimedIds((ids) => new Set(ids).add(id));

  const claim = useCallback(
    async (id: string) => {
      setClaimingId(id);
      setFailure(null);
      try {
        const xdr = await buildClaim(id, address);
        const signed = await signXdr(xdr, address);
        await submitSigned(signed);
        markClaimed(id);
        onClaimed?.();
      } catch (e) {
        const error = e instanceof Error ? e : new Error(String(e));
        if (error.message.includes("op_does_not_exist")) markClaimed(id);
        setFailure({ id, error });
      } finally {
        setClaimingId(null);
      }
    },
    [address, onClaimed],
  );

  return { claim, claimingId, failure, claimedIds };
}
