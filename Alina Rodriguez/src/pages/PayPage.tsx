import { Check, Droplets } from "lucide-react";
// Página pública del link de cobro: la persona que debe la abre, conecta su wallet y paga.
import { useEffect, useState } from "react";
import { formatMoney } from "../lib/currencies";
import { convert, getRates, refreshRates, type Rates } from "../lib/rates";
import { readPayLink } from "../lib/router";
import { explorerTx, fundWithFriendbot, payXlm, shortAddr, useWallet } from "../lib/stellar";
import { WalletPayButton } from "../components/ui";

const DONE_KEY = "teja-a-teja:pagados";

function alreadyPaid(memo: string): string | null {
  try {
    return (JSON.parse(localStorage.getItem(DONE_KEY) ?? "{}") as Record<string, string>)[memo] ?? null;
  } catch {
    return null;
  }
}
function markPaid(memo: string, hash: string) {
  try {
    const all = JSON.parse(localStorage.getItem(DONE_KEY) ?? "{}");
    all[memo] = hash;
    localStorage.setItem(DONE_KEY, JSON.stringify(all));
  } catch {
    /* ignore */
  }
}

export function PayPage({ data }: { data: string }) {
  const link = readPayLink(data);
  const w = useWallet();
  const [rates, setRates] = useState<Rates>(getRates());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hash, setHash] = useState<string | null>(link ? alreadyPaid(link.memo) : null);

  useEffect(() => {
    refreshRates().then(setRates);
  }, []);

  if (!link) return <div className="tile empty">Este link de cobro no es válido.</div>;

  const xlm = convert(link.amount, link.currency, "XLM", rates);
  const xlmStr = Number.isFinite(xlm) ? xlm.toFixed(7).replace(/\.?0+$/, "") : "";

  async function pay() {
    setBusy(true);
    setError(null);
    try {
      const h = await payXlm({ to: link!.to, amount: xlm.toFixed(7), memo: link!.memo });
      markPaid(link!.memo, h);
      setHash(h);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="stack" style={{ maxWidth: 540, margin: "0 auto" }}>
      <div className="tile dark" style={{ textAlign: "center" }}>
        <p className="muted small">{link.fromName ? `Hola, ${link.fromName}` : "Hola"}</p>
        <p style={{ marginTop: 6 }}>{link.toName || "Alguien"} te está cobrando</p>
        <p className="big-num" style={{ margin: "8px 0" }}>{formatMoney(link.amount, link.currency)}</p>
        {link.currency !== "XLM" && <p className="muted small">≈ {xlmStr} XLM al precio de hoy{!rates.live && " (aprox.)"}</p>}
        <p className="small" style={{ marginTop: 10 }}>por «{link.description}»</p>
      </div>

      {hash ? (
        <div className="tile solid stack" style={{ textAlign: "center" }}>
          <span className="icon-tile" style={{ width: 56, height: 56, margin: "0 auto", background: "var(--leaf-soft)", color: "var(--leaf-ink)" }}><Check size={28} aria-hidden /></span>
          <h2>¡Pago enviado!</h2>
          <p className="small muted">{link.toName || "Quien te cobró"} lo verá como pagado automáticamente.</p>
          <a className="btn soft" href={explorerTx(hash)} target="_blank" rel="noreferrer">Ver transacción en Stellar</a>
        </div>
      ) : (
        <div className="tile solid stack">
          <div className="spread small">
            <span className="muted">Para</span>
            <span className="mono">{shortAddr(link.to)}</span>
          </div>
          <div className="spread small">
            <span className="muted">Memo</span>
            <span className="mono">{link.memo}</span>
          </div>
          <div className="spread small">
            <span className="muted">Red</span>
            <span>Stellar Testnet</span>
          </div>
          {w.address && (
            <div className="spread small">
              <span className="muted">Tu wallet</span>
              <span className="mono">{shortAddr(w.address)} · {w.balance === null ? "sin fondos" : `${Number(w.balance).toLocaleString("es-CR", { maximumFractionDigits: 2 })} XLM`}</span>
            </div>
          )}
          {error && <div className="alert error">{error}</div>}
          {w.address && w.balance === null && (
            <button className="btn soft block" onClick={() => fundWithFriendbot(w.address!).catch((e) => setError(e.message))}>
              <Droplets size={17} aria-hidden /> Obtener XLM de prueba (Friendbot)
            </button>
          )}
          <WalletPayButton label={`Pagar ${xlmStr} XLM`} onPay={pay} busy={busy} disabled={!xlmStr} />
          <p className="tiny muted" style={{ textAlign: "center" }}>Tu wallet te pedirá confirmar el pago antes de enviarlo.</p>
        </div>
      )}
      <p className="small muted" style={{ textAlign: "center" }}>¿Pagaste en efectivo? Avísale a {link.toName || "quien te cobró"} para que lo registre.</p>
    </div>
  );
}
