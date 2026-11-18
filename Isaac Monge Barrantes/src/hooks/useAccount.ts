import { useCallback, useEffect, useState } from "react";
import { NotFoundError } from "@stellar/stellar-sdk";
import { config, horizon } from "../lib/stellar";

export type AccountState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "unfunded" }
  | { status: "ready"; xlm: string }
  | { status: "error"; message: string };

export function useAccount(address: string | null) {
  const [state, setState] = useState<AccountState>({ status: "idle" });
  const [funding, setFunding] = useState(false);

  const refresh = useCallback(async () => {
    if (!address) return setState({ status: "idle" });
    setState((s) => (s.status === "ready" ? s : { status: "loading" }));
    try {
      const account = await horizon.loadAccount(address);
      const native = account.balances.find((b) => b.asset_type === "native");
      setState({ status: "ready", xlm: native?.balance ?? "0" });
    } catch (e) {
      if (e instanceof NotFoundError) setState({ status: "unfunded" });
      else setState({ status: "error", message: e instanceof Error ? e.message : String(e) });
    }
  }, [address]);

  useEffect(() => { refresh(); }, [refresh]);

  // Friendbot: fondea 10,000 XLM de prueba a una cuenta nueva de Testnet.
  const fund = useCallback(async () => {
    if (!address) return;
    setFunding(true);
    try {
      const res = await fetch(`${config.friendbotUrl}?addr=${encodeURIComponent(address)}`);
      if (!res.ok && res.status !== 400) throw new Error(`Friendbot respondió ${res.status}`);
      await refresh();
    } catch (e) {
      setState({ status: "error", message: e instanceof Error ? e.message : String(e) });
    } finally {
      setFunding(false);
    }
  }, [address, refresh]);

  return { state, refresh, fund, funding };
}
