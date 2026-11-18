import { Keypair } from "@stellar/stellar-sdk";
import { describe, expect, it } from "vitest";
import { planDeposit, type PlanInput } from "./plan";

const tenant = Keypair.fromRawEd25519Seed(new Uint8Array(32).fill(1)).publicKey();
const landlord = Keypair.fromRawEd25519Seed(new Uint8Array(32).fill(2)).publicKey();
const now = 1_000;

const valid: PlanInput = {
  tenant,
  landlord,
  amount: "100",
  endOfContract: now + 120,
  deadline: now + 300,
  nowSec: now,
};

function errorsOf(overrides: Partial<PlanInput>) {
  const result = planDeposit({ ...valid, ...overrides });
  return result.ok ? [] : result.errors;
}

describe("planDeposit", () => {
  it("returns a plan for valid input", () => {
    expect(planDeposit(valid)).toEqual({
      ok: true,
      plan: {
        tenant,
        landlord,
        totalStroops: 1_000_000_000n,
        endOfContract: now + 120,
        deadline: now + 300,
        repairCapBps: undefined,
      },
    });
  });

  it("rejects invalid or repeated addresses", () => {
    expect(errorsOf({ tenant: "nope" })).toEqual(["invalid_tenant"]);
    expect(errorsOf({ landlord: "nope" })).toEqual(["invalid_landlord"]);
    expect(errorsOf({ landlord: tenant })).toEqual(["same_account"]);
  });

  it("rejects zero, negative and malformed amounts", () => {
    expect(errorsOf({ amount: "0" })).toEqual(["invalid_amount"]);
    expect(errorsOf({ amount: "-5" })).toEqual(["invalid_amount"]);
    expect(errorsOf({ amount: "abc" })).toEqual(["invalid_amount"]);
  });

  it("requires E strictly in the future", () => {
    expect(errorsOf({ endOfContract: now })).toContain("end_not_in_future");
    expect(errorsOf({ endOfContract: now + 1 })).not.toContain("end_not_in_future");
  });

  it("requires E strictly before D", () => {
    expect(errorsOf({ deadline: now + 120 })).toEqual(["deadline_not_after_end"]);
    expect(errorsOf({ deadline: now + 121 })).toEqual([]);
  });

  it("validates the optional repair cap", () => {
    expect(errorsOf({ repairCapBps: 3000 })).toEqual([]);
    expect(errorsOf({ repairCapBps: 10_001 })).toEqual(["invalid_repair_cap"]);
  });

  it("collects every error at once", () => {
    expect(errorsOf({ tenant: "x", amount: "0", deadline: now })).toEqual([
      "invalid_tenant",
      "invalid_amount",
      "deadline_not_after_end",
    ]);
  });
});
