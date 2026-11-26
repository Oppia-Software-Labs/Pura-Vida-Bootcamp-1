"use client";

import { useState, useCallback, useEffect } from "react";
import { NETWORK_PASSPHRASE } from "@/constants/stellar";
import { getWalletKit, type ISupportedWallet } from "@/lib/walletKit";

const STORAGE_KEY = "koired_wallet";

interface StoredSession {
  wId: string;
  addr: string;
}

function readSession(): StoredSession | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return null;
    const parsed = JSON.parse(saved) as Partial<StoredSession>;
    return parsed.wId && parsed.addr ? { wId: parsed.wId, addr: parsed.addr } : null;
  } catch {
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
    return null;
  }
}

export interface WalletState {
  publicKey: string | null;
  truncatedKey: string | null;
  walletId: string | null;
  /** Id of the wallet currently being connected, if any */
  isConnecting: string | null;
  isConnected: boolean;
  /** False until the saved session has been read from localStorage (client only) */
  ready: boolean;
  error: string | null;
  availableWallets: ISupportedWallet[];
  connect: (walletId: string) => Promise<string>;
  disconnect: () => void;
  signXDR: (xdr: string) => Promise<string>;
}

export function useWallet(): WalletState {
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [walletId, setWalletId] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableWallets, setAvailableWallets] = useState<ISupportedWallet[]>([]);

  // Restore the saved session on the client, then load the wallet kit.
  useEffect(() => {
    const session = readSession();
    if (session) {
      setPublicKey(session.addr);
      setWalletId(session.wId);
    }
    setReady(true);

    getWalletKit()
      .then(async (kit) => {
        if (session) kit.setWallet(session.wId);
        setAvailableWallets(await kit.refreshSupportedWallets());
      })
      .catch(() => {});
  }, []);

  const connect = useCallback(async (wId: string) => {
    setError(null);
    setIsConnecting(wId);
    try {
      const kit = await getWalletKit();
      kit.setWallet(wId);
      const { address } = await kit.fetchAddress();
      setPublicKey(address);
      setWalletId(wId);
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ wId, addr: address })); } catch {}
      return address;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al conectar la wallet");
      throw err;
    } finally {
      setIsConnecting(null);
    }
  }, []);

  const disconnect = useCallback(() => {
    getWalletKit().then((kit) => kit.disconnect()).catch(() => {});
    setPublicKey(null);
    setWalletId(null);
    setError(null);
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
  }, []);

  const signXDR = useCallback(async (xdr: string) => {
    const kit = await getWalletKit();
    const { signedTxXdr } = await kit.signTransaction(xdr, { networkPassphrase: NETWORK_PASSPHRASE });
    return signedTxXdr;
  }, []);

  return {
    publicKey,
    truncatedKey: publicKey ? `${publicKey.slice(0, 6)}...${publicKey.slice(-4)}` : null,
    walletId,
    isConnecting,
    isConnected: !!publicKey,
    ready,
    error,
    availableWallets,
    connect,
    disconnect,
    signXDR,
  };
}
