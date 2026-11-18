import { formatStroops } from "@bloc/entity/money";

export function formatXlm(stroops: bigint): string {
  const [whole, fraction] = formatStroops(stroops).split(".");
  const grouped = BigInt(whole).toLocaleString("en-US");
  return fraction ? `${grouped}.${fraction}` : grouped;
}

export function shortAddress(address: string): string {
  return address.length > 13 ? `${address.slice(0, 6)}…${address.slice(-6)}` : address;
}

export function formatEpoch(epochSec: number): string {
  return new Date(epochSec * 1000).toLocaleString("es", { dateStyle: "short", timeStyle: "short" });
}
