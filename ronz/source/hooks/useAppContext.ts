import { useOutletContext } from "react-router";
import type { useWallet } from "./useWallet";

export type AppContext = {
  wallet: ReturnType<typeof useWallet>;
  balanceKey: number;
  depositsKey: number;
  refreshBalance: () => void;
  refreshDeposits: () => void;
};

export function useAppContext(): AppContext {
  return useOutletContext<AppContext>();
}
