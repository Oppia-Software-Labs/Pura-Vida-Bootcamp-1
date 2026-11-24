import { useCallback, useEffect, useRef, useState } from "react";
import {
  authorizeWallet,
  detectWallet,
  errorMessage,
  isTestnet,
  loadTestnetBalance,
  readWalletIdentity,
  revokeWalletAccess,
  WalletError,
} from "../stellar/wallet";
import type { AccountBalance, WalletIdentity } from "../stellar/wallet";

export type WalletPhase =
  | "disconnected"
  | "detecting"
  | "authorizing"
  | "loading"
  | "connected"
  | "wrong-network"
  | "error";
export type WalletState = {
  phase: WalletPhase;
  identity: WalletIdentity | null;
  account: AccountBalance | null;
  error: string | null;
  missingWallet: boolean;
  updatedAt: Date | null;
};
const initialState: WalletState = {
  phase: "disconnected",
  identity: null,
  account: null,
  error: null,
  missingWallet: false,
  updatedAt: null,
};

export function useWallet() {
  const [state, setState] = useState<WalletState>(initialState);
  const [authorized, setAuthorized] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const stateRef = useRef(state);
  const generation = useRef(0);
  const inFlight = useRef(false);
  const controller = useRef<AbortController | null>(null);
  stateRef.current = state;

  const synchronize = useCallback(
    async (requestAuthorization = false, forceRefresh = true) => {
      if (inFlight.current) return;
      inFlight.current = true;
      const currentGeneration = ++generation.current;
      controller.current?.abort();
      const requestController = new AbortController();
      controller.current = requestController;
      const isCurrent = () => generation.current === currentGeneration;
      try {
        if (requestAuthorization) {
          setState({ ...initialState, phase: "detecting" });
          // Primero detectamos la extensión; todavía no solicitamos acceso a la cuenta.
          if (!(await detectWallet()))
            throw new WalletError(
              "missing-wallet",
              "No encontramos Varial en este navegador. Instale la extensión y vuelva a intentarlo.",
            );
          if (!isCurrent()) return;
          setState({ ...initialState, phase: "authorizing" });
          await authorizeWallet();
          if (!isCurrent()) return;
          setAuthorized(true);
        }
        const identity = await readWalletIdentity();
        if (!isCurrent()) return;
        if (!isTestnet(identity)) {
          setState({ ...initialState, identity, phase: "wrong-network" });
          return;
        }
        const previous = stateRef.current;
        const unchanged =
          previous.identity?.address === identity.address &&
          previous.phase === "connected";
        if (
          !forceRefresh &&
          unchanged &&
          previous.updatedAt &&
          Date.now() - previous.updatedAt.getTime() < 30000
        )
          return;
        setState({ ...initialState, identity, phase: "loading" });
        const account = await loadTestnetBalance(
          identity,
          requestController.signal,
        );
        // Comprobamos que la cuenta y la red sigan siendo las mismas.
        const latestIdentity = await readWalletIdentity();
        if (!isCurrent()) return;
        if (
          latestIdentity.address !== identity.address ||
          !isTestnet(latestIdentity)
        ) {
          setState({
            ...initialState,
            identity: latestIdentity,
            phase: isTestnet(latestIdentity) ? "loading" : "wrong-network",
          });
          return;
        }
        setState({
          ...initialState,
          identity,
          account,
          phase: "connected",
          updatedAt: new Date(),
        });
      } catch (error) {
        if (isCurrent())
          setState((previous) => ({
            ...initialState,
            identity: requestAuthorization ? null : previous.identity,
            phase: "error",
            error: errorMessage(error),
            missingWallet:
              error instanceof WalletError && error.code === "missing-wallet",
          }));
      } finally {
        if (isCurrent()) inFlight.current = false;
      }
    },
    [],
  );

  const connect = useCallback(() => synchronize(true), [synchronize]);
  const refresh = useCallback(() => synchronize(false), [synchronize]);
  const disconnectWallet = useCallback(async () => {
    ++generation.current;
    controller.current?.abort();
    inFlight.current = false;
    setAuthorized(false);
    setDisconnecting(true);
    setState(initialState);
    try {
      await revokeWalletAccess();
    } catch (error) {
      setState({ ...initialState, error: errorMessage(error) });
    } finally {
      setDisconnecting(false);
    }
  }, []);

  useEffect(() => {
    if (!authorized) return;
    const check = () => {
      if (!document.hidden) void synchronize(false, false);
    };
    const interval = setInterval(check, 5000);
    window.addEventListener("focus", check);
    document.addEventListener("visibilitychange", check);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", check);
      document.removeEventListener("visibilitychange", check);
    };
  }, [authorized, synchronize]);

  useEffect(
    () => () => {
      ++generation.current;
      controller.current?.abort();
      inFlight.current = false;
    },
    [],
  );
  const busy =
    disconnecting ||
    ["detecting", "authorizing", "loading"].includes(state.phase);
  return {
    ...state,
    authorized,
    busy,
    disconnecting,
    connect,
    refresh,
    disconnectWallet,
  };
}
