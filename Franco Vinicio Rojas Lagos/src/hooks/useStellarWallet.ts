import { useCallback, useEffect, useState } from "react";
import {
  KitEventType,
  Networks,
  StellarWalletsKit,
} from "@creit-tech/stellar-wallets-kit";
import { defaultModules } from "@creit-tech/stellar-wallets-kit/modules/utils";
import * as StellarSdk from "@stellar/stellar-sdk";
import { isValidStellarAddress, STELLAR_CONFIG } from "../lib/stellar";

let kitInitialized = false;

function ensureKitInitialized() {
  if (kitInitialized || typeof window === "undefined") return;
  StellarWalletsKit.init({
    modules: defaultModules(),
    network: Networks.TESTNET,
  });
  kitInitialized = true;
}

export type ConnectionMode = "disconnected" | "wallet" | "watch";

export interface UseStellarWalletReturn {
  address: string | null;
  mode: ConnectionMode;
  walletName: string | null;
  isConnecting: boolean;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  connectWatchAddress: (publicKey: string) => void;
  generateDemoAddress: () => string;
  openProfile: () => Promise<void>;
  signTransaction: (xdr: string) => Promise<string>;
  clearError: () => void;
}

export function useStellarWallet(): UseStellarWalletReturn {
  const [address, setAddress] = useState<string | null>(null);
  const [mode, setMode] = useState<ConnectionMode>("disconnected");
  const [walletName, setWalletName] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    ensureKitInitialized();

    const unsubState = StellarWalletsKit.on(KitEventType.STATE_UPDATED, (event) => {
      const nextAddress = event.payload.address;
      if (nextAddress) {
        setAddress(nextAddress);
        setMode("wallet");
        try {
          setWalletName(StellarWalletsKit.selectedModule.productName);
        } catch {
          setWalletName("Stellar Wallet");
        }
      }
    });

    const unsubWallet = StellarWalletsKit.on(KitEventType.WALLET_SELECTED, () => {
      try {
        setWalletName(StellarWalletsKit.selectedModule.productName);
      } catch {
        setWalletName("Stellar Wallet");
      }
    });

    const unsubDisconnect = StellarWalletsKit.on(KitEventType.DISCONNECT, () => {
      setAddress(null);
      setMode("disconnected");
      setWalletName(null);
    });

    return () => {
      unsubState();
      unsubWallet();
      unsubDisconnect();
    };
  }, []);

  const connect = useCallback(async () => {
    ensureKitInitialized();
    setError(null);
    setIsConnecting(true);

    try {
      const { address: connectedAddress } = await StellarWalletsKit.authModal();
      setAddress(connectedAddress);
      setMode("wallet");
      try {
        setWalletName(StellarWalletsKit.selectedModule.productName);
      } catch {
        setWalletName("Stellar Wallet");
      }
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "No se pudo conectar la wallet.";
      if (!/closed|cancel/i.test(message)) {
        setError(message);
      }
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(async () => {
    setError(null);
    if (mode === "wallet") {
      try {
        await StellarWalletsKit.disconnect();
      } catch {
        // Ensure local state always resets cleanly
      }
    }
    setAddress(null);
    setMode("disconnected");
    setWalletName(null);
  }, [mode]);

  const connectWatchAddress = useCallback((publicKey: string) => {
    const trimmed = publicKey.trim();
    if (!isValidStellarAddress(trimmed)) {
      setError("Ingresa una dirección Stellar válida (56 caracteres iniciando con G).");
      return;
    }
    setError(null);
    setAddress(trimmed);
    setMode("watch");
    setWalletName("Modo Explorador (Solo lectura)");
  }, []);

  const generateDemoAddress = useCallback(() => {
    const kp = StellarSdk.Keypair.random();
    const pub = kp.publicKey();
    setError(null);
    setAddress(pub);
    setMode("watch");
    setWalletName("Cuenta Demo Testnet (Solo lectura)");
    return pub;
  }, []);

  const openProfile = useCallback(async () => {
    if (mode !== "wallet") return;
    try {
      await StellarWalletsKit.profileModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo abrir el perfil.");
    }
  }, [mode]);

  const signTransaction = useCallback(
    async (xdr: string): Promise<string> => {
      if (mode !== "wallet" || !address) {
        throw new Error(
          "Conecta una wallet de Stellar (por ejemplo Freighter/Varial o Albedo) para firmar transacciones."
        );
      }
      const { signedTxXdr } = await StellarWalletsKit.signTransaction(xdr, {
        networkPassphrase: STELLAR_CONFIG.networkPassphrase,
        address,
      });
      return signedTxXdr;
    },
    [address, mode]
  );

  const clearError = useCallback(() => setError(null), []);

  return {
    address,
    mode,
    walletName,
    isConnecting,
    error,
    connect,
    disconnect,
    connectWatchAddress,
    generateDemoAddress,
    openProfile,
    signTransaction,
    clearError,
  };
}
