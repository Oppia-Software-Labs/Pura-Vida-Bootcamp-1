"use client";

import type { ReactNode } from "react";

import { StateMessage } from "@/components/feedback/state-message";
import { buttonVariants } from "@/components/ui/button";
import { FRIENDBOT_URL } from "@/lib/stellar/constants";
import type { StellarServiceError } from "@/lib/stellar/errors";

import type { AccountSnapshot, AccountStatus } from "../types";

const SURFACE =
  "rounded-xl border border-border bg-card text-card-foreground p-5";

export interface BalanceCardProps {
  address: string;
  status: AccountStatus;
  snapshot: AccountSnapshot | null;
  error: StellarServiceError | null;
}

function FundedBalance({ snapshot }: { snapshot: AccountSnapshot }) {
  return (
    <div>
      <p className="text-3xl font-semibold tracking-tight tabular-nums">
        {snapshot.balanceXlm}{" "}
        <span className="text-base font-normal text-muted-foreground">XLM</span>
      </p>
      <div className="mt-4 space-y-1 text-sm">
        <p>
          <span className="text-muted-foreground">Spendable</span>{" "}
          <span className="tabular-nums">{snapshot.spendableXlm} XLM</span>
        </p>
        <p>
          <span className="text-muted-foreground">Minimum reserve</span>{" "}
          <span className="tabular-nums">{snapshot.minimumBalanceXlm} XLM</span>
        </p>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        The minimum reserve stays locked in the account and cannot be spent.
      </p>
    </div>
  );
}

export function BalanceCard({
  address,
  status,
  snapshot,
  error,
}: BalanceCardProps) {
  let body: ReactNode;

  if (status === "unfunded") {
    body = (
      <StateMessage
        title="Account not funded"
        description="This address has no XLM on Stellar Testnet yet."
      >
        <a
          href={`${FRIENDBOT_URL}?addr=${encodeURIComponent(address)}`}
          className={buttonVariants({ variant: "outline", size: "sm" })}
          target="_blank"
          rel="noreferrer"
        >
          Fund with Friendbot
        </a>
      </StateMessage>
    );
  } else if (status === "error") {
    body = (
      <StateMessage
        tone="error"
        title="Could not load the balance"
        description={error?.message ?? "The balance request failed."}
      />
    );
  } else if (status === "funded" && snapshot !== null) {
    body = <FundedBalance snapshot={snapshot} />;
  } else {
    body = <StateMessage title="Loading balance…" />;
  }

  return (
    <section className={SURFACE}>
      <h2 className="text-sm font-medium text-muted-foreground">Balance</h2>
      <div className="mt-3">{body}</div>
    </section>
  );
}
