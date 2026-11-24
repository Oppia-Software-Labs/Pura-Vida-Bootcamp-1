import { useEffect, useState } from "react";
import { config, horizon, shortAddress } from "../lib/stellar";

type Item = { id: string; dir: "in" | "out"; other: string; amount: string; date: string; hash: string };

/** Últimos pagos en XLM (payment / create_account) de la cuenta, vía Horizon. */
export function HistorySection({ address, refreshKey }: { address: string; refreshKey: number }) {
  const [items, setItems] = useState<Item[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const page = await horizon.payments().forAccount(address).order("desc").limit(15).call();
        const rows: Item[] = [];
        for (const r of page.records) {
          if (r.type === "payment" && r.asset_type === "native") {
            const out = r.from === address;
            rows.push({ id: r.id, dir: out ? "out" : "in", other: out ? r.to : r.from, amount: r.amount, date: r.created_at, hash: r.transaction_hash });
          } else if (r.type === "create_account") {
            const out = r.funder === address;
            rows.push({ id: r.id, dir: out ? "out" : "in", other: out ? r.account : r.funder, amount: r.starting_balance, date: r.created_at, hash: r.transaction_hash });
          }
        }
        if (!cancelled) { setItems(rows.slice(0, 8)); setError(null); }
      } catch (e) {
        const status = (e as { response?: { status?: number } })?.response?.status;
        if (!cancelled) {
          if (status === 404) setItems([]);
          else setError(e instanceof Error ? e.message : String(e));
        }
      }
    })();
    return () => { cancelled = true; };
  }, [address, refreshKey]);

  return (
    <section className="card" aria-labelledby="history-title">
      <h2 id="history-title">4 · Movimientos recientes</h2>
      {error && <p className="alert error">{error}</p>}
      {!error && items === null && <p className="muted">Cargando…</p>}
      {items?.length === 0 && <p className="muted">Aún no hay movimientos.</p>}
      {items && items.length > 0 && (
        <ul className="history">
          {items.map((i) => (
            <li key={i.id}>
              <span className={`tag ${i.dir}`}>{i.dir === "in" ? "Recibida" : "Enviada"}</span>
              <span className="mono">{shortAddress(i.other)}</span>
              <b className={i.dir}>{i.dir === "in" ? "+" : "−"}{Number(i.amount).toLocaleString("es-CR", { maximumFractionDigits: 7 })} XLM</b>
              <a href={`${config.explorerUrl}/tx/${i.hash}`} target="_blank" rel="noreferrer" className="muted small">
                {new Date(i.date).toLocaleString("es-CR", { dateStyle: "short", timeStyle: "short" })}
              </a>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
