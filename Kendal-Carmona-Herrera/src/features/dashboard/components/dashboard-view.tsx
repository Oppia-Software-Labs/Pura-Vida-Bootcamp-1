"use client";

import { StateMessage } from "@/components/feedback/state-message";
import { Button } from "@/components/ui/button";
import { BalanceCard } from "@/features/dashboard/components/balance-card";
import { useAccount } from "@/features/dashboard/hooks/use-account";
import { TransactionList } from "@/features/transactions/components/transaction-list";
import { useTransactions } from "@/features/transactions/hooks/use-transactions";
import {
  NetworkWarning,
  WalletHeader,
} from "@/features/wallet/components/wallet-header";
import { useWallet } from "@/features/wallet/hooks/use-wallet";

export function DashboardView() {
  const wallet = useWallet();
  const { state } = wallet;

  // A wallet on another network is blocked here, once: the hooks only read when
  // they can be sure the address belongs to Testnet.
  const address =
    state.status === "connected" && state.isTestnet ? state.address : null;

  const account = useAccount(address);
  const transactions = useTransactions(address);

  const isWrongNetwork = state.status === "connected" && !state.isTestnet;
  const isSettling = state.status === "checking" || state.status === "connecting";
  const isLoading =
    account.status === "loading" || transactions.status === "loading";

  const refreshAll = () => {
    account.refresh();
    transactions.refresh();
  };

  return (
    <>
      <WalletHeader
        state={state}
        onConnect={() => void wallet.connect()}
        onDisconnect={wallet.disconnect}
        onCopyAddress={() => void wallet.copyAddress()}
        copied={wallet.copied}
      />

      {isWrongNetwork ? <NetworkWarning /> : null}

      {address === null ? (
        isSettling ? null : (
          <StateMessage
            title={
              isWrongNetwork
                ? "Account reads are paused"
                : "Your Stellar Testnet dashboard"
            }
            description={
              isWrongNetwork
                ? "Switch your wallet to Stellar Testnet and your balance and payments will load here."
                : "Connect a Stellar wallet to see your XLM balance, spendable amount and recent payments. Everything is read-only for now."
            }
          />
        )
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold">Overview</h2>
            <Button
              variant="outline"
              size="sm"
              onClick={refreshAll}
              disabled={isLoading}
            >
              Refresh
            </Button>
          </div>

          <div className="grid gap-6 md:grid-cols-5">
            <div className="md:col-span-2">
              <BalanceCard
                address={address}
                status={account.status}
                snapshot={account.snapshot}
                error={account.error}
              />
            </div>
            <div className="md:col-span-3">
              <TransactionList
                status={transactions.status}
                items={transactions.items}
                error={transactions.error}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
