import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { LibraryResponse, PlatformConfig } from "../shared/types";
import { api } from "./lib/api";
import { useStellarWallet } from "./hooks/useStellarWallet";
import { FolioContext } from "./folio-context";

export function FolioProvider({ children }: { children: ReactNode }) {
  const wallet = useStellarWallet();
  const [config, setConfig] = useState<PlatformConfig | null>(null);
  const [configError, setConfigError] = useState<string | null>(null);
  const [library, setLibrary] = useState<LibraryResponse | null>(null);
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [libraryError, setLibraryError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let active = true;

    api
      .getConfig()
      .then((value) => {
        if (active) setConfig(value);
      })
      .catch((error: unknown) => {
        if (active) {
          setConfigError(
            error instanceof Error
              ? error.message
              : "No se pudo cargar la configuración de Folio.",
          );
        }
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!wallet.address) {
      // oxlint-disable-next-line react/set-state-in-effect -- clear stale library on disconnect
      setLibrary(null);
      setLibraryLoading(false);
      setLibraryError(null);
      return;
    }

    let active = true;
    // oxlint-disable-next-line react/set-state-in-effect -- loading state precedes the network request
    setLibraryLoading(true);
    setLibraryError(null);

    api
      .getLibrary(wallet.address)
      .then((value) => {
        if (active) setLibrary(value);
      })
      .catch((error: unknown) => {
        if (active) {
          setLibraryError(
            error instanceof Error
              ? error.message
              : "No se pudo cargar tu biblioteca.",
          );
        }
      })
      .finally(() => {
        if (active) setLibraryLoading(false);
      });

    return () => {
      active = false;
    };
  }, [wallet.address, refreshKey]);

  const refreshLibrary = useCallback(() => {
    setRefreshKey((key) => key + 1);
  }, []);

  const value = useMemo(
    () => ({
      wallet,
      config,
      configError,
      library,
      libraryLoading,
      libraryError,
      refreshLibrary,
    }),
    [
      wallet,
      config,
      configError,
      library,
      libraryLoading,
      libraryError,
      refreshLibrary,
    ],
  );

  return (
    <FolioContext.Provider value={value}>{children}</FolioContext.Provider>
  );
}
