import { useState, type FormEvent } from "react";
import { buildTipTx, explainError, submitSigned, validateTip } from "../lib/tip";
import { config, shortAddress } from "../lib/stellar";

type Props = {
  address: string;
  disabled: boolean;
  sign: (xdr: string) => Promise<string>;
  onSent: () => void;
};

type Status =
  | { kind: "idle" }
  | { kind: "confirm" }
  | { kind: "busy"; step: string }
  | { kind: "done"; hash: string }
  | { kind: "error"; message: string };

const PRESETS = ["1", "5", "10", "25"];

export function TipSection({ address, disabled, sign, onSent }: Props) {
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("5");
  const [memo, setMemo] = useState("¡Pura vida! 🌴");
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  const busy = status.kind === "busy";
  const input = { from: address, to: to.trim(), amount: amount.trim(), memo };

  const review = (e: FormEvent) => {
    e.preventDefault();
    const err = validateTip(input);
    setStatus(err ? { kind: "error", message: err } : { kind: "confirm" });
  };

  const send = async () => {
    try {
      setStatus({ kind: "busy", step: "Construyendo transacción…" });
      const xdr = await buildTipTx(input);
      setStatus({ kind: "busy", step: "Esperando tu firma en la wallet…" });
      const signed = await sign(xdr);
      setStatus({ kind: "busy", step: "Enviando a la red…" });
      const hash = await submitSigned(signed);
      setStatus({ kind: "done", hash });
      onSent();
    } catch (e) {
      setStatus({ kind: "error", message: explainError(e) });
    }
  };

  return (
    <section className="card" aria-labelledby="tip-title">
      <h2 id="tip-title">3 · Envía una propina</h2>
      <form onSubmit={review} className="form">
        <label>
          Destinatario
          <input className="mono" placeholder="G…" value={to} onChange={(e) => { setTo(e.target.value); setStatus({ kind: "idle" }); }} disabled={busy} required />
        </label>
        <label>
          Monto (XLM)
          <div className="row">
            {PRESETS.map((p) => (
              <button type="button" key={p} className={`chip ${amount === p ? "on" : ""}`} onClick={() => { setAmount(p); setStatus({ kind: "idle" }); }} disabled={busy}>{p}</button>
            ))}
            <input className="amount" inputMode="decimal" value={amount} onChange={(e) => { setAmount(e.target.value); setStatus({ kind: "idle" }); }} disabled={busy} required />
          </div>
        </label>
        <label>
          Mensaje (memo, opcional)
          <input value={memo} maxLength={28} onChange={(e) => { setMemo(e.target.value); setStatus({ kind: "idle" }); }} disabled={busy} />
        </label>
        {status.kind !== "confirm" && (
          <button className="btn primary" type="submit" disabled={disabled || busy}>
            {busy ? status.step : "Revisar propina"}
          </button>
        )}
      </form>

      {status.kind === "confirm" && (
        <div className="confirm">
          <p>Vas a enviar <b>{input.amount} XLM</b> a <span className="mono">{shortAddress(input.to)}</span>{memo && <> con el mensaje “{memo}”</>} en Testnet.</p>
          <div className="row">
            <button className="btn primary" onClick={send}>Firmar y enviar</button>
            <button className="btn" onClick={() => setStatus({ kind: "idle" })}>Cancelar</button>
          </div>
        </div>
      )}
      {status.kind === "done" && (
        <p className="alert ok">
          ¡Propina enviada! Tx:{" "}
          <a className="mono" href={`${config.explorerUrl}/tx/${status.hash}`} target="_blank" rel="noreferrer">{status.hash.slice(0, 12)}…</a>
        </p>
      )}
      {status.kind === "error" && <p className="alert error">{status.message}</p>}
    </section>
  );
}
