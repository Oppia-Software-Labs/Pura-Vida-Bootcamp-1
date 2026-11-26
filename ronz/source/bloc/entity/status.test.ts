import { describe, expect, it } from "vitest";
import { landlordPredicate, tenantPredicate } from "./predicates";
import { deriveStatus } from "./status";
import type { Deposit, Role } from "./types";

const E = 1_000;
const D = 2_000;

function deposit(myRole: Role): Deposit {
  return {
    id: "balance-id",
    amountStroops: 1_000_000_000n,
    myRole,
    tenant: "tenant-address",
    landlord: "landlord-address",
    landlordPredicate: landlordPredicate(E, D),
    tenantPredicate: tenantPredicate(D),
  };
}

describe("deriveStatus", () => {
  it("waits before E and nobody can claim", () => {
    expect(deriveStatus(deposit("landlord"), E - 1)).toEqual({
      status: "waiting",
      canClaimNow: false,
      nextChangeAt: E,
    });
    expect(deriveStatus(deposit("tenant"), E - 1).canClaimNow).toBe(false);
  });

  it("opens the landlord window exactly at t == E", () => {
    expect(deriveStatus(deposit("landlord"), E)).toEqual({
      status: "landlord_window",
      canClaimNow: true,
      nextChangeAt: D,
    });
    expect(deriveStatus(deposit("tenant"), E).canClaimNow).toBe(false);
  });

  it("hands the deposit to the tenant exactly at t == D", () => {
    expect(deriveStatus(deposit("tenant"), D)).toEqual({
      status: "tenant_claimable",
      canClaimNow: true,
      nextChangeAt: undefined,
    });
    expect(deriveStatus(deposit("landlord"), D).canClaimNow).toBe(false);
  });

  it("reports claimed deposits as not claimable", () => {
    expect(deriveStatus(deposit("tenant"), D + 1, true)).toEqual({
      status: "claimed",
      canClaimNow: false,
      nextChangeAt: undefined,
    });
  });
});
