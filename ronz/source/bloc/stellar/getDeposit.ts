import { StrKey, type xdr } from "@stellar/stellar-sdk";
import { toDeposit } from "@bloc/entity/deposits";
import type { Deposit, Predicate } from "@bloc/entity/types";
import { rpcServer } from "./servers";

const BALANCE_ID = /^[0-9a-f]{72}$/i;

function fromXdrPredicate(predicate: xdr.ClaimPredicate): Predicate | null {
  switch (predicate.type) {
    case "claimPredicateUnconditional":
      return { unconditional: true };
    case "claimPredicateBeforeAbsoluteTime":
      return { abs_before_epoch: predicate.absBefore.toString() };
    case "claimPredicateNot": {
      const inner = predicate.notPredicate && fromXdrPredicate(predicate.notPredicate);
      return inner ? { not: inner } : null;
    }
    case "claimPredicateAnd":
    case "claimPredicateOr": {
      const operands = predicate.type === "claimPredicateAnd" ? predicate.andPredicates : predicate.orPredicates;
      if (operands.length !== 2) return null;
      const left = fromXdrPredicate(operands[0]);
      const right = fromXdrPredicate(operands[1]);
      if (!left || !right) return null;
      return predicate.type === "claimPredicateAnd" ? { and: [left, right] } : { or: [left, right] };
    }
    default:
      return null;
  }
}

export async function getDepositById(id: string, address: string): Promise<Deposit | null> {
  if (!BALANCE_ID.test(id)) return null;

  let entry;
  try {
    entry = await rpcServer.getClaimableBalance(id);
  } catch (error) {
    if (error instanceof Error && error.message.includes("not found")) return null;
    throw new Error("RPC request failed");
  }

  const claimants = entry.claimants.flatMap(({ v0 }) => {
    const predicate = fromXdrPredicate(v0.predicate);
    return predicate
      ? [{ destination: StrKey.encodeEd25519PublicKey(v0.destination.ed25519.value), predicate }]
      : [];
  });
  if (claimants.length !== entry.claimants.length) return null;

  return toDeposit(
    {
      id: id.toLowerCase(),
      isNative: entry.asset.type === "assetTypeNative",
      amountStroops: entry.amount,
      claimants,
    },
    address,
  );
}
