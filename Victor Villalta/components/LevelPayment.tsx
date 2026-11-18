"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { displayDecimal, paymentAmount } from "@/lib/stellar/amount";
import { DESTINATION_ADDRESS, explorerLink, testnetConfig } from "@/lib/stellar/config";
import { StellarError, errorMessage } from "@/lib/stellar/errors";
import { buildPayment, checkDestination, sendPayment, signPayment, type PaymentDraft, type PaymentReceipt } from "@/lib/stellar/payment";
import { Icon } from "./Icon";
import { TestnetBadge } from "./SiteChrome";

const steps = ["Destino", "Monto", "Construcción", "Firma", "Envío"] as const;
type Step = 0 | 1 | 2 | 3 | 4;

export function LevelPayment({ address, onSent }: { address: string; onSent: (receipt: PaymentReceipt) => void }) {
  const [step, setStep] = useState<Step>(0);
  const [amount, setAmount] = useState("1");
  const [draft, setDraft] = useState<PaymentDraft | null>(null);
  const [signed, setSigned] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [restart, setRestart] = useState(false);
  const [pending, setPending] = useState(false);
  const active = useRef(false);
  const stepHeading = useRef<HTMLHeadingElement>(null);
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    stepHeading.current?.focus();
  }, [step]);

  function go(next: Step) {
    setError("");
    setRestart(false);
    setPending(false);
    setStep(next);
  }

  async function run(action: () => Promise<void>) {
    if (active.current) return;
    active.current = true;
    setBusy(true);
    setError("");
    try {
      await action();
    } catch (cause) {
      setError(errorMessage(cause));
      setRestart(cause instanceof StellarError && (cause.kind === "expired" || cause.kind === "rebuild"));
      setPending(cause instanceof StellarError && cause.kind === "pending");
    } finally {
      active.current = false;
      setBusy(false);
    }
  }

  function chooseAmount(event: FormEvent) {
    event.preventDefault();
    try {
      setAmount(paymentAmount(amount));
      go(2);
    } catch (cause) {
      setError(errorMessage(cause));
    }
  }

  function rebuild() {
    setDraft(null);
    setSigned("");
    setConfirmed(false);
    go(1);
  }

  const readyDestination = /^G[A-Z2-7]{55}$/.test(DESTINATION_ADDRESS);
  let testnetReady = true;
  try {
    testnetConfig();
  } catch {
    testnetReady = false;
  }

  if (!testnetReady) {
    return <p className="notice notice-error" role="alert">La configuración de red debe apuntar a Testnet. El pago está bloqueado.</p>;
  }

  return (
    <div className="level-flow">
      <ol className="payment-steps" aria-label="Pasos del pago">
        {steps.map((name, index) => (
          <li key={name} aria-current={index === step ? "step" : undefined}>
            <span>{index < step ? <Icon name="check" width="14" height="14"/> : index + 1}</span>{name}
          </li>
        ))}
      </ol>

      <div className="wallet-card payment-stage">
        <h3 ref={stepHeading} tabIndex={-1}>{[
          "Revisá el destino", "Elegí el monto", "Construí la transacción", "Firmá en Freighter", "Enviá y confirmá",
        ][step]}</h3>
        {step === 0 && (
          <>
            <p className="muted">La cuenta destino es fija y está dedicada a recibir los pagos de práctica de Baula Stellar.</p>
            {readyDestination ? (
              <>
                <div className="copy-line"><code>{DESTINATION_ADDRESS}</code><TestnetBadge/></div>
                <a className="text-link" href={explorerLink("account", DESTINATION_ADDRESS)} target="_blank" rel="noreferrer">Ver el destino en el explorador <Icon name="external" width="15" height="15"/></a>
                <button className="button button-primary" disabled={busy} onClick={() => void run(async () => { await checkDestination(address); go(1); })}>{busy ? "Verificando…" : "Confirmar destino"} <Icon name="arrow"/></button>
              </>
            ) : (
              <p className="notice notice-warning">Falta configurar el destino. La persona encargada de la app puede generarlo con <code>npm run destino</code> y agregarlo a <code>.env.local</code>.</p>
            )}
          </>
        )}
        {step === 1 && (
          <form className="payment-form" onSubmit={chooseAmount}>
            <p className="muted" id="amount-help">Podés enviar hasta 10 XLM de prueba. Usá hasta siete cifras después de la coma.</p>
            <label htmlFor="payment-amount">Monto en XLM de prueba</label>
            <input id="payment-amount" inputMode="decimal" maxLength={12} aria-describedby="amount-help" value={amount} onChange={(event) => setAmount(event.target.value)}/>
            <div className="action-row"><button className="button button-secondary" type="button" onClick={() => go(0)}>Atrás</button><button className="button button-primary" type="submit">Usar este monto <Icon name="arrow"/></button></div>
          </form>
        )}
        {step === 2 && (
          <>
            <p className="muted">Vamos a preparar el paquete que tu billetera firmará. En este paso se calcula la comisión de red (fee).</p>
            <dl className="payment-summary"><div><dt>Origen</dt><dd><code>{address}</code></dd></div><div><dt>Destino</dt><dd><code>{DESTINATION_ADDRESS}</code></dd></div><div><dt>Monto</dt><dd>{displayDecimal(amount)} XLM de prueba</dd></div></dl>
            <div className="action-row">
              <button className="button button-secondary" disabled={busy} onClick={() => go(1)}>Atrás</button>
              <button className="button button-primary" disabled={busy} onClick={() => void run(async () => {
                setDraft(await buildPayment(address, amount)); setConfirmed(false); go(3);
              })}>{busy ? "Construyendo…" : "Construir transacción"} <Icon name="arrow"/></button>
            </div>
          </>
        )}
        {step === 3 && draft && (
          <>
            <p className="muted">Revisá el resumen. Freighter abrirá su propio cuadro para que autoricés el pago con tu firma.</p>
            <dl className="payment-summary">
              <div><dt>Origen</dt><dd><code>{draft.source}</code></dd></div>
              <div><dt>Destino</dt><dd><code>{draft.destination}</code></dd></div>
              <div><dt>Monto</dt><dd>{displayDecimal(draft.amount)} XLM de prueba</dd></div>
              <div><dt>Comisión de red</dt><dd>{displayDecimal(draft.fee)} XLM de prueba</dd></div>
            </dl>
            <label className="testnet-check">
              <input type="checkbox" checked={confirmed} disabled={busy} onChange={(event) => setConfirmed(event.target.checked)}/>
              <span>Entiendo que esto es Testnet y que estoy enviando monedas de prueba sin valor real</span>
            </label>
            <div className="action-row">
              <button className="button button-secondary" disabled={busy} onClick={rebuild}>Editar monto</button>
              <button className="button button-primary" disabled={!confirmed || busy || restart} onClick={() => {
                if (confirmed) void run(async () => { setSigned(await signPayment(draft)); go(4); });
              }}><Icon name="wallet"/>{busy ? "Esperando firma…" : "Firmar con Freighter"}</button>
            </div>
          </>
        )}
        {step === 4 && draft && (
          <>
            <p className="muted">La firma está lista. Al enviar, Testnet procesará {displayDecimal(draft.amount)} XLM de prueba y devolverá un identificador de confirmación.</p>
            {pending && <a className="text-link" href={explorerLink("tx", draft.hash)} target="_blank" rel="noreferrer">Consultar el hash en Testnet <Icon name="external" width="15" height="15"/></a>}
            {restart ? <button className="button button-primary" onClick={rebuild}>Construir un nuevo pago <Icon name="refresh"/></button> : (
              <button className="button button-primary" disabled={!confirmed || !signed || busy} onClick={() => {
                if (confirmed && signed) void run(async () => onSent(await sendPayment(draft, signed)));
              }}>{busy ? "Confirmando…" : pending ? "Reintentar la misma transacción" : "Enviar pago de prueba"} <Icon name="arrow"/></button>
            )}
          </>
        )}
        {error && <p className="notice notice-error" role="alert">{error}</p>}
      </div>
    </div>
  );
}
