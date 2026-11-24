import { useEffect } from "react";
import { Route, Routes } from "react-router-dom";
import Starfield from "./components/Starfield";
import WalletBar from "./components/WalletBar";
import { useCharges } from "./lib/storage";
import { stopAllWatchers, syncWatchers } from "./lib/watcher";
import ChargePage from "./pages/ChargePage";
import Home from "./pages/Home";
import PayPage from "./pages/PayPage";

export default function App() {
  const charges = useCharges();

  // Un stream de Horizon por cada cuenta con cobros pendientes: detecta pagos por monto + memo.
  const pendingKey = [...new Set(charges.filter((c) => c.status === "pending").map((c) => c.to))].sort().join(",");
  useEffect(() => {
    syncWatchers(pendingKey ? pendingKey.split(",") : []);
  }, [pendingKey]);
  useEffect(() => stopAllWatchers, []);

  return (
    <>
      <div className="sky-glow" aria-hidden />
      <Starfield />
      <div className="relative z-10 flex min-h-dvh flex-col">
        <WalletBar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/cobro/:id" element={<ChargePage />} />
            <Route path="/pagar" element={<PayPage />} />
            <Route path="*" element={<Home />} />
          </Routes>
        </main>
        <footer className="mx-auto w-full max-w-4xl px-4 pb-8 text-xs text-muted">
          Stellar Testnet. Esta app nunca pide ni guarda tus llaves privadas.
        </footer>
      </div>
    </>
  );
}
