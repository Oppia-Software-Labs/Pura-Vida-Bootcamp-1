"use client";

import { useCallback, useEffect, useState } from "react";
import {
  disconnect as disconnectWallet,
  getAddress,
  getNetwork,
  isConnected,
  requestAccess,
  WatchWalletChanges,
} from "@stellar/varial-sdk";
import { fundWithFriendbot, getXlmBalance } from "@/lib/stellar";

/** Enlace para instalar Varial (antes Freighter). */
export const VARIAL_URL = "https://varialwallet.com/";

/** Conexión con Varial: dirección, red y cambios en vivo. */
export function useWallet() {
  const [address, setAddress] = useState("");
  const [network, setNetwork] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState("");
  const [missing, setMissing] = useState(false);

  // Si ya diste permiso antes, recupera la wallet al recargar
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { isConnected: hasWallet } = await isConnected();
      if (!hasWallet) return;
      const { address } = await getAddress();
      if (!address) return;
      const { network } = await getNetwork();
      if (cancelled) return;
      setAddress(address);
      setNetwork(network);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Mientras hay una wallet conectada, sigue los cambios de cuenta o de red en Varial
  const connected = address !== "";
  useEffect(() => {
    if (!connected) return;
    const watcher = new WatchWalletChanges(2000);
    watcher.watch(({ address, network, error }) => {
      if (error) return;
      if (address) setAddress(address);
      if (network) setNetwork(network);
    });
    return () => watcher.stop();
  }, [connected]);

  const connect = useCallback(async () => {
    setError("");
    setMissing(false);
    setConnecting(true);
    try {
      const { isConnected: hasWallet } = await isConnected();
      if (!hasWallet) {
        setMissing(true);
        return;
      }
      // Abre el popup de Varial para autorizar la app
      const access = await requestAccess();
      if (access.error) {
        setError("No se pudo conectar la wallet.");
        return;
      }
      const { network } = await getNetwork();
      setAddress(access.address);
      setNetwork(network);
    } finally {
      setConnecting(false);
    }
  }, []);

  // Revoca el permiso en Varial y limpia el estado de la app
  const disconnect = useCallback(async () => {
    await disconnectWallet().catch(() => undefined);
    setAddress("");
    setNetwork("");
  }, []);

  return { address, network, connected, connecting, error, missing, connect, disconnect };
}

/** Saldo de XLM de una cuenta en Testnet, con Friendbot para fondearla. */
export function useBalance(address: string) {
  // undefined = cargando · null = cuenta sin fondos · string = saldo
  const [balance, setBalance] = useState<string | null | undefined>(undefined);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [funding, setFunding] = useState(false);
  const [loadedFor, setLoadedFor] = useState("");
  // Cuenta que recibió fondos de Friendbot durante este viaje (si no, ya los tenía)
  const [fundedFor, setFundedFor] = useState("");

  useEffect(() => {
    if (!address) return;
    let cancelled = false;
    getXlmBalance(address)
      .then((b) => {
        if (cancelled) return;
        setBalance(b);
        setLoadedFor(address);
        setError("");
      })
      .catch(() => {
        if (!cancelled) setError("No se pudo leer el saldo.");
      });
    return () => {
      cancelled = true;
    };
  }, [address, refreshKey]);

  const refresh = useCallback(() => setRefreshKey((n) => n + 1), []);

  const fund = useCallback(async () => {
    setFunding(true);
    setError("");
    try {
      await fundWithFriendbot(address);
      setFundedFor(address);
      setRefreshKey((n) => n + 1);
    } catch (e) {
      setError(`No se pudieron pedir fondos: ${(e as Error).message}`);
    } finally {
      setFunding(false);
    }
  }, [address]);

  // Si el saldo cargado es de otra cuenta, todavía no sabemos el de esta
  const current = address && loadedFor === address ? balance : undefined;
  const fundedHere = address !== "" && fundedFor === address;
  return { balance: current, error, funding, fundedHere, refresh, fund };
}

export type Wallet = ReturnType<typeof useWallet>;
export type Balance = ReturnType<typeof useBalance>;
