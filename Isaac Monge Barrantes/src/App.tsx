import { useWallet } from "./hooks/useWallet";
import { WalletSection } from "./components/WalletSection";
import { BalanceSection } from "./components/BalanceSection";
import { useAccount } from "./hooks/useAccount";
import { TipSection } from "./components/TipSection";
import { HistorySection } from "./components/HistorySection";
import { useState } from "react";

export default function App() {
  const wallet = useWallet();
  const account = useAccount(wallet.address);
  const [refreshKey, setRefreshKey] = useState(0);
  const refreshAll = () => { account.refresh(); setRefreshKey((k) => k + 1); };

  return (
    <main className="container">
      <header className="hero">
        <h1>🌴 Propina Pura Vida</h1>
        <p>Envía propinas en XLM a tus creadores, meseros o amigos favoritos, sobre Stellar Testnet.</p>
      </header>

      <WalletSection
        address={wallet.address}
        wrongNetwork={wallet.wrongNetwork}
        connecting={wallet.connecting}
        error={wallet.error}
        onConnect={wallet.connect}
        onDisconnect={wallet.disconnect}
      />

      {wallet.address && (
        <BalanceSection
          state={account.state}
          funding={account.funding}
          onFund={account.fund}
          onRefresh={refreshAll}
        />
      )}

      {wallet.address && (
        <TipSection
          address={wallet.address}
          disabled={wallet.wrongNetwork || account.state.status !== "ready"}
          sign={wallet.sign}
          onSent={refreshAll}
        />
      )}

      {wallet.address && account.state.status === "ready" && (
        <HistorySection address={wallet.address} refreshKey={refreshKey} />
      )}

      <footer className="muted small">
        Hecho por Isaac Monge Barrantes · Pura Vida Bootcamp · construido con ayuda de Stellar Raven. Solo Testnet: el XLM no tiene valor real.
      </footer>
    </main>
  );
}
