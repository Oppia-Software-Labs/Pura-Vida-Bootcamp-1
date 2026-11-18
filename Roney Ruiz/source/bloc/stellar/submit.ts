import { Transaction, TransactionBuilder, TransactionFailedError } from "@stellar/stellar-sdk";
import { network } from "@config/network";
import { horizon } from "./servers";

export async function submitCreateDeposit(signedXdr: string): Promise<string> {
  const transaction = TransactionBuilder.fromXdr(signedXdr, network.passphrase);
  if (!(transaction instanceof Transaction)) throw new Error("Unexpected fee bump transaction");

  try {
    await horizon.submitTransaction(transaction);
  } catch (error) {
    if (error instanceof TransactionFailedError) {
      const { transaction: transactionCode, operations } = error.getResultCodes();
      throw new Error(`Transaction rejected: ${operations[0] ?? transactionCode}`);
    }
    throw new Error("Horizon request failed");
  }

  return transaction.getClaimableBalanceId(0);
}
