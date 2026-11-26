export type HorizonPredicate =
  | { unconditional: true }
  | { abs_before: string; abs_before_epoch?: string }
  | { rel_before: string }
  | { not: HorizonPredicate }
  | { and: HorizonPredicate[] }
  | { or: HorizonPredicate[] };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function parsePredicate(value: unknown): HorizonPredicate | null {
  if (!isRecord(value)) return null;
  if (value.unconditional === true) return { unconditional: true };
  if (typeof value.abs_before === "string" || typeof value.abs_before_epoch === "string") {
    return {
      abs_before: String(value.abs_before ?? ""),
      abs_before_epoch:
        typeof value.abs_before_epoch === "string" ? value.abs_before_epoch : undefined,
    };
  }
  if (typeof value.rel_before === "string" || typeof value.rel_before === "number") {
    return { rel_before: String(value.rel_before) };
  }
  if ("not" in value) {
    const inner = parsePredicate(value.not);
    return inner ? { not: inner } : null;
  }
  if (Array.isArray(value.and)) {
    const parts = value.and.map(parsePredicate);
    if (parts.some((part) => part === null)) return null;
    return { and: parts as HorizonPredicate[] };
  }
  if (Array.isArray(value.or)) {
    const parts = value.or.map(parsePredicate);
    if (parts.some((part) => part === null)) return null;
    return { or: parts as HorizonPredicate[] };
  }
  return null;
}

export function evaluatePredicate(
  predicate: HorizonPredicate,
  nowSec: number,
  createdSec: number,
): boolean {
  if ("unconditional" in predicate) return true;
  if ("abs_before" in predicate) {
    const epoch = Number(predicate.abs_before_epoch);
    if (Number.isFinite(epoch) && epoch > 0) return nowSec < epoch;
    const millis = Date.parse(predicate.abs_before);
    if (!Number.isFinite(millis)) return false;
    return nowSec < Math.floor(millis / 1000);
  }
  if ("rel_before" in predicate) {
    return nowSec < createdSec + Number(predicate.rel_before);
  }
  if ("not" in predicate) {
    return !evaluatePredicate(predicate.not, nowSec, createdSec);
  }
  if ("and" in predicate) {
    return predicate.and.every((part) => evaluatePredicate(part, nowSec, createdSec));
  }
  if ("or" in predicate) {
    return predicate.or.some((part) => evaluatePredicate(part, nowSec, createdSec));
  }
  const _exhaustive: never = predicate;
  return _exhaustive;
}

function absEpoch(predicate: Extract<HorizonPredicate, { abs_before: string }>): number | null {
  const epoch = Number(predicate.abs_before_epoch);
  if (Number.isFinite(epoch) && epoch > 0) return epoch;
  const millis = Date.parse(predicate.abs_before);
  return Number.isFinite(millis) ? Math.floor(millis / 1000) : null;
}

export function nextChangeAt(
  predicate: HorizonPredicate,
  createdSec: number,
): number | null {
  if ("unconditional" in predicate) return null;
  if ("abs_before" in predicate) return absEpoch(predicate);
  if ("rel_before" in predicate) {
    const rel = Number(predicate.rel_before);
    return Number.isFinite(rel) ? createdSec + rel : null;
  }
  if ("not" in predicate) return nextChangeAt(predicate.not, createdSec);
  if ("and" in predicate || "or" in predicate) {
    const parts = "and" in predicate ? predicate.and : predicate.or;
    const times = parts
      .map((part) => nextChangeAt(part, createdSec))
      .filter((time): time is number => time !== null);
    return times.length === 0 ? null : Math.min(...times);
  }
  const _exhaustive: never = predicate;
  return _exhaustive;
}

export function formatCountdown(targetSec: number, nowSec: number): string {
  const remaining = Math.max(0, targetSec - nowSec);
  const hours = Math.floor(remaining / 3600);
  const minutes = Math.floor((remaining % 3600) / 60);
  const seconds = remaining % 60;
  if (hours > 0) {
    return `${hours}h ${String(minutes).padStart(2, "0")}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${String(seconds).padStart(2, "0")}s`;
  }
  return `${seconds}s`;
}
