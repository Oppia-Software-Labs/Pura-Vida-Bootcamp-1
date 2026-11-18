import { StrKey } from "@stellar/stellar-sdk";
import { splitWithCap, xlmToStroops } from "./money";
import type { DepositPlan } from "./types";

export const RESERVE_MARGIN_STROOPS = 20_000_000n;

export type PlanInput = {
  tenant: string;
  landlord: string;
  amount: string;
  endOfContract: number;
  deadline: number;
  nowSec: number;
  balanceStroops?: bigint | null;
  repairCapBps?: number;
};

export type PlanError =
  | "invalid_tenant"
  | "invalid_landlord"
  | "same_account"
  | "invalid_amount"
  | "end_not_in_future"
  | "deadline_not_after_end"
  | "insufficient_balance"
  | "invalid_repair_cap";

export type PlanResult =
  | { ok: true; plan: DepositPlan }
  | { ok: false; errors: PlanError[] };

function parseAmount(amount: string): bigint | null {
  try {
    const stroops = xlmToStroops(amount);
    return stroops > 0n ? stroops : null;
  } catch {
    return null;
  }
}

function capIsValid(total: bigint, bps: number): boolean {
  try {
    splitWithCap(total, bps);
    return true;
  } catch {
    return false;
  }
}

export function planDeposit(input: PlanInput): PlanResult {
  const errors: PlanError[] = [];
  const tenantValid = StrKey.isValidEd25519PublicKey(input.tenant);
  const landlordValid = StrKey.isValidEd25519PublicKey(input.landlord);
  const totalStroops = parseAmount(input.amount);

  if (!tenantValid) errors.push("invalid_tenant");
  if (!landlordValid) errors.push("invalid_landlord");
  if (tenantValid && landlordValid && input.tenant === input.landlord) errors.push("same_account");
  if (totalStroops === null) errors.push("invalid_amount");
  if (!(input.endOfContract > input.nowSec)) errors.push("end_not_in_future");
  if (!(input.endOfContract < input.deadline)) errors.push("deadline_not_after_end");
  if (
    totalStroops !== null &&
    input.balanceStroops != null &&
    totalStroops + RESERVE_MARGIN_STROOPS > input.balanceStroops
  ) {
    errors.push("insufficient_balance");
  }
  if (
    input.repairCapBps !== undefined &&
    totalStroops !== null &&
    !capIsValid(totalStroops, input.repairCapBps)
  ) {
    errors.push("invalid_repair_cap");
  }

  if (errors.length > 0 || totalStroops === null) return { ok: false, errors };

  return {
    ok: true,
    plan: {
      tenant: input.tenant,
      landlord: input.landlord,
      totalStroops,
      endOfContract: input.endOfContract,
      deadline: input.deadline,
      repairCapBps: input.repairCapBps,
    },
  };
}
