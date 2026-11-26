import { getHorizonServer } from "@/lib/stellar/client";
import { assertTestnetConfiguration } from "@/lib/stellar/config";
import {
  TRANSACTIONS_PAGE_SIZE,
  explorerTransactionUrl,
} from "@/lib/stellar/constants";
import { classifyHorizonError } from "@/lib/stellar/errors";
import type { ServiceResult } from "@/lib/stellar/errors";
import { stroopsToXlm, xlmToStroops } from "@/lib/stellar/reserves";

import type { TransactionDirection, TransactionSummary } from "../types";

type HorizonServer = ReturnType<typeof getHorizonServer>;
type PaymentsCallBuilder = ReturnType<HorizonServer["payments"]>;
type AccountPaymentsCallBuilder = ReturnType<PaymentsCallBuilder["forAccount"]>;
type PaymentsPage = Awaited<ReturnType<AccountPaymentsCallBuilder["call"]>>;
type PaymentRecord = PaymentsPage["records"][number];

/** Horizon caps a single page at 200 records. */
const MAX_PAGE_SIZE = 200;
const UNKNOWN_TYPE_LABEL = "Other";
const UNKNOWN_ASSET_LABEL = "Unknown asset";

function formatAmount(amount: string | undefined): string | null {
  if (amount === undefined) return null;

  try {
    return stroopsToXlm(xlmToStroops(amount));
  } catch {
    // A malformed amount must not hide the row; show exactly what Horizon sent.
    return amount;
  }
}

function assetLabel(assetType: string, assetCode: string | undefined): string {
  if (assetType === "native") return "XLM";
  return assetCode ?? UNKNOWN_ASSET_LABEL;
}

function directionFor(
  from: string | null,
  to: string | null,
  address: string,
): TransactionDirection {
  if (from === address && to === address) return "self";
  if (to === address) return "incoming";
  return "outgoing";
}

function counterpartyFor(
  from: string | null,
  to: string | null,
  address: string,
): string | null {
  if (to === address) return from === address ? null : from;
  if (from === address) return to;
  return null;
}

function buildSummary(
  record: PaymentRecord,
  typeLabel: string,
  direction: TransactionDirection,
  counterparty: string | null,
  amount: string | null,
  asset: string,
): TransactionSummary {
  return {
    id: record.id,
    hash: record.transaction_hash,
    type: record.type,
    typeLabel,
    direction,
    counterparty,
    amount,
    asset,
    createdAt: record.created_at,
    successful: record.transaction_successful,
    explorerUrl: explorerTransactionUrl(record.transaction_hash),
  };
}

function toTransactionSummary(
  record: PaymentRecord,
  address: string,
): TransactionSummary {
  switch (record.type) {
    case "payment":
      return buildSummary(
        record,
        "Payment",
        directionFor(record.from, record.to, address),
        counterpartyFor(record.from, record.to, address),
        formatAmount(record.amount),
        assetLabel(record.asset_type, record.asset_code),
      );

    case "create_account":
      return buildSummary(
        record,
        "Create Account",
        directionFor(record.funder, record.account, address),
        counterpartyFor(record.funder, record.account, address),
        formatAmount(record.starting_balance),
        "XLM",
      );

    case "account_merge":
      return buildSummary(
        record,
        "Account Merge",
        directionFor(record.source_account, record.into, address),
        counterpartyFor(record.source_account, record.into, address),
        null,
        "XLM",
      );

    case "path_payment_strict_receive":
    case "path_payment_strict_send":
      return buildSummary(
        record,
        "Path Payment",
        directionFor(record.from, record.to, address),
        counterpartyFor(record.from, record.to, address),
        formatAmount(record.amount),
        assetLabel(record.asset_type, record.asset_code),
      );

    default:
      // Other operation types (for example a Soroban invocation) carry neither an
      // amount nor a counterparty; list the row instead of dropping it silently.
      return buildSummary(
        record,
        UNKNOWN_TYPE_LABEL,
        record.source_account === address ? "outgoing" : "incoming",
        null,
        null,
        "XLM",
      );
  }
}

/**
 * Recent payments touching the account. `null` means unfunded; `[]` means funded
 * with no history. The two must never collapse into one another.
 *
 * `payments()` is used instead of `transactions()` on purpose: one request already
 * carries direction, amount and counterparty, while transaction records would need
 * an extra operations request per row.
 */
export async function loadRecentTransactions(
  address: string,
  limit: number = TRANSACTIONS_PAGE_SIZE,
): Promise<ServiceResult<TransactionSummary[] | null>> {
  try {
    assertTestnetConfiguration();

    const pageSize = Number.isFinite(limit)
      ? Math.min(MAX_PAGE_SIZE, Math.max(1, Math.trunc(limit)))
      : TRANSACTIONS_PAGE_SIZE;

    const page = await getHorizonServer()
      .payments()
      .forAccount(address)
      .order("desc")
      .limit(pageSize)
      .call();

    return {
      ok: true,
      data: page.records.map((record) => toTransactionSummary(record, address)),
    };
  } catch (error) {
    const classified = classifyHorizonError(error);

    if (classified.reason === "not_found") {
      return { ok: true, data: null };
    }

    return { ok: false, error: classified };
  }
}
