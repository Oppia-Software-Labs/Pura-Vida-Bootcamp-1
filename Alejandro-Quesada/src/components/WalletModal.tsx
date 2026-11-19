"use client";

import { useEffect } from "react";
import type { ISupportedWallet } from "@/lib/walletKit";

interface WalletOption {
  id: string;
  name: string;
  desc: string;
  icon: string;
  installUrl: string;
  needsExtension: boolean;
}

const WALLETS: WalletOption[] = [
  {
    id: "varial",
    name: "Freighter",
    desc: "Extensión de navegador",
    icon: "https://stellar.creit.tech/wallet-icons/varial.png",
    installUrl: "https://freighter.app",
    needsExtension: true,
  },
  {
    id: "albedo",
    name: "Albedo",
    desc: "Web · Sin instalación",
    icon: "https://stellar.creit.tech/wallet-icons/albedo.png",
    installUrl: "https://albedo.link",
    needsExtension: false,
  },
  {
    id: "xbull",
    name: "xBull",
    desc: "Extensión de navegador",
    icon: "https://stellar.creit.tech/wallet-icons/xbull.png",
    installUrl: "https://xbull.app",
    needsExtension: true,
  },
  {
    id: "lobstr",
    name: "LOBSTR",
    desc: "Extensión de navegador",
    icon: "https://stellar.creit.tech/wallet-icons/lobstr.png",
    installUrl: "https://lobstr.co",
    needsExtension: true,
  },
];

interface WalletRowProps {
  wallet: WalletOption;
  available: boolean | undefined;
  onClick: (walletId: string) => void;
  cargando: boolean;
}

function WalletRow({ wallet, available, onClick, cargando }: WalletRowProps) {
  const unavailable = wallet.needsExtension && available !== undefined && !available;

  return (
    <button
      onClick={() => !cargando && !unavailable && onClick(wallet.id)}
      disabled={cargando || unavailable}
      className={`flex items-center w-full rounded-xl px-4 py-3.5 border transition-all group text-left
        ${unavailable
          ? "bg-[#111] border-border opacity-40 cursor-not-allowed"
          : "bg-[#1a1a1a] border-border hover:border-accent/40 hover:bg-[#222] cursor-pointer"
        }`}
    >
      <img
        src={wallet.icon}
        alt={wallet.name}
        className="w-9 h-9 rounded-xl flex-shrink-0 object-contain bg-white/5 p-0.5"
        onError={(e) => { e.currentTarget.style.display = "none"; }}
      />

      <div className="ml-3 flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-white text-sm font-semibold">{wallet.name}</span>
          {!wallet.needsExtension && (
            <span className="text-[10px] font-medium bg-accent/15 text-accent px-1.5 py-0.5 rounded-full leading-none">
              Recomendado
            </span>
          )}
        </div>
        <p className="text-muted text-xs mt-0.5">{wallet.desc}</p>
      </div>

      <div className="flex-shrink-0 ml-3">
        {cargando ? (
          <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        ) : unavailable ? (
          <a
            href={wallet.installUrl}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-accent text-xs hover:underline pointer-events-auto"
          >
            Instalar →
          </a>
        ) : (
          <svg
            className="w-4 h-4 text-muted group-hover:text-white transition-colors"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        )}
      </div>
    </button>
  );
}

interface WalletModalProps {
  onConnect: (walletId: string) => void;
  onClose: () => void;
  isConnecting: string | null;
  error: string | null;
  availableWallets?: ISupportedWallet[];
}

export default function WalletModal({ onConnect, onClose, isConnecting, error, availableWallets = [] }: WalletModalProps) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  function isAvailable(walletId: string): boolean | undefined {
    if (availableWallets.length === 0) return undefined;
    return availableWallets.find((w) => w.id === walletId)?.isAvailable;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div
        className="relative bg-[#161616] border border-border rounded-2xl p-6 max-w-sm w-full shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted hover:text-white transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="mb-5">
          <h3 className="text-white text-lg font-bold">Conectar Wallet</h3>
          <p className="text-muted text-sm mt-1">
            Elige tu wallet de Stellar · Testnet
          </p>
        </div>

        <div className="flex flex-col gap-2">
          {WALLETS.map((wallet) => (
            <WalletRow
              key={wallet.id}
              wallet={wallet}
              available={isAvailable(wallet.id)}
              onClick={onConnect}
              cargando={isConnecting === wallet.id}
            />
          ))}
        </div>

        {error && (
          <div className="mt-4 bg-red-500/10 border border-red-500/20 rounded-xl p-3">
            <p className="text-red-400 text-xs">{error}</p>
          </div>
        )}

        <p className="text-muted/60 text-xs text-center mt-5">
          Sin fondos reales · Solo Stellar Testnet
        </p>
      </div>
    </div>
  );
}
