import { createContext, useContext } from "react";
import type { LibraryResponse, PlatformConfig } from "../shared/types";
import type { StellarWallet } from "./hooks/useStellarWallet";

export interface FolioContextValue {
  wallet: StellarWallet;
  config: PlatformConfig | null;
  configError: string | null;
  library: LibraryResponse | null;
  libraryLoading: boolean;
  libraryError: string | null;
  refreshLibrary: () => void;
}

export const FolioContext = createContext<FolioContextValue | null>(null);

export function useFolio(): FolioContextValue {
  const context = useContext(FolioContext);

  if (!context) {
    throw new Error("useFolio must be used inside FolioProvider");
  }

  return context;
}
