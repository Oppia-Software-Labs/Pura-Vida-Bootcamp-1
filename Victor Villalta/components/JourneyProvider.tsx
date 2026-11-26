"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { advanceProgress, isLevel, type Level, type Progress } from "@/lib/journey";
import { connectWallet, readWallet, type Wallet } from "@/lib/stellar/wallet";
import { errorMessage } from "@/lib/stellar/errors";

const PROGRESS_KEY = "baula-progress-v1";
const WALLET_KEY = "baula-wallet-v1";

function stored(key: string, value?: string | null) {
  try {
    if (value === undefined) return localStorage.getItem(key);
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    // La sesión sigue funcionando si el navegador restringe localStorage.
  }
  return null;
}

type JourneyContextValue = {
  ready: boolean;
  progress: Progress;
  complete: (level: Level) => void;
  wallet: Wallet | null;
  walletBusy: boolean;
  walletError: string | null;
  connect: () => Promise<void>;
  disconnect: () => void;
};

const JourneyContext = createContext<JourneyContextValue | null>(null);

export function JourneyProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState<Progress>(0);
  const [ready, setReady] = useState(false);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [walletBusy, setWalletBusy] = useState(false);
  const [walletError, setWalletError] = useState<string | null>(null);
  const [monitor, setMonitor] = useState(false);
  const activeRequest = useRef(0);
  const connecting = useRef(false);

  useEffect(() => {
    const saved = Number(stored(PROGRESS_KEY));
    if (isLevel(saved)) setProgress(saved);
    setMonitor(stored(WALLET_KEY) === "connected");
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) stored(PROGRESS_KEY, String(progress));
  }, [progress, ready]);

  useEffect(() => {
    if (!monitor) return;

    let cancelled = false;
    let reading = false;

    async function refresh() {
      if (reading || connecting.current || document.visibilityState === "hidden") return;
      reading = true;
      try {
        const current = await readWallet();
        if (!cancelled) {
          setWallet((previous) => previous?.address === current.address && previous.testnet === current.testnet ? previous : current);
          setWalletError(null);
        }
      } catch (error) {
        if (!cancelled) {
          setWallet(null);
          setWalletError(errorMessage(error));
        }
      } finally {
        reading = false;
      }
    }

    void refresh();
    const interval = window.setInterval(refresh, 2000);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [monitor]);

  useEffect(() => {
    if (wallet?.testnet) setProgress((value) => advanceProgress(value, 2));
  }, [wallet]);

  const complete = useCallback((level: Level) => {
    setProgress((value) => advanceProgress(value, level));
  }, []);

  const connect = useCallback(async () => {
    if (connecting.current) return;
    connecting.current = true;
    const request = ++activeRequest.current;
    setWalletBusy(true);
    setWalletError(null);
    try {
      const current = await connectWallet();
      if (request !== activeRequest.current) return;
      setWallet(current);
      setMonitor(true);
      stored(WALLET_KEY, "connected");
    } catch (error) {
      if (request === activeRequest.current) setWalletError(errorMessage(error));
    } finally {
      connecting.current = false;
      setWalletBusy(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    activeRequest.current++;
    setMonitor(false);
    setWallet(null);
    setWalletError(null);
    stored(WALLET_KEY, null);
  }, []);

  return (
    <JourneyContext.Provider value={{ ready, progress, complete, wallet, walletBusy, walletError, connect, disconnect }}>
      {children}
    </JourneyContext.Provider>
  );
}

export function useJourney() {
  const value = useContext(JourneyContext);
  if (!value) throw new Error("JourneyProvider no está activo");
  return value;
}
