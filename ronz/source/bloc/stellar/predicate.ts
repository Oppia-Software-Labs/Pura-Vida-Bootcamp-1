import { Claimant, type xdr } from "@stellar/stellar-sdk";
import type { Predicate } from "@bloc/entity/types";

export function toClaimPredicate(predicate: Predicate): xdr.ClaimPredicate {
  if ("unconditional" in predicate) return Claimant.predicateUnconditional();
  if ("and" in predicate) {
    return Claimant.predicateAnd(toClaimPredicate(predicate.and[0]), toClaimPredicate(predicate.and[1]));
  }
  if ("or" in predicate) {
    return Claimant.predicateOr(toClaimPredicate(predicate.or[0]), toClaimPredicate(predicate.or[1]));
  }
  if ("not" in predicate) return Claimant.predicateNot(toClaimPredicate(predicate.not));
  return Claimant.predicateBeforeAbsoluteTime(predicate.abs_before_epoch);
}
