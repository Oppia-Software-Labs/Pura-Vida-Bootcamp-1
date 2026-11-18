import { useCallback, useEffect, useState } from "react";
import { connectWallet, getConnectedAddress } from "@bloc/wallet/varial";

export function useWallet() {
  const [address, setAddress] = useState<string | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    getConnectedAddress().then(setAddress, () => {});
  }, []);

  const connect = useCallback(async () => {
    setConnecting(true);
    setError(null);
    try {
      setAddress(await connectWallet());
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)));
    } finally {
      setConnecting(false);
    }
  }, []);

  return { address, error, connecting, connect };
}
