import { evalPred, nextChangeAt } from "./evaluate";
import type { Deposit, DepositState, Status } from "./types";

export function deriveStatus(deposit: Deposit, nowSec: number, claimed = false): DepositState {
  const landlordCan = evalPred(deposit.landlordPredicate, nowSec);
  const tenantCan = evalPred(deposit.tenantPredicate, nowSec);
  const myPredicate =
    deposit.myRole === "landlord" ? deposit.landlordPredicate : deposit.tenantPredicate;

  let status: Status = "waiting";
  if (claimed) status = "claimed";
  else if (tenantCan) status = "tenant_claimable";
  else if (landlordCan) status = "landlord_window";

  return {
    status,
    canClaimNow: !claimed && evalPred(myPredicate, nowSec),
    nextChangeAt: claimed
      ? undefined
      : nextChangeAt({ or: [deposit.landlordPredicate, deposit.tenantPredicate] }, nowSec),
  };
}
