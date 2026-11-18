import { useState } from "react";
import {
  buildPaymentXdr,
  explorerTxUrl,
  formatAmount,
  shortAddress,
  submitSignedXdr,
  validatePayment,
} from "../lib/stellar";
import {
  AlertIcon,
  ArrowUpRightIcon,
  CheckIcon,
  ExternalIcon,
  SendIcon,
} from "./Icons";

interface PaymentFormProps {
  address: string;
  nativeBalance: string;
  signTransaction: (xdr: string) => Promise<string>;
  onSubmitted: (hash: string) => void;
}

type Phase =
  | "idle"
  | "building"
  | "signing"
  | "submitting"
  | "success"
  | "error";

function describePaymentError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  const normalized = message.toLowerCase();

  if (
    normalized.includes("reject") ||
    normalized.includes("cancel") ||
    normalized.includes("denied") ||
    normalized.includes("declined")
  ) {
    return "Cancelaste la firma en tu wallet. No se envió nada.";
  }

  if (normalized.includes("insufficient") || normalized.includes("underfunded")) {
    return "Saldo insuficiente para enviar ese monto más la comisión de red.";
  }

  if (normalized.includes("bad_seq") || normalized.includes("sequence")) {
    return "La cuenta cambió mientras preparábamos el pago. Intenta de nuevo.";
  }

  if (normalized.includes("timeout") || normalized.includes("expired")) {
    return "La transacción expiró antes de firmarse. Intenta de nuevo.";
  }

  const horizonError = error as {
    response?: {
      data?: {
        extras?: {
          result_codes?: { transaction?: string; operations?: string[] };
        };
      };
    };
  };
  const codes = horizonError.response?.data?.extras?.result_codes;

  if (codes?.transaction === "tx_insufficient_fee") {
    return "La comisión de red quedó corta. Intenta de nuevo.";
  }
  if (codes?.transaction === "tx_bad_seq") {
    return "La secuencia de la cuenta cambió. Actualiza y vuelve a intentar.";
  }
  if (codes?.operations?.includes("op_no_destination")) {
    return "La cuenta de destino no existe todavía en Testnet.";
  }
  if (codes?.operations?.includes("op_underfunded")) {
    return "Saldo insuficiente para completar el pago.";
  }

  return message || "No se pudo enviar el pago. Intenta de nuevo.";
}

const QUICK_AMOUNTS = ["10", "100", "1000"];

export function PaymentForm({
  address,
  nativeBalance,
  signTransaction,
  onSubmitted,
}: PaymentFormProps) {
  const [destination, setDestination] = useState("");
  const [amount, setAmount] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [message, setMessage] = useState<string | null>(null);
  const [hash, setHash] = useState<string | null>(null);

  const busy =
    phase === "building" || phase === "signing" || phase === "submitting";

  const previewError =
    destination || amount
      ? validatePayment(destination, amount, nativeBalance)
      : null;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;

    const validationError = validatePayment(
      destination,
      amount,
      nativeBalance,
    );

    if (validationError) {
      setPhase("error");
      setMessage(validationError);
      return;
    }

    setPhase("building");
    setMessage("Construyendo la transacción…");
    setHash(null);

    try {
      const xdr = await buildPaymentXdr(address, destination, amount);

      setPhase("signing");
      setMessage("Revisa y firma en tu wallet…");
      const signedXdr = await signTransaction(xdr);

      setPhase("submitting");
      setMessage("Enviando a Horizon…");
      const result = await submitSignedXdr(signedXdr);

      setPhase("success");
      setHash(result.hash);
      setMessage(
        `Pago confirmado en el ledger ${result.ledger.toLocaleString("es-CR")}.`,
      );
      setDestination("");
      setAmount("");
      onSubmitted(result.hash);
    } catch (paymentError) {
      setPhase("error");
      setMessage(describePaymentError(paymentError));
    }
  }

  function reset() {
    setPhase("idle");
    setMessage(null);
    setHash(null);
  }

  return (
    <section className="panel payment-panel" id="panel">
      <div className="panel-head">
        <div>
          <span className="eyebrow eyebrow--dark">
            <SendIcon size={15} />
            Enviar XLM
          </span>
          <h2>Mueve fondos de prueba</h2>
        </div>
        <span className="network-chip">Testnet</span>
      </div>

      <form className="payment-form" onSubmit={handleSubmit}>
        <label className="field">
          <span className="field-label">Dirección de destino</span>
          <input
            type="text"
            value={destination}
            onChange={(event) => {
              setDestination(event.target.value);
              if (phase === "error" || phase === "success") reset();
            }}
            placeholder="G… dirección pública de Stellar"
            autoComplete="off"
            spellCheck={false}
            disabled={busy}
          />
        </label>

        <label className="field">
          <span className="field-label">Monto</span>
          <div className="amount-input">
            <input
              type="text"
              inputMode="decimal"
              value={amount}
              onChange={(event) => {
                setAmount(event.target.value);
                if (phase === "error" || phase === "success") reset();
              }}
              placeholder="0.00"
              autoComplete="off"
              disabled={busy}
            />
            <span>XLM</span>
          </div>
          <div className="quick-amounts">
            {QUICK_AMOUNTS.map((quickAmount) => (
              <button
                key={quickAmount}
                type="button"
                onClick={() => {
                  setAmount(quickAmount);
                  if (phase === "error" || phase === "success") reset();
                }}
                disabled={busy}
              >
                {quickAmount} XLM
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                const max = Math.max(Number(nativeBalance) - 0.00001, 0);
                setAmount(max > 0 ? max.toFixed(5) : "");
                if (phase === "error" || phase === "success") reset();
              }}
              disabled={busy}
            >
              Máx
            </button>
          </div>
        </label>

        {destination && amount && !previewError && (
          <div className="tx-review">
            <ArrowUpRightIcon size={18} />
            <span>
              Enviarás <strong>{formatAmount(amount)} XLM</strong> a{" "}
              <strong>{shortAddress(destination.trim(), 6)}</strong>.
            </span>
          </div>
        )}

        {previewError && (destination || amount) && phase === "idle" && (
          <p className="field-hint field-hint--warn">
            <AlertIcon size={15} />
            {previewError}
          </p>
        )}

        <button
          type="submit"
          className="btn btn--dark btn--wide"
          disabled={busy || Boolean(previewError)}
        >
          {busy ? (
            <span className="spinner" aria-hidden="true" />
          ) : (
            <SendIcon size={18} />
          )}
          {phase === "building" && "Construyendo…"}
          {phase === "signing" && "Esperando firma…"}
          {phase === "submitting" && "Enviando…"}
          {!busy && "Enviar XLM"}
        </button>
      </form>

      {message && (
        <div
          className={`tx-status tx-status--${phase}`}
          role="status"
          aria-live="polite"
        >
          {phase === "success" ? (
            <CheckIcon size={19} />
          ) : phase === "error" ? (
            <AlertIcon size={19} />
          ) : (
            <span className="spinner" aria-hidden="true" />
          )}
          <div>
            <p>{message}</p>
            {hash && (
              <a
                href={explorerTxUrl(hash)}
                target="_blank"
                rel="noreferrer"
                className="tx-link"
              >
                Ver transacción en Stellar Expert
                <ExternalIcon size={15} />
              </a>
            )}
          </div>
        </div>
      )}

      <p className="panel-footnote">
        Solo Testnet. Cada pago paga una comisión mínima de red en XLM.
      </p>
    </section>
  );
}
