import { AlertCircle, CircleCheck, ExternalLink, LoaderCircle, WalletCards } from "lucide-react";
import { Button } from "./ui/button";
import { truncateAddress } from "../lib/stellar";
import type { Translation } from "../lib/i18n";
import type { WalletState } from "../hooks/use-wallet";

interface WalletBannerProps {
  copy: Translation;
  state: WalletState;
  onConnect: () => Promise<void>;
  onFund: () => Promise<void>;
  onDisconnect: () => Promise<void>;
}

export function WalletBanner({ copy, state, onConnect, onFund, onDisconnect }: WalletBannerProps) {
  if (state.status === "idle") return null;

  if (state.status === "connecting") {
    return (
      <div className="border-b border-border bg-surface" role="status" aria-live="polite">
        <div className="mx-auto flex min-h-14 max-w-7xl items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <LoaderCircle aria-hidden="true" className="size-5 animate-spin text-primary" />
          <p className="text-sm font-medium">{copy.walletConnecting}</p>
        </div>
      </div>
    );
  }

  if (state.status === "wrong-network" || (state.status === "error" && !state.connection)) {
    const isWrongNetwork = state.status === "wrong-network";
    return (
      <div className="border-b border-warning-border bg-warning-soft" role="alert">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <div className="flex items-start gap-3">
            <AlertCircle aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-warning-ink" />
            <div>
              <p className="text-sm font-semibold text-warning-ink">
                {isWrongNetwork ? copy.wrongNetworkTitle : copy.walletErrorTitle}
              </p>
              <p className="mt-0.5 text-sm text-warning-copy">
                {isWrongNetwork ? copy.wrongNetworkBody : copy.walletErrorBody}
              </p>
            </div>
          </div>
          <Button variant="secondary" size="sm" onClick={() => void onConnect()}>
            {copy.retryWallet}
          </Button>
        </div>
      </div>
    );
  }

  const accountExists = state.account?.exists ?? false;
  const balance = state.account?.xlmBalance
    ? Number.parseFloat(state.account.xlmBalance).toLocaleString(undefined, {
        maximumFractionDigits: 2,
      })
    : null;

  return (
    <div
      className={accountExists ? "border-b border-border bg-surface" : "border-b border-warning-border bg-warning-soft"}
      role="status"
      aria-live="polite"
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-start gap-3">
          {accountExists ? (
            <CircleCheck aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-primary" />
          ) : (
            <AlertCircle aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-warning-ink" />
          )}
          <div className="min-w-0">
            <p className="text-sm font-semibold">
              {accountExists ? copy.walletReady : copy.accountUnfunded}
            </p>
            <p className="mt-0.5 truncate font-mono text-xs text-muted-foreground" title={state.connection?.address}>
              {state.connection ? truncateAddress(state.connection.address, 8) : ""}
              {balance ? ` · ${balance} XLM` : ""}
            </p>
            {state.errorMessage ? (
              <p className="mt-1 text-xs text-warning-copy">{state.errorMessage}</p>
            ) : null}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 pl-8 sm:pl-0">
          {!accountExists ? (
            <Button size="sm" onClick={() => void onFund()} disabled={state.status === "funding"}>
              {state.status === "funding" ? (
                <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
              ) : (
                <WalletCards aria-hidden="true" className="size-4" />
              )}
              {state.status === "funding" ? copy.fundingAccount : copy.fundWithFriendbot}
            </Button>
          ) : (
            <a
              href={`https://stellar.expert/explorer/testnet/account/${state.connection?.address}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-9 items-center gap-1.5 rounded-[10px] px-3 text-xs font-semibold text-primary-ink hover:bg-primary-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              {copy.viewExplorer}
              <ExternalLink aria-hidden="true" className="size-3.5" />
            </a>
          )}
          <Button variant="ghost" size="sm" onClick={() => void onDisconnect()}>
            {copy.disconnectWallet}
          </Button>
        </div>
      </div>
    </div>
  );
}
