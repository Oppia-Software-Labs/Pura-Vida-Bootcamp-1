"use client";

import type { ReactNode } from "react";

import { StateMessage } from "@/components/feedback/state-message";
import { formatDateTime, shortenAddress } from "@/lib/format";
import type { StellarServiceError } from "@/lib/stellar/errors";

import type { TransactionsStatus } from "../hooks/use-transactions";
import type { TransactionDirection, TransactionSummary } from "../types";

const SURFACE =
  "rounded-xl border border-border bg-card text-card-foreground p-5";

const DIRECTION_LABEL: Record<TransactionDirection, string> = {
  incoming: "In",
  outgoing: "Out",
  self: "Self",
};

export interface TransactionListProps {
  status: TransactionsStatus;
  items: TransactionSummary[];
  error: StellarServiceError | null;
}

function TransactionRow({ item }: { item: TransactionSummary }) {
  const counterparty =
    item.counterparty === null ? "—" : shortenAddress(item.counterparty);

  return (
    <li>
      <a
        href={item.explorerUrl}
        target="_blank"
        rel="noreferrer"
        className="flex flex-wrap items-center justify-between gap-2 rounded-lg px-2 py-2 hover:bg-muted"
      >
        <span className="flex min-w-0 flex-col">
          <span className="text-sm font-medium">
            {item.typeLabel}{" "}
            <span className="text-muted-foreground">
              · {DIRECTION_LABEL[item.direction]}
            </span>
            {item.successful ? null : (
              <span className="ml-1 text-xs text-destructive">Failed</span>
            )}
          </span>
          <span className="text-xs text-muted-foreground">
            {formatDateTime(item.createdAt)} · {counterparty}
          </span>
        </span>
        <span className="text-sm font-medium tabular-nums">
          {item.amount ?? "—"}{" "}
          <span className="font-normal text-muted-foreground">
            {item.asset}
          </span>
        </span>
      </a>
    </li>
  );
}

export function TransactionList({
  status,
  items,
  error,
}: TransactionListProps) {
  let body: ReactNode;

  if (status === "loading") {
    body = <StateMessage title="Loading transactions…" />;
  } else if (status === "error") {
    body = (
      <StateMessage
        tone="error"
        title="Could not load transactions"
        description={error?.message ?? "The transaction request failed."}
      />
    );
  } else if (status === "unfunded") {
    body = (
      <StateMessage
        title="Account not funded"
        description="Payments appear here once the account is funded on Testnet."
      />
    );
  } else if (items.length === 0) {
    body = <StateMessage title="No transactions yet" />;
  } else {
    body = (
      <ul className="-mx-2 divide-y divide-border">
        {items.map((item) => (
          <TransactionRow key={item.id} item={item} />
        ))}
      </ul>
    );
  }

  return (
    <section className={SURFACE}>
      <h2 className="text-sm font-medium text-muted-foreground">
        Recent transactions
      </h2>
      <div className="mt-3">{body}</div>
    </section>
  );
}
