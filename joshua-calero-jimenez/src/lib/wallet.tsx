import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { StellarWalletsKit } from "@creit.tech/stellar-wallets-kit/sdk";
import { defaultModules } from "@creit.tech/stellar-wallets-kit/modules/utils";
import { KitEventType, Networks } from "@creit.tech/stellar-wallets-kit/types";
import { TESTNET_PASSPHRASE } from "./config";
import { explainError } from "./horizon";

// El modal del kit toma los colores de la galaxia.
const galaxyTheme = {
  background: "#0e0d22",
  "background-secondary": "#15142c",
  "foreground-strong": "#ecebf5",
  foreground: "#d6d4e6",
  "foreground-secondary": "#8d8aa8",
  primary: "#ecebf5",
  "primary-foreground": "#08071a",
  transparent: "rgba(14,13,34,0)",
  lighter: "#1b1a35",
  light: "#23223f",
  "light-gray": "#2e2d4c",
  gray: "#5d5b7a",
  danger: "#ff8a9b",
  border: "rgba(255,255,255,0.08)",
  shadow: "0 24px 60px rgba(0,0,0,0.5)",
  "border-radius": "16px",
  "font-family": "'Plus Jakarta Sans', system-ui, sans-serif",
};

let initialized = false;
function initKit() {
  if (initialized) return;
  StellarWalletsKit.init({
    modules: defaultModules(),
    network: Networks.TESTNET,
    theme: galaxyTheme,
  });
  initialized = true;
}

interface WalletState {
  address: string | null;
  connecting: boolean;
  /** true = Testnet, false = otra red, null = la wallet no informó su red */
  onTestnet: boolean | null;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  signTransaction: (xdr: string) => Promise<string>;
  clearError: () => void;
}

const Ctx = createContext<WalletState | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [onTestnet, setOnTestnet] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  const checkNetwork = useCallback(async () => {
    try {
      const { networkPassphrase } = await StellarWalletsKit.getNetwork();
      setOnTestnet(networkPassphrase === TESTNET_PASSPHRASE);
    } catch {
      setOnTestnet(null);
    }
  }, []);

  // Restaurar la sesión: el kit guarda wallet y dirección en localStorage, no se pide permiso otra vez.
  useEffect(() => {
    initKit();
    let alive = true;
    StellarWalletsKit.getAddress()
      .then(({ address }) => {
        if (!alive || !address) return;
        setAddress(address);
        void checkNetwork();
      })
      .catch(() => {
        /* no había sesión guardada */
      });

    const offState = StellarWalletsKit.on(KitEventType.STATE_UPDATED, (e) => {
      setAddress(e.payload.address ?? null);
    });
    const offDisc = StellarWalletsKit.on(KitEventType.DISCONNECT, () => {
      setAddress(null);
      setOnTestnet(null);
    });
    // Si el usuario cambia de red dentro de la wallet y vuelve a esta pestaña, lo revalidamos.
    const onFocus = () => void checkNetwork();
    window.addEventListener("focus", onFocus);
    return () => {
      alive = false;
      offState();
      offDisc();
      window.removeEventListener("focus", onFocus);
    };
  }, [checkNetwork]);

  const connect = useCallback(async () => {
    initKit();
    setError(null);
    setConnecting(true);
    try {
      const { address } = await StellarWalletsKit.authModal();
      setAddress(address);
      await checkNetwork();
    } catch (e: any) {
      // Cerrar el modal sin elegir wallet no es un error.
      if (e?.code !== -1 && !/closed|cancel/i.test(String(e?.message ?? ""))) setError(explainError(e));
    } finally {
      setConnecting(false);
    }
  }, [checkNetwork]);

  const disconnect = useCallback(async () => {
    try {
      await StellarWalletsKit.disconnect();
    } finally {
      setAddress(null);
      setOnTestnet(null);
    }
  }, []);

  const signTransaction = useCallback(
    async (xdr: string) => {
      const { signedTxXdr } = await StellarWalletsKit.signTransaction(xdr, {
        networkPassphrase: TESTNET_PASSPHRASE,
        address: address ?? undefined,
      });
      return signedTxXdr;
    },
    [address],
  );

  const value = useMemo<WalletState>(
    () => ({
      address,
      connecting,
      onTestnet,
      error,
      connect,
      disconnect,
      signTransaction,
      clearError: () => setError(null),
    }),
    [address, connecting, onTestnet, error, connect, disconnect, signTransaction],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useWallet() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useWallet debe usarse dentro de <WalletProvider>");
  return v;
}
