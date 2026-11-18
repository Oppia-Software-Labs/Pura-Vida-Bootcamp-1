import { describe, expect, it } from "vitest";
import { before, landlordPredicate, parsePredicate, tenantPredicate } from "./predicates";

describe("predicates", () => {
  it("builds the landlord window as NOT before(E) AND before(D)", () => {
    expect(landlordPredicate(100, 200)).toEqual({
      and: [{ not: { abs_before_epoch: "100" } }, { abs_before_epoch: "200" }],
    });
  });

  it("builds the tenant predicate as NOT before(D)", () => {
    expect(tenantPredicate(200)).toEqual({ not: before(200) });
  });
});

describe("parsePredicate", () => {
  it("accepts the Plazo predicates, ignoring extra Horizon fields", () => {
    const fromHorizon = {
      and: [
        { not: { abs_before: "2026-11-18T04:33:41Z", abs_before_epoch: "100" } },
        { abs_before: "2026-11-18T04:36:41Z", abs_before_epoch: "200" },
      ],
    };
    expect(parsePredicate(fromHorizon)).toEqual(landlordPredicate(100, 200));
    expect(parsePredicate({ not: { abs_before_epoch: "200" } })).toEqual(tenantPredicate(200));
    expect(parsePredicate({ unconditional: true })).toEqual({ unconditional: true });
  });

  it("rejects relative times and malformed shapes", () => {
    expect(parsePredicate({ rel_before: "60" })).toBeNull();
    expect(parsePredicate({ abs_before_epoch: "abc" })).toBeNull();
    expect(parsePredicate({ and: [{ abs_before_epoch: "1" }] })).toBeNull();
    expect(parsePredicate({ not: { rel_before: "60" } })).toBeNull();
    expect(parsePredicate("nope")).toBeNull();
    expect(parsePredicate(null)).toBeNull();
  });
});
