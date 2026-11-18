export type Role = "tenant" | "landlord";

export type Status =
  | "waiting"
  | "landlord_window"
  | "tenant_claimable"
  | "claimed";

export type Predicate =
  | { unconditional: true }
  | { and: [Predicate, Predicate] }
  | { or: [Predicate, Predicate] }
  | { not: Predicate }
  | { abs_before_epoch: string };

export type DepositPlan = {
  tenant: string;
  landlord: string;
  totalStroops: bigint;
  endOfContract: number;
  deadline: number;
  repairCapBps?: number;
};

export type Deposit = {
  id: string;
  amountStroops: bigint;
  myRole: Role;
  landlordPredicate: Predicate;
  tenantPredicate: Predicate;
};

export type DepositState = {
  status: Status;
  canClaimNow: boolean;
  nextChangeAt?: number;
};
