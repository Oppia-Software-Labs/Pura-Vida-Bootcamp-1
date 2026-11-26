"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useWalletContext } from "@/contexts/WalletContext";
import Navbar from "@/components/landing/Navbar";
import Hero from "@/components/landing/Hero";
import Footer from "@/components/landing/Footer";
import WalletModal from "@/components/WalletModal";

export default function LandingShell({ children }: { children: ReactNode }) {
  const [modalOpen, setModalOpen] = useState(false);
  const router = useRouter();
  const { truncatedKey, isConnecting, isConnected, error, availableWallets, connect } = useWalletContext();

  // Already connected (or just connected) → go to the dashboard
  useEffect(() => {
    if (isConnected) {
      setModalOpen(false);
      router.push("/app");
    }
  }, [isConnected, router]);

  async function handleConnect(walletId: string) {
    try {
      await connect(walletId);
    } catch {
      // error is shown in the modal
    }
  }

  return (
    <div className="min-h-screen bg-bg text-white">
      <Navbar
        onConnect={() => setModalOpen(true)}
        isConnected={isConnected}
        truncatedKey={truncatedKey}
        isConnecting={!!isConnecting}
      />

      <main>
        <Hero onGetStarted={() => setModalOpen(true)} />
        {children}
      </main>

      <Footer />

      {modalOpen && (
        <WalletModal
          onConnect={handleConnect}
          onClose={() => setModalOpen(false)}
          isConnecting={isConnecting}
          error={error}
          availableWallets={availableWallets}
        />
      )}
    </div>
  );
}
