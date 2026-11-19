import { createContext, useContext } from "react";
import { useWallet } from "../hooks/useWallet.js";

const WalletContext = createContext(null);

export function WalletProvider({ children }) {
  const wallet = useWallet();
  return <WalletContext.Provider value={wallet}>{children}</WalletContext.Provider>;
}

export function useWalletContext() {
  return useContext(WalletContext);
}
