import { useState, useEffect } from "react";
import { HashRouter, Routes, Route, useNavigate } from "react-router-dom";
import { WalletProvider, useWalletContext } from "./contexts/WalletContext.jsx";
import Navbar from "./components/Navbar.jsx";
import WalletModal from "./components/WalletModal.jsx";
import Footer from "./components/Footer.jsx";
import Landing from "./pages/Landing.jsx";
import AppPage from "./pages/AppPage.jsx";

function LandingRoute() {
  const [modalOpen, setModalOpen] = useState(false);
  const navigate = useNavigate();

  const {
    truncatedKey,
    walletType,
    isConnecting,
    isConnected,
    error: walletError,
    availableWallets,
    connect,
  } = useWalletContext();

  useEffect(() => {
    if (isConnected) {
      setModalOpen(false);
      navigate("/app");
    }
  }, [isConnected, navigate]);

  async function handleConnect(type) {
    try {
      await connect(type);
    } catch {
      // error shown in modal
    }
  }

  return (
    <div className="min-h-screen bg-bg text-white">
      <Navbar
        onConnect={() => setModalOpen(true)}
        isConnected={isConnected}
        truncatedKey={truncatedKey}
        walletType={walletType}
        isConnecting={!!isConnecting}
      />

      <main>
        <Landing onGetStarted={() => setModalOpen(true)} />
      </main>

      <Footer />

      {modalOpen && (
        <WalletModal
          onConnect={handleConnect}
          onClose={() => setModalOpen(false)}
          isConnecting={isConnecting}
          error={walletError}
          availableWallets={availableWallets}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <WalletProvider>
      <HashRouter>
        <Routes>
          <Route path="/" element={<LandingRoute />} />
          <Route path="/app" element={<AppPage />} />
        </Routes>
      </HashRouter>
    </WalletProvider>
  );
}
