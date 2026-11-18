import { useCallback, useEffect, useState } from "react";
import { StellarWalletsKit } from "@creit.tech/stellar-wallets-kit/sdk";
import {
  KitEventType,
  Networks,
} from "@creit.tech/stellar-wallets-kit/types";
import { AlbedoModule } from "@creit.tech/stellar-wallets-kit/modules/albedo";
import { LobstrModule } from "@creit.tech/stellar-wallets-kit/modules/lobstr";
import { RabetModule } from "@creit.tech/stellar-wallets-kit/modules/rabet";
import { VarialModule } from "@creit.tech/stellar-wallets-kit/modules/varial";
import { xBullModule } from "@creit.tech/stellar-wallets-kit/modules/xbull";

StellarWalletsKit.init({
  modules: [
    new AlbedoModule(),
    new VarialModule(),
    new xBullModule(),
    new RabetModule(),
    new LobstrModule(),
  ],
  network: Networks.TESTNET,
  authModal: {
    showInstallLabel: true,
    hideUnsupportedWallets: true,
  },
});

function describeWalletError(error: unknown): string | null {
  const message = error instanceof Error ? error.message : String(error);
  const normalized = message.toLowerCase();

  if (
    normalized.includes("closed") ||
    normalized.includes("cancel") ||
    normalized.includes("reject") ||
    normalized.includes("denied")
  ) {
    return null;
  }

  if (normalized.includes("not installed")) {
    return "Esa wallet no está instalada en este navegador. Prueba con Albedo.";
  }

  return message || "No se pudo conectar la wallet. Intenta de nuevo.";
}

export interface StellarWallet {
  address: string | null;
  networkPassphrase: string | null;
  networkMismatch: boolean;
  connecting: boolean;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  signTransaction: (xdr: string) => Promise<string>;
  clearError: () => void;
}

export function useStellarWallet(): StellarWallet {
  const [address, setAddress] = useState<string | null>(null);
  const [networkPassphrase, setNetworkPassphrase] = useState<string | null>(
    null,
  );
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    StellarWalletsKit.getAddress()
      .then(({ address: storedAddress }) => {
        if (active && storedAddress) setAddress(storedAddress);
      })
      .catch(() => {
        // No saved session yet: the user simply connects when ready.
      });

    const unsubscribeState = StellarWalletsKit.on(
      KitEventType.STATE_UPDATED,
      (event) => {
        if (!active) return;
        setAddress(event.payload.address ?? null);
        setNetworkPassphrase(event.payload.networkPassphrase ?? null);
      },
    );

    const unsubscribeDisconnect = StellarWalletsKit.on(
      KitEventType.DISCONNECT,
      () => {
        if (!active) return;
        setAddress(null);
        setNetworkPassphrase(null);
      },
    );

    return () => {
      active = false;
      unsubscribeState();
      unsubscribeDisconnect();
    };
  }, []);

  const connect = useCallback(async () => {
    setConnecting(true);
    setError(null);

    try {
      const { address: connectedAddress } =
        await StellarWalletsKit.authModal();
      setAddress(connectedAddress);

      try {
        const network = await StellarWalletsKit.getNetwork();
        setNetworkPassphrase(network.networkPassphrase);
      } catch {
        setNetworkPassphrase(null);
      }
    } catch (connectionError) {
      setError(describeWalletError(connectionError));
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnect = useCallback(async () => {
    try {
      await StellarWalletsKit.disconnect();
    } finally {
      setAddress(null);
      setNetworkPassphrase(null);
      setError(null);
    }
  }, []);

  const networkMismatch =
    Boolean(networkPassphrase) && networkPassphrase !== Networks.TESTNET;

  const signTransaction = useCallback(
    async (xdr: string) => {
      if (!address) {
        throw new Error("Conecta tu wallet antes de firmar.");
      }

      if (networkMismatch) {
        throw new Error(
          "Tu wallet está en otra red. Cámbiala a Testnet antes de firmar.",
        );
      }

      const { signedTxXdr } = await StellarWalletsKit.signTransaction(xdr, {
        address,
        networkPassphrase: Networks.TESTNET,
      });

      return signedTxXdr;
    },
    [address, networkMismatch],
  );

  return {
    address,
    networkPassphrase,
    networkMismatch,
    connecting,
    error,
    connect,
    disconnect,
    signTransaction,
    clearError: () => setError(null),
  };
}
