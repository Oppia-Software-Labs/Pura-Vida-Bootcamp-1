import { useWallet } from "@hooks/useWallet";
import ConnectWallet from "@shared/ConnectWallet";
import CreateDeposit from "@shared/CreateDeposit";
import HowItWorks from "@shared/HowItWorks";

export default function App() {
  const wallet = useWallet();

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
        <ConnectWallet wallet={wallet} />
        {wallet.address ? <CreateDeposit address={wallet.address} /> : <HowItWorks />}
      </main>
      <footer className="mt-auto pt-4 text-center text-xs text-faint">
        Solo testnet. Ejercicio de práctica, sin validez legal.
      </footer>
    </div>
  );
}
