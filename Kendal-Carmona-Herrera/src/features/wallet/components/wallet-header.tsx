"use client";

import type { ReactNode } from "react";

import { Button, buttonVariants } from "@/components/ui/button";
import { shortenAddress } from "@/lib/format";

import type { WalletState } from "../types";

const SURFACE =
  "rounded-xl border border-border bg-card text-card-foreground p-5";
const WALLET_INSTALL_URL = "https://www.varialwallet.com";

export interface WalletHeaderProps {
  state: WalletState;
  onConnect: () => void;
  onDisconnect: () => void;
  onCopyAddress: () => void;
  copied: boolean;
}

function noticeFor(state: WalletState): ReactNode {
  if (state.status === "failed") {
    return (
      <p className="mt-3 text-sm text-destructive">{state.error.message}</p>
    );
  }

  if (state.status === "disconnected" && state.error !== undefined) {
    if (state.error.code === "rejected") {
      return (
        <p className="mt-3 text-sm text-muted-foreground">
          You declined the connection request.
        </p>
      );
    }

    return (
      <p className="mt-3 text-sm text-destructive">{state.error.message}</p>
    );
  }

  return null;
}

export function WalletHeader({
  state,
  onConnect,
  onDisconnect,
  onCopyAddress,
  copied,
}: WalletHeaderProps) {
  let controls: ReactNode;
  let notice: ReactNode = null;

  if (state.status === "checking") {
    controls = (
      <p className="text-sm text-muted-foreground">Checking wallet…</p>
    );
  } else if (state.status === "connecting") {
    controls = (
      <Button variant="outline" size="sm" disabled>
        Connecting…
      </Button>
    );
  } else if (state.status === "connected") {
    controls = (
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-mono text-sm" title={state.address}>
          {shortenAddress(state.address)}
        </span>
        <Button variant="outline" size="sm" onClick={onCopyAddress}>
          {copied ? "Copied" : "Copy"}
        </Button>
        <Button variant="ghost" size="sm" onClick={onDisconnect}>
          Disconnect
        </Button>
      </div>
    );
  } else if (
    state.status === "disconnected" &&
    state.error?.code === "not_installed"
  ) {
    // Retrying cannot fix a missing extension: send the user to install it.
    controls = (
      <a
        href={WALLET_INSTALL_URL}
        className={buttonVariants({ variant: "outline", size: "sm" })}
        target="_blank"
        rel="noreferrer"
      >
        Install Varial Wallet
      </a>
    );
    notice = (
      <p className="mt-3 text-sm text-muted-foreground">
        No Stellar wallet extension was detected. Install Varial Wallet, then
        connect it to Stellar Testnet.
      </p>
    );
  } else {
    controls = (
      <Button size="sm" onClick={onConnect}>
        Connect Wallet
      </Button>
    );
    notice = noticeFor(state);
  }

  return (
    <header className={SURFACE}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-lg font-semibold tracking-tight">
            StellarView
          </span>
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
            Testnet
          </span>
        </div>
        {controls}
      </div>
      {notice}
    </header>
  );
}

/**
 * Lives in this file next to the wallet status it describes, and is rendered by
 * the dashboard right under the header so it reads as one block.
 */
export function NetworkWarning() {
  return (
    <div
      role="alert"
      className="rounded-xl border-2 border-destructive bg-card p-4 text-destructive"
    >
      <p className="text-sm font-semibold">Wrong network</p>
      <p className="mt-1 text-sm">
        Your wallet is connected to another network. Switch it to Stellar
        Testnet to load your account.
      </p>
    </div>
  );
}
