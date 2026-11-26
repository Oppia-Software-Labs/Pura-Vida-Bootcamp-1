import { xlmToStroops } from "@bloc/entity/money";
import { toDeposit } from "@bloc/entity/deposits";
import { parsePredicate } from "@bloc/entity/predicates";
import type { Deposit } from "@bloc/entity/types";
import { horizon } from "./servers";

const PAGE_SIZE = 200;

export async function listDepositsFor(address: string): Promise<Deposit[]> {
  let records;
  try {
    const page = await horizon.claimableBalances().claimant(address).order("desc").limit(PAGE_SIZE).call();
    records = page.records;
  } catch {
    throw new Error("Horizon request failed");
  }

  return records.flatMap((record) => {
    const claimants = record.claimants.flatMap((claimant) => {
      const predicate = parsePredicate(claimant.predicate);
      return predicate ? [{ destination: claimant.destination, predicate }] : [];
    });
    if (claimants.length !== record.claimants.length) return [];

    const deposit = toDeposit(
      {
        id: record.id,
        isNative: record.asset === "native",
        amountStroops: xlmToStroops(record.amount),
        claimants,
      },
      address,
    );
    return deposit ? [deposit] : [];
  });
}
