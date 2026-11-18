import { useCallback, useEffect, useState } from "react";
import {
  connectWallet,
  disconnectWallet,
  subscribeWallet,
  walletErrorMessage,
} from "./wallet";

export function useWallet() {
  const [address, setAddress] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return subscribeWallet({
      onAddress: (next) => {
        setAddress(next);
        if (next) setError(null);
      },
      onDisconnect: () => setAddress(null),
    });
  }, []);

  const connect = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const next = await connectWallet();
      setAddress(next);
    } catch (err) {
      setError(walletErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }, []);

  const disconnect = useCallback(async () => {
    setBusy(true);
    try {
      await disconnectWallet();
      setAddress(null);
    } catch (err) {
      setError(walletErrorMessage(err));
    } finally {
      setBusy(false);
    }
  }, []);

  return { address, busy, error, connect, disconnect, setError };
}
