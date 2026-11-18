import { describe, expect, it } from "vitest";
import { toDeposit, type RawBalance } from "./deposits";
import { landlordPredicate, tenantPredicate } from "./predicates";

const E = 1_000;
const D = 2_000;

const raw: RawBalance = {
  id: "balance-id",
  isNative: true,
  amountStroops: 1_000_000_000n,
  claimants: [
    { destination: "TENANT", predicate: tenantPredicate(D) },
    { destination: "LANDLORD", predicate: landlordPredicate(E, D) },
  ],
};

describe("toDeposit", () => {
  it("maps a Plazo balance for the tenant", () => {
    expect(toDeposit(raw, "TENANT")).toEqual({
      id: "balance-id",
      amountStroops: 1_000_000_000n,
      myRole: "tenant",
      tenant: "TENANT",
      landlord: "LANDLORD",
      landlordPredicate: landlordPredicate(E, D),
      tenantPredicate: tenantPredicate(D),
    });
  });

  it("maps the same balance for the landlord, whatever the claimant order", () => {
    const reversed = { ...raw, claimants: [raw.claimants[1], raw.claimants[0]] };
    expect(toDeposit(reversed, "LANDLORD")?.myRole).toBe("landlord");
  });

  it("ignores balances of other accounts", () => {
    expect(toDeposit(raw, "STRANGER")).toBeNull();
  });

  it("ignores balances that are not native or not two claimants", () => {
    expect(toDeposit({ ...raw, isNative: false }, "TENANT")).toBeNull();
    expect(toDeposit({ ...raw, claimants: [raw.claimants[0]] }, "TENANT")).toBeNull();
  });

  it("ignores balances whose predicates are not the Plazo shape", () => {
    const unconditional = { destination: "LANDLORD", predicate: { unconditional: true as const } };
    expect(toDeposit({ ...raw, claimants: [raw.claimants[0], unconditional] }, "TENANT")).toBeNull();
  });

  it("ignores balances whose deadlines do not match or whose window is inverted", () => {
    const mismatched = { destination: "LANDLORD", predicate: landlordPredicate(E, D + 1) };
    expect(toDeposit({ ...raw, claimants: [raw.claimants[0], mismatched] }, "TENANT")).toBeNull();
    const inverted = { destination: "LANDLORD", predicate: landlordPredicate(D, D) };
    expect(toDeposit({ ...raw, claimants: [raw.claimants[0], inverted] }, "TENANT")).toBeNull();
  });
});
