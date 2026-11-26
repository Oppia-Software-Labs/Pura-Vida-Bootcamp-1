import { useCallback, useEffect, useState } from "react";
import { StellarWalletsKit } from "../lib/wallet";
import { config } from "../lib/stellar";

const STORAGE_KEY = "ppv:wallet";

export function useWallet() {
  const [address, setAddress] = useState<string | null>(null);
  const [walletNetwork, setWalletNetwork] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const readNetwork = useCallback(async () => {
    try {
      const { networkPassphrase } = await StellarWalletsKit.getNetwork();
      setWalletNetwork(networkPassphrase);
    } catch {
      setWalletNetwork(null); // algunas wallets no exponen la red
    }
  }, []);

  // Reconexión silenciosa si el usuario ya había conectado una wallet.
  useEffect(() => {
    let saved: string | null = null;
    try { saved = localStorage.getItem(STORAGE_KEY); } catch { /* sin storage */ }
    if (!saved) return;
    (async () => {
      try {
        StellarWalletsKit.setWallet(saved!);
        const { address } = await StellarWalletsKit.fetchAddress();
        if (address) {
          setAddress(address);
          await readNetwork();
        }
      } catch { /* la wallet ya no da permiso: el usuario reconecta a mano */ }
    })();
  }, [readNetwork]);

  const connect = useCallback(async () => {
    setError(null);
    setConnecting(true);
    try {
      const { address } = await StellarWalletsKit.authModal();
      setAddress(address);
      try { localStorage.setItem(STORAGE_KEY, StellarWalletsKit.selectedModule.productId); } catch { /* ignore */ }
      await readNetwork();
    } catch (e) {
      const msg = e instanceof Error ? e.message : (e as { message?: string })?.message;
      if (msg) setError(msg);
    } finally {
      setConnecting(false);
    }
  }, [readNetwork]);

  const disconnect = useCallback(async () => {
    try { await StellarWalletsKit.disconnect(); } catch { /* ignore */ }
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* ignore */ }
    setAddress(null);
    setWalletNetwork(null);
  }, []);

  const sign = useCallback(
    async (xdr: string) => {
      if (!address) throw new Error("Wallet no conectada");
      const { signedTxXdr } = await StellarWalletsKit.signTransaction(xdr, {
        networkPassphrase: config.networkPassphrase,
        address,
      });
      return signedTxXdr;
    },
    [address],
  );

  const wrongNetwork = walletNetwork !== null && walletNetwork !== config.networkPassphrase;

  return { address, walletNetwork, wrongNetwork, connecting, error, connect, disconnect, sign };
}
