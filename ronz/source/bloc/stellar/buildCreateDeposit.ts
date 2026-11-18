import { Asset, BASE_FEE, Claimant, Operation, TransactionBuilder } from "@stellar/stellar-sdk";
import { network } from "@config/network";
import { formatStroops } from "@bloc/entity/money";
import { landlordPredicate, tenantPredicate } from "@bloc/entity/predicates";
import type { DepositPlan } from "@bloc/entity/types";
import { toClaimPredicate } from "./predicate";
import { horizon } from "./servers";

const TRANSACTION_TIMEOUT_SECONDS = 300;

export async function buildCreateDeposit(plan: DepositPlan): Promise<string> {
  const source = await horizon.loadAccount(plan.tenant);
  const transaction = new TransactionBuilder(source, {
    fee: BASE_FEE,
    networkPassphrase: network.passphrase,
  })
    .addOperation(
      Operation.createClaimableBalance({
        asset: Asset.native(),
        amount: formatStroops(plan.totalStroops),
        claimants: [
          new Claimant(plan.tenant, toClaimPredicate(tenantPredicate(plan.deadline))),
          new Claimant(
            plan.landlord,
            toClaimPredicate(landlordPredicate(plan.endOfContract, plan.deadline)),
          ),
        ],
      }),
    )
    .setTimeout(TRANSACTION_TIMEOUT_SECONDS)
    .build();
  return transaction.toXDR();
}
