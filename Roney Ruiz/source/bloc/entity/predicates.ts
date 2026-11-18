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

export function parsePredicate(value: unknown): Predicate | null {
  if (typeof value !== "object" || value === null) return null;
  if ("unconditional" in value) return { unconditional: true };
  if ("and" in value || "or" in value) {
    const operator = "and" in value ? "and" : "or";
    const operands = (value as Record<string, unknown>)[operator];
    if (!Array.isArray(operands) || operands.length !== 2) return null;
    const left = parsePredicate(operands[0]);
    const right = parsePredicate(operands[1]);
    if (!left || !right) return null;
    return operator === "and" ? { and: [left, right] } : { or: [left, right] };
  }
  if ("not" in value) {
    const inner = parsePredicate(value.not);
    return inner ? { not: inner } : null;
  }
  if ("abs_before_epoch" in value && typeof value.abs_before_epoch === "string" && /^\d+$/.test(value.abs_before_epoch)) {
    return { abs_before_epoch: value.abs_before_epoch };
  }
  return null;
}
