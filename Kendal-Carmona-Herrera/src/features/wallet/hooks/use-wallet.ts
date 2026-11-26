"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { isWalletOnTestnet } from "@/lib/stellar/config";
import { copyTextToClipboard } from "@/lib/clipboard";

import {
  WalletAdapterError,
  createWalletWatcher,
  isWalletInstalled,
  mapSdkError,
  readAuthorizedAddress,
  readWalletNetwork,
  requestWalletAccess,
} from "../services/varial-wallet";
import type { WalletError, WalletState } from "../types";

/** Long enough to be noticed, short enough that the label resets on its own. */
const COPIED_FEEDBACK_MS = 2000;

const NOT_INSTALLED_ERROR: WalletError = {
  code: "not_installed",
  message: "No Stellar wallet extension was detected in this browser.",
};

const NETWORK_UNAVAILABLE_ERROR: WalletError = {
  code: "unavailable",
  message: "The wallet did not report its network. Try connecting again.",
};

export interface UseWalletResult {
  state: WalletState;
  connect: () => Promise<void>;
  disconnect: () => void;
  copyAddress: () => Promise<void>;
  copied: boolean;
  watchNetwork: () => void;
}

function toWalletError(error: unknown): WalletError {
  if (error instanceof WalletAdapterError) {
    return { code: error.code, message: error.message };
  }
  return mapSdkError(error);
}

function buildConnectedState(
  address: string,
  network: { network: string; networkPassphrase: string },
): WalletState {
  return {
    status: "connected",
    address,
    network: network.network,
    networkPassphrase: network.networkPassphrase,
    isTestnet: isWalletOnTestnet(network.network, network.networkPassphrase),
  };
}

export function useWallet(): UseWalletResult {
  const [state, setState] = useState<WalletState>({ status: "checking" });
  const [copied, setCopied] = useState(false);

  const stopWatcherRef = useRef<(() => void) | null>(null);
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const connectingRef = useRef(false);
  const mountedRef = useRef(true);
  /** Bumped whenever the session is abandoned, so late promises cannot revive it. */
  const sessionRef = useRef(0);

  const stopWatcher = useCallback(() => {
    if (stopWatcherRef.current === null) return;
    stopWatcherRef.current();
    stopWatcherRef.current = null;
  }, []);

  const startWatcher = useCallback(() => {
    // Only one watcher may poll at a time; a second one would double every update.
    stopWatcher();
    const watcher = createWalletWatcher((next) => {
      setState(buildConnectedState(next.address, next));
    });
    stopWatcherRef.current = () => {
      watcher.stop();
    };
  }, [stopWatcher]);

  const clearCopiedTimer = useCallback(() => {
    if (copiedTimerRef.current === null) return;
    clearTimeout(copiedTimerRef.current);
    copiedTimerRef.current = null;
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    let cancelled = false;
    const session = sessionRef.current;

    const isStale = () => cancelled || sessionRef.current !== session;

    const reconnect = async () => {
      const installed = await isWalletInstalled();
      if (isStale()) return;

      if (!installed) {
        setState({ status: "disconnected", error: NOT_INSTALLED_ERROR });
        return;
      }

      // Never prompt on mount: a non-empty address proves access was already granted.
      const address = await readAuthorizedAddress();
      if (isStale()) return;

      if (address === null) {
        setState({ status: "disconnected" });
        return;
      }

      const network = await readWalletNetwork();
      if (isStale()) return;

      if (network === null) {
        setState({ status: "disconnected", error: NETWORK_UNAVAILABLE_ERROR });
        return;
      }

      setState(buildConnectedState(address, network));
      startWatcher();
    };

    void reconnect();

    return () => {
      cancelled = true;
      mountedRef.current = false;
      stopWatcher();
      clearCopiedTimer();
    };
  }, [clearCopiedTimer, startWatcher, stopWatcher]);

  const connect = useCallback(async () => {
    // Guards against a double click opening two approval prompts in the extension.
    if (connectingRef.current) return;

    // A new attempt owns the session: an older in-flight read must not overwrite it.
    sessionRef.current += 1;
    const session = sessionRef.current;

    connectingRef.current = true;
    setState({ status: "connecting" });

    const isStale = () => !mountedRef.current || sessionRef.current !== session;

    try {
      const installed = await isWalletInstalled();
      if (isStale()) return;

      if (!installed) {
        setState({ status: "disconnected", error: NOT_INSTALLED_ERROR });
        return;
      }

      const address = await requestWalletAccess();
      if (isStale()) return;

      const network = await readWalletNetwork();
      if (isStale()) return;

      if (network === null) {
        setState({ status: "failed", error: NETWORK_UNAVAILABLE_ERROR });
        return;
      }

      // A non-Testnet wallet is still a valid connection: the UI blocks writes and
      // lets the user switch networks instead of silently dropping the session.
      setState(buildConnectedState(address, network));
      startWatcher();
    } catch (error) {
      if (isStale()) return;

      const walletError = toWalletError(error);

      if (walletError.code === "rejected") {
        setState({ status: "disconnected", error: walletError });
        return;
      }

      setState({ status: "failed", error: walletError });
    } finally {
      if (sessionRef.current === session) connectingRef.current = false;
    }
  }, [startWatcher]);

  const disconnect = useCallback(() => {
    // Local only: the canonical pattern is that disconnecting clears session state
    // in the dapp and never revokes the wallet's own grant.
    sessionRef.current += 1;
    connectingRef.current = false;
    stopWatcher();
    clearCopiedTimer();
    setCopied(false);
    setState({ status: "disconnected" });
  }, [clearCopiedTimer, stopWatcher]);

  const address = state.status === "connected" ? state.address : null;

  const copyAddress = useCallback(async () => {
    if (address === null) return;

    const didCopy = await copyTextToClipboard(address);
    if (!mountedRef.current) return;

    if (!didCopy) {
      setCopied(false);
      return;
    }

    setCopied(true);
    clearCopiedTimer();
    copiedTimerRef.current = setTimeout(() => {
      copiedTimerRef.current = null;
      setCopied(false);
    }, COPIED_FEEDBACK_MS);
  }, [address, clearCopiedTimer]);

  const watchNetwork = useCallback(() => {
    if (state.status !== "connected") return;
    startWatcher();
  }, [state.status, startWatcher]);

  return { state, connect, disconnect, copyAddress, copied, watchNetwork };
}
