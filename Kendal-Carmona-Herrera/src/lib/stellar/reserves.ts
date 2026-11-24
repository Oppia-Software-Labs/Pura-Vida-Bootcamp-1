/**
 * Pure XLM arithmetic for the read layer.
 *
 * Every amount is kept in stroops (1 XLM = 10,000,000 stroops) as a `bigint` so a
 * balance never picks up binary floating-point drift; conversion back to a string
 * happens once, at the edge. No Horizon or React imports belong here: this module
 * must stay trivially testable.
 */

const XLM_DECIMALS = 7;
const STROOPS_PER_XLM_VALUE = BigInt(10_000_000);
const STROOPS_ZERO = BigInt(0);
const STROOPS_PER_BASE_RESERVE = STROOPS_PER_XLM_VALUE / BigInt(2);
const XLM_AMOUNT_PATTERN = /^-?\d+(?:\.\d{1,7})?$/;

export const STROOPS_PER_XLM: bigint = STROOPS_PER_XLM_VALUE;

/**
 * Accepts exactly the shape Horizon emits (at most seven decimals) and rejects
 * everything else, so a corrupted string fails loudly instead of becoming 0.
 */
export function xlmToStroops(value: string): bigint {
  const trimmed = value.trim();

  if (!XLM_AMOUNT_PATTERN.test(trimmed)) {
    throw new RangeError(`Invalid XLM amount: "${value}"`);
  }

  const negative = trimmed.startsWith("-");
  const unsigned = negative ? trimmed.slice(1) : trimmed;
  const [whole, fraction = ""] = unsigned.split(".");
  const stroops =
    BigInt(whole) * STROOPS_PER_XLM + BigInt(fraction.padEnd(XLM_DECIMALS, "0"));

  return negative ? -stroops : stroops;
}

export function stroopsToXlm(stroops: bigint): string {
  // Balances are never rendered negative: a negative spendable amount is clamped
  // to zero by the caller, and a negative input here is a programming error.
  const clamped = stroops < STROOPS_ZERO ? STROOPS_ZERO : stroops;
  const whole = clamped / STROOPS_PER_XLM;
  const fraction = clamped % STROOPS_PER_XLM;

  if (fraction === STROOPS_ZERO) {
    return whole.toString();
  }

  const fractionDigits = fraction
    .toString()
    .padStart(XLM_DECIMALS, "0")
    .replace(/0+$/, "");

  return `${whole.toString()}.${fractionDigits}`;
}

function minimumBalanceStroops(subentryCount: number): bigint {
  const safeSubentryCount = Number.isFinite(subentryCount)
    ? Math.max(0, Math.trunc(subentryCount))
    : 0;

  // Two base reserves for the account itself plus one per ledger entry it owns.
  return BigInt(2 + safeSubentryCount) * STROOPS_PER_BASE_RESERVE;
}

export function computeMinimumBalanceXlm(subentryCount: number): string {
  return stroopsToXlm(minimumBalanceStroops(subentryCount));
}

export function computeSpendableXlm(
  balance: string,
  subentryCount: number,
  sellingLiabilities: string,
): string {
  const spendable =
    xlmToStroops(balance) -
    minimumBalanceStroops(subentryCount) -
    xlmToStroops(sellingLiabilities);

  return stroopsToXlm(spendable);
}
