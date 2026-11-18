import { getHorizonServer } from "@/lib/stellar/client";
import { assertTestnetConfiguration } from "@/lib/stellar/config";
import { classifyHorizonError } from "@/lib/stellar/errors";
import type { ServiceResult } from "@/lib/stellar/errors";
import {
  computeMinimumBalanceXlm,
  computeSpendableXlm,
  stroopsToXlm,
  xlmToStroops,
} from "@/lib/stellar/reserves";

import type { AccountSnapshot } from "../types";

const MISSING_NATIVE_BALANCE =
  "Horizon returned an account without a native XLM balance.";

/**
 * Loads the account's XLM position. `null` means "not funded on Testnet yet",
 * which is a state the dashboard renders, not an error.
 */
export async function loadAccountSnapshot(
  address: string,
): Promise<ServiceResult<AccountSnapshot | null>> {
  try {
    assertTestnetConfiguration();

    const account = await getHorizonServer().loadAccount(address);
    const nativeBalance = account.balances.find(
      (line) => line.asset_type === "native",
    );

    if (nativeBalance === undefined) {
      return {
        ok: false,
        error: { reason: "unknown", message: MISSING_NATIVE_BALANCE },
      };
    }

    return {
      ok: true,
      data: {
        address: account.account_id,
        balanceXlm: stroopsToXlm(xlmToStroops(nativeBalance.balance)),
        minimumBalanceXlm: computeMinimumBalanceXlm(account.subentry_count),
        spendableXlm: computeSpendableXlm(
          nativeBalance.balance,
          account.subentry_count,
          nativeBalance.selling_liabilities,
        ),
        subentryCount: account.subentry_count,
        sequence: account.sequence,
        sellingLiabilitiesXlm: stroopsToXlm(
          xlmToStroops(nativeBalance.selling_liabilities),
        ),
      },
    };
  } catch (error) {
    const classified = classifyHorizonError(error);

    // Horizon answers 404 for an address that was never funded: a normal state.
    if (classified.reason === "not_found") {
      return { ok: true, data: null };
    }

    return { ok: false, error: classified };
  }
}
