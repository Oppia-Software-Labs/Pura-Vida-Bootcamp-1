import type { AccountState } from "../hooks/useAccount";

type Props = { state: AccountState; funding: boolean; onFund: () => void; onRefresh: () => void };

const fmt = (n: string) => Number(n).toLocaleString("es-CR", { maximumFractionDigits: 7 });

export function BalanceSection({ state, funding, onFund, onRefresh }: Props) {
  return (
    <section className="card" aria-labelledby="balance-title">
      <div className="row between">
        <h2 id="balance-title">2 · Tu saldo</h2>
        <button className="btn ghost" onClick={onRefresh} disabled={state.status === "loading"}>Actualizar</button>
      </div>
      {state.status === "loading" && <p className="muted">Consultando Horizon…</p>}
      {state.status === "ready" && (
        <p className="balance"><span className="big">{fmt(state.xlm)}</span> XLM</p>
      )}
      {state.status === "unfunded" && (
        <>
          <p className="muted">Esta cuenta todavía no existe en Testnet. Fondéala gratis con Friendbot.</p>
          <button className="btn primary" onClick={onFund} disabled={funding}>
            {funding ? "Fondeando…" : "Fondear con Friendbot"}
          </button>
        </>
      )}
      {state.status === "error" && <p className="alert error">{state.message}</p>}
    </section>
  );
}
