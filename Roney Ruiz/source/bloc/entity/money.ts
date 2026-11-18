const STROOPS_DECIMALS = 7;
const STROOPS_PER_XLM = 10n ** BigInt(STROOPS_DECIMALS);

export function xlmToStroops(xlm: string): bigint {
  if (!/^\d+(\.\d{1,7})?$/.test(xlm)) throw new Error("Invalid XLM amount");
  const [whole, fraction = ""] = xlm.split(".");
  return BigInt(whole + fraction.padEnd(STROOPS_DECIMALS, "0"));
}

export function formatStroops(stroops: bigint): string {
  const whole = stroops / STROOPS_PER_XLM;
  const fraction = (stroops % STROOPS_PER_XLM)
    .toString()
    .padStart(STROOPS_DECIMALS, "0")
    .replace(/0+$/, "");
  return fraction ? `${whole}.${fraction}` : whole.toString();
}
