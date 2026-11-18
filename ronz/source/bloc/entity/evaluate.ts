import type { Predicate } from "./types";

export function evalPred(predicate: Predicate, nowSec: number): boolean {
  if ("unconditional" in predicate) return true;
  if ("and" in predicate) {
    return evalPred(predicate.and[0], nowSec) && evalPred(predicate.and[1], nowSec);
  }
  if ("or" in predicate) {
    return evalPred(predicate.or[0], nowSec) || evalPred(predicate.or[1], nowSec);
  }
  if ("not" in predicate) return !evalPred(predicate.not, nowSec);
  return nowSec < Number(predicate.abs_before_epoch);
}

function boundaries(predicate: Predicate): number[] {
  if ("unconditional" in predicate) return [];
  if ("and" in predicate) return predicate.and.flatMap(boundaries);
  if ("or" in predicate) return predicate.or.flatMap(boundaries);
  if ("not" in predicate) return boundaries(predicate.not);
  return [Number(predicate.abs_before_epoch)];
}

export function nextChangeAt(predicate: Predicate, nowSec: number): number | undefined {
  const upcoming = boundaries(predicate).filter((time) => time > nowSec);
  return upcoming.length ? Math.min(...upcoming) : undefined;
}
