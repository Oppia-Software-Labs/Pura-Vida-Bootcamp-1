import { useState, useCallback, useEffect } from "react";
import {
  isConnected as freighterIsConnected,
  getAddress,
  requestAccess,
} from "@stellar/freighter-api";

export function useFreighter() {
  const [publicKey, setPublicKey] = useState(null);
  const [isWalletInstalled, setIsWalletInstalled] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState(null);

  // On mount: detect extension and restore session if already allowed
  useEffect(() => {
    async function checkSession() {
      try {
        const { isConnected } = await freighterIsConnected();
        setIsWalletInstalled(true);
        if (isConnected) {
          const { address, error: err } = await getAddress();
          if (!err && address) setPublicKey(address);
        }
      } catch {
        setIsWalletInstalled(false);
      }
    }
    checkSession();
  }, []);

  // Returns the public key on success, throws on failure
  const connect = useCallback(async () => {
    setError(null);
    setIsConnecting(true);
    try {
      // requestAccess opens the Freighter popup and returns the address directly
      const { address, error: err } = await requestAccess();
      if (err) throw new Error(err);
      if (!address) throw new Error("No se recibió dirección de la wallet");
      setPublicKey(address);
      return address;
    } catch (err) {
      const msg = err?.message ?? "Error al conectar la wallet";
      setError(msg);
      throw err;
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setPublicKey(null);
    setError(null);
  }, []);

  const truncatedKey = publicKey
    ? `${publicKey.slice(0, 6)}...${publicKey.slice(-4)}`
    : null;

  return {
    publicKey,
    truncatedKey,
    isWalletInstalled,
    isConnecting,
    isConnected: !!publicKey,
    error,
    connect,
    disconnect,
  };
}
