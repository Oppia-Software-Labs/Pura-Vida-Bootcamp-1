import type { Deposit, Predicate } from "./types";

export type RawBalance = {
  id: string;
  isNative: boolean;
  amountStroops: bigint;
  claimants: { destination: string; predicate: Predicate }[];
};

function tenantDeadline(predicate: Predicate): number | null {
  if ("not" in predicate && "abs_before_epoch" in predicate.not) return Number(predicate.not.abs_before_epoch);
  return null;
}

function landlordWindow(predicate: Predicate): { end: number; deadline: number } | null {
  if (!("and" in predicate)) return null;
  const [left, right] = predicate.and;
  if ("not" in left && "abs_before_epoch" in left.not && "abs_before_epoch" in right) {
    return { end: Number(left.not.abs_before_epoch), deadline: Number(right.abs_before_epoch) };
  }
  return null;
}

export function toDeposit(raw: RawBalance, myAddress: string): Deposit | null {
  if (!raw.isNative || raw.claimants.length !== 2) return null;
  const [first, second] = raw.claimants;

  for (const [tenant, landlord] of [
    [first, second],
    [second, first],
  ]) {
    const deadline = tenantDeadline(tenant.predicate);
    const window = landlordWindow(landlord.predicate);
    if (deadline === null || !window || window.deadline !== deadline || window.end >= deadline) continue;

    const myRole =
      myAddress === tenant.destination ? "tenant" : myAddress === landlord.destination ? "landlord" : null;
    if (!myRole) return null;

    return {
      id: raw.id,
      amountStroops: raw.amountStroops,
      myRole,
      tenant: tenant.destination,
      landlord: landlord.destination,
      landlordPredicate: landlord.predicate,
      tenantPredicate: tenant.predicate,
    };
  }
  return null;
}
