import { useId, useRef, useState, type FormEvent } from "react";
import { CheckCircle2, ExternalLink, Lock, Send } from "lucide-react";
import {
  formatXlm,
  getExplorerTxUrl,
  getNetworkConfig,
  isValidStellarAddress,
  shortenAddress,
  type StellarNetworkId,
} from "../lib/stellar";
import {
  buildXlmPaymentXdr,
  parseStellarError,
  submitSignedTransaction,
} from "../lib/transactions";
import { useAccessibleValidation } from "../hooks/useAccessibleValidation";
import type { ConnectionMode } from "../hooks/useStellarWallet";

interface SendPaymentFormProps {
  sourceAddress: string;
  mode: ConnectionMode;
  networkId: StellarNetworkId;
  funded: boolean;
  onSignTransaction: (xdr: string) => Promise<string>;
  onPaymentSuccess: () => Promise<void>;
}

type TxStage = "idle" | "building" | "signing" | "submitting" | "success" | "error";

export function SendPaymentForm({
  sourceAddress,
  mode,
  networkId,
  funded,
  onSignTransaction,
  onPaymentSuccess,
}: SendPaymentFormProps) {
  const formRef = useRef<HTMLFormElement | null>(null);
  useAccessibleValidation(formRef);

  const [destination, setDestination] = useState("");
  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("");
  const [stage, setStage] = useState<TxStage>("idle");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const destId = useId();
  const destHintId = useId();
  const destErrorId = useId();
  const amountId = useId();
  const amountHintId = useId();
  const amountErrorId = useId();
  const memoId = useId();
  const memoHintId = useId();

  const networkConfig = getNetworkConfig(networkId);
  const isProcessing =
    stage === "building" || stage === "signing" || stage === "submitting";
  const canSign = mode === "wallet" && funded;
  const previewReady =
    isValidStellarAddress(destination) &&
    Number.isFinite(Number(amount)) &&
    Number(amount) > 0;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSign || isProcessing) return;

    const form = event.currentTarget;
    if (!form.checkValidity()) {
      const firstInvalid = form.querySelector<HTMLElement>(":invalid");
      firstInvalid?.focus();
      return;
    }

    setTxHash(null);
    setStage("building");
    setStatusMessage(`1/3 · Construyendo transacción en ${networkConfig.label}…`);

    try {
      const unsignedXdr = await buildXlmPaymentXdr({
        sourceAddress,
        destinationAddress: destination,
        amountXlm: amount,
        memo,
        networkId,
      });

      setStage("signing");
      setStatusMessage("2/3 · Confirma y firma la transacción en tu wallet…");
      const signedXdr = await onSignTransaction(unsignedXdr);

      setStage("submitting");
      setStatusMessage(`3/3 · Enviando transacción firmada a ${networkConfig.label}…`);
      const result = await submitSignedTransaction(signedXdr, networkId);

      setTxHash(result.hash);
      setStage("success");
      setStatusMessage(`Pago confirmado en el ledger #${result.ledger}.`);
      setAmount("");
      setMemo("");
      form.reset();
      await onPaymentSuccess();
    } catch (err) {
      setStage("error");
      setStatusMessage(parseStellarError(err, networkId));
    }
  };

  return (
    <section className="card" aria-labelledby="send-payment-heading">
      <div className="section-header">
        <div>
          <span className="eyebrow">Paso 3 · Operación clásica</span>
          <h2 id="send-payment-heading">
            Enviar Pago en XLM ({networkConfig.shortLabel})
          </h2>
        </div>
      </div>

      {mode !== "wallet" && (
        <div className="alert alert-info" role="status">
          <Lock size={16} aria-hidden="true" />
          <span>
            Estás en modo solo lectura. Conecta tu wallet de Stellar en el Paso 1 para firmar y
            enviar pagos en {networkConfig.shortLabel}.
          </span>
        </div>
      )}

      {mode === "wallet" && !funded && (
        <div className="alert alert-info" role="status">
          {networkId === "testnet"
            ? "Fondea tu cuenta primero con Friendbot en el Paso 2 para poder enviar pagos."
            : "Esta cuenta aún no tiene saldo en Mainnet. Cambia a Testnet para probar gratis con Friendbot."}
        </div>
      )}

      <form ref={formRef} className="payment-form" onSubmit={handleSubmit} noValidate>
        <div className="field">
          <label htmlFor={destId}>Dirección destino</label>
          <span id={destHintId} className="hint">
            Llave pública Stellar de 56 caracteres que comienza con <code>G</code>.
          </span>
          <input
            id={destId}
            name="destination"
            type="text"
            required
            pattern="^G[A-Z2-7]{55}$"
            value={destination}
            onChange={(e) => setDestination(e.target.value.trim().toUpperCase())}
            placeholder="GXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
            aria-describedby={destHintId}
            data-error={destErrorId}
            disabled={!canSign || isProcessing}
            spellCheck={false}
            autoComplete="off"
          />
          <div id={destErrorId} className="error-msg">
            <span role="img" aria-label="Error">
              ✕
            </span>{" "}
            Ingresa una dirección Stellar válida de 56 caracteres iniciando con G.
          </div>
        </div>

        <div className="field-grid">
          <div className="field">
            <label htmlFor={amountId}>Monto (XLM)</label>
            <span id={amountHintId} className="hint">
              Ejemplo: 10 o 2.5 XLM
            </span>
            <input
              id={amountId}
              name="amount"
              type="number"
              required
              min="0.0000001"
              step="any"
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="10"
              aria-describedby={amountHintId}
              data-error={amountErrorId}
              disabled={!canSign || isProcessing}
            />
            <div id={amountErrorId} className="error-msg">
              <span role="img" aria-label="Error">
                ✕
              </span>{" "}
              Ingresa un monto numérico mayor que 0 XLM.
            </div>
          </div>

          <div className="field">
            <label htmlFor={memoId}>Memo (opcional)</label>
            <span id={memoHintId} className="hint">
              Texto corto de referencia (máx. 28 caracteres).
            </span>
            <input
              id={memoId}
              name="memo"
              type="text"
              maxLength={28}
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="Pura Vida Bootcamp"
              aria-describedby={memoHintId}
              disabled={!canSign || isProcessing}
            />
          </div>
        </div>

        {previewReady && canSign && (
          <div className="tx-preview" aria-label="Resumen antes de firmar">
            <p className="tx-preview-title">
              Resumen previo a la firma ({networkConfig.label})
            </p>
            <dl>
              <div>
                <dt>Destino</dt>
                <dd className="mono">{shortenAddress(destination, 8, 8)}</dd>
              </div>
              <div>
                <dt>Monto</dt>
                <dd>
                  <strong>{formatXlm(amount)} XLM</strong>
                </dd>
              </div>
              <div>
                <dt>Comisión base</dt>
                <dd>0.00001 XLM (100 stroops)</dd>
              </div>
            </dl>
          </div>
        )}

        <button
          type="submit"
          className="btn btn-primary btn-full"
          disabled={!canSign || isProcessing}
          aria-busy={isProcessing}
        >
          <Send size={17} aria-hidden="true" />
          {isProcessing
            ? "Procesando transacción…"
            : networkId === "mainnet"
              ? "Firmar y Enviar XLM (Mainnet)"
              : "Firmar y Enviar XLM"}
        </button>

        {statusMessage && (
          <div
            className={`alert ${
              stage === "error"
                ? "alert-error"
                : stage === "success"
                  ? "alert-success"
                  : "alert-info"
            }`}
            role={stage === "error" ? "alert" : "status"}
          >
            <div className="status-stack">
              <div className="status-line">
                {stage === "success" && (
                  <CheckCircle2 size={16} aria-hidden="true" />
                )}
                <span>{statusMessage}</span>
              </div>
              {txHash && (
                <div className="tx-hash-row">
                  <code className="mono">{shortenAddress(txHash, 10, 10)}</code>
                  <a
                    href={getExplorerTxUrl(txHash, networkId)}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-link"
                  >
                    Ver en Stellar Expert
                    <ExternalLink size={13} aria-hidden="true" />
                  </a>
                </div>
              )}
            </div>
          </div>
        )}
      </form>
    </section>
  );
}
