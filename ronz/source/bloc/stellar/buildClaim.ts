import { BASE_FEE, Operation, TransactionBuilder } from "@stellar/stellar-sdk";
import { network } from "@config/network";
import { horizon } from "./servers";

const TRANSACTION_TIMEOUT_SECONDS = 300;

export async function buildClaim(balanceId: string, claimant: string): Promise<string> {
  const source = await horizon.loadAccount(claimant);
  const transaction = new TransactionBuilder(source, {
    fee: BASE_FEE,
    networkPassphrase: network.passphrase,
  })
    .addOperation(Operation.claimClaimableBalance({ balanceId }))
    .setTimeout(TRANSACTION_TIMEOUT_SECONDS)
    .build();
  return transaction.toXDR();
}
