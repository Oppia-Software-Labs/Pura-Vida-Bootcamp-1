import { useCallback, useState } from "react";
import { useWallet } from "@hooks/useWallet";
import { readSharedDepositId } from "@bloc/storage/deposits";
import ConnectWallet from "@shared/ConnectWallet";
import CreateDeposit from "@shared/CreateDeposit";
import HowItWorks from "@shared/HowItWorks";
import MyDeposits from "@shared/MyDeposits";

export default function App() {
  const wallet = useWallet();
  const [refreshKey, setRefreshKey] = useState(0);
  const refresh = useCallback(() => setRefreshKey((key) => key + 1), []);
  const [hasSharedLink] = useState(() => readSharedDepositId() !== null);

  const deposits = wallet.address && <MyDeposits address={wallet.address} refreshKey={refreshKey} onChanged={refresh} />;
  const create = wallet.address && <CreateDeposit address={wallet.address} refreshKey={refreshKey} onCreated={refresh} />;

  return (
    <div className="mx-auto flex min-h-dvh max-w-2xl flex-col gap-8 px-4 py-8 sm:py-12">
      <header className="flex items-center gap-3">
        <img src="/favicon.svg" alt="" className="size-10" />
        <div>
          <h1 className="text-xl font-semibold tracking-tight">Plazo</h1>
          <p className="text-sm text-muted">Depósito de garantía sin custodio</p>
        </div>
      </header>
      <main className="flex flex-col gap-8">
        {hasSharedLink && !wallet.address && (
          <p className="rounded-xl border border-accent/30 bg-accent/10 px-4 py-3 text-sm text-accent-strong">
            Abriste el link de un depósito. Conecta tu wallet para verlo y reclamarlo.
          </p>
        )}
        <ConnectWallet wallet={wallet} refreshKey={refreshKey} />
        {wallet.address ? hasSharedLink ? <>{deposits}{create}</> : <>{create}{deposits}</> : <HowItWorks />}
      </main>
      <footer className="mt-auto pt-4 text-center text-xs text-faint">
        Solo testnet. Ejercicio de práctica, sin validez legal.
      </footer>
    </div>
  );
}
