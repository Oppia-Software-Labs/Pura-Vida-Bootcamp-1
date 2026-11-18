import { describe, expect, it } from "vitest";
import { before, landlordPredicate, tenantPredicate } from "./predicates";

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
