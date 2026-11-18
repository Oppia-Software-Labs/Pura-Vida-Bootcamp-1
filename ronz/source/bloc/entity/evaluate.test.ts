import { describe, expect, it } from "vitest";
import { evalPred, nextChangeAt } from "./evaluate";
import { before, landlordPredicate, tenantPredicate } from "./predicates";

const E = 1_000;
const D = 2_000;
const landlord = landlordPredicate(E, D);
const tenant = tenantPredicate(D);

describe("evalPred", () => {
  it("nobody can claim before E", () => {
    expect(evalPred(landlord, E - 1)).toBe(false);
    expect(evalPred(tenant, E - 1)).toBe(false);
  });

  it("the landlord can claim exactly at t == E", () => {
    expect(evalPred(landlord, E)).toBe(true);
    expect(evalPred(tenant, E)).toBe(false);
  });

  it("only the landlord can claim between E and D", () => {
    expect(evalPred(landlord, D - 1)).toBe(true);
    expect(evalPred(tenant, D - 1)).toBe(false);
  });

  it("the tenant can claim and the landlord cannot exactly at t == D", () => {
    expect(evalPred(landlord, D)).toBe(false);
    expect(evalPred(tenant, D)).toBe(true);
  });

  it("only the tenant can claim long after D", () => {
    expect(evalPred(landlord, D + 10_000)).toBe(false);
    expect(evalPred(tenant, D + 10_000)).toBe(true);
  });

  it("evaluates unconditional and or", () => {
    expect(evalPred({ unconditional: true }, 0)).toBe(true);
    expect(evalPred({ or: [before(10), { not: before(5) }] }, 7)).toBe(true);
    expect(evalPred({ or: [before(5), before(6)] }, 7)).toBe(false);
  });
});

describe("nextChangeAt", () => {
  it("returns the next boundary after now", () => {
    expect(nextChangeAt(landlord, 0)).toBe(E);
    expect(nextChangeAt(landlord, E)).toBe(D);
  });

  it("returns undefined when nothing changes anymore", () => {
    expect(nextChangeAt(landlord, D)).toBeUndefined();
    expect(nextChangeAt({ unconditional: true }, 0)).toBeUndefined();
  });
});
