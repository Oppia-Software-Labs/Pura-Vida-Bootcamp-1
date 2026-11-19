import { useState, useCallback, useEffect } from "react";
import { StellarWalletsKit, Networks } from "@creit.tech/stellar-wallets-kit";
import { AlbedoModule } from "@creit.tech/stellar-wallets-kit/modules/albedo";
import { VarialModule } from "@creit.tech/stellar-wallets-kit/modules/freighter";
import { xBullModule } from "@creit.tech/stellar-wallets-kit/modules/xbull";
import { LobstrModule } from "@creit.tech/stellar-wallets-kit/modules/lobstr";
import { NETWORK_PASSPHRASE } from "../constants/stellar.js";

const STORAGE_KEY = "koired_wallet";

StellarWalletsKit.init({
  modules: [
    new VarialModule(),
    new AlbedoModule(),
    new xBullModule(),
    new LobstrModule(),
  ],
  network: Networks.TESTNET,
});

// Restore the saved session synchronously so the first render already knows
// whether the user is connected (otherwise /app redirects to / on reload).
function loadSession() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return null;
    const { wId, addr } = JSON.parse(saved);
    if (!wId || !addr) return null;
    StellarWalletsKit.setWallet(wId);
    return { wId, addr };
  } catch {
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
    return null;
  }
}

export function useWallet() {
  const [session] = useState(loadSession);
  const [publicKey, setPublicKey] = useState(session?.addr ?? null);
  const [walletId, setWalletId] = useState(session?.wId ?? null);
  const [isConnecting, setIsConnecting] = useState(null);
  const [error, setError] = useState(null);
  const [availableWallets, setAvailableWallets] = useState([]);

  useEffect(() => {
    StellarWalletsKit.refreshSupportedWallets()
      .then(setAvailableWallets)
      .catch(() => {});
  }, []);

  const connect = useCallback(async (wId) => {
    setError(null);
    setIsConnecting(wId);
    try {
      StellarWalletsKit.setWallet(wId);
      const { address } = await StellarWalletsKit.fetchAddress();
      setPublicKey(address);
      setWalletId(wId);
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ wId, addr: address }));
      return address;
    } catch (err) {
      const msg = err?.message ?? "Error al conectar la wallet";
      setError(msg);
      throw err;
    } finally {
      setIsConnecting(null);
    }
  }, []);

  const disconnect = useCallback(() => {
    try { StellarWalletsKit.disconnect(); } catch {}
    setPublicKey(null);
    setWalletId(null);
    setError(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const signXDR = useCallback(async (xdr) => {
    const { signedTxXdr } = await StellarWalletsKit.signTransaction(xdr, {
      networkPassphrase: NETWORK_PASSPHRASE,
    });
    return signedTxXdr;
  }, []);

  const truncatedKey = publicKey
    ? `${publicKey.slice(0, 6)}...${publicKey.slice(-4)}`
    : null;

  return {
    publicKey,
    truncatedKey,
    walletId,
    walletType: walletId,
    isConnecting,
    isConnected: !!publicKey,
    error,
    availableWallets,
    connect,
    disconnect,
    signXDR,
  };
}
