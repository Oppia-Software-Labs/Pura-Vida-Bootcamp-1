import type { Predicate } from "./types";

export function before(epochSec: number): Predicate {
  return { abs_before_epoch: String(epochSec) };
}

export function landlordPredicate(endOfContract: number, deadline: number): Predicate {
  return { and: [{ not: before(endOfContract) }, before(deadline)] };
}

export function tenantPredicate(deadline: number): Predicate {
  return { not: before(deadline) };
}
