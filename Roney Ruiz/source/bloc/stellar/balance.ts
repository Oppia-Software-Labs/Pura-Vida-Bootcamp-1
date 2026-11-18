import { NotFoundError } from "@stellar/stellar-sdk";
import { xlmToStroops } from "@bloc/entity/money";
import { horizon } from "./servers";

export async function getXlmBalance(address: string): Promise<bigint | null> {
  try {
    const account = await horizon.loadAccount(address);
    const native = account.balances.find((line) => line.asset_type === "native");
    return native ? xlmToStroops(native.balance) : 0n;
  } catch (error) {
    if (error instanceof NotFoundError) return null;
    throw new Error("Horizon request failed");
  }
}
