"use client";

import { useState, type FormEvent } from "react";
import { signTransaction } from "@stellar/varial-sdk";
import {
  NETWORK_PASSPHRASE,
  buildPaymentXdr,
  describeTxError,
  formatXlm,
  randomTestAddress,
  submitSignedXdr,
  txExplorerUrl,
  validatePayment,
} from "@/lib/stellar";
import type { Engine } from "@/three/engine";
import type { Balance, Wallet } from "@/wallet/useWallet";
import styles from "./WalletSteps.module.css";
import tx from "./TransactionStep.module.css";

export type SentTx = { hash: string; ledger: number; amount: string; to: string };

type Phase = "idle" | "building" | "signing" | "sending" | "done";

const STEPS: { id: Exclude<Phase, "idle">; label: string }[] = [
  { id: "building", label: "Construir la transacción" },
  { id: "signing", label: "Firmarla en Varial" },
  { id: "sending", label: "Confirmarla en un ledger" },
  { id: "done", label: "Llegada al destino" },
];

type Props = {
  engine: Engine | null;
  wallet: Wallet;
  balance: Balance;
  dest: string;
  setDest: (address: string) => void;
  destBalance: Balance;
  lastTx: SentTx | null;
  onSent: (tx: SentTx) => void;
};

export default function TransactionStep({
  engine,
  wallet,
  balance,
  dest,
  setDest,
  destBalance,
  lastTx,
  onSent,
}: Props) {
  const [to, setTo] = useState(dest);
  const [amount, setAmount] = useState("10");
  const [memo, setMemo] = useState("Hola desde la galaxia");
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState("");

  if (!wallet.connected) {
    return (
      <div className={styles.box}>
        <p className={styles.lead}>Conecta tu wallet en el capítulo 3 para enviar un pago.</p>
      </div>
    );
  }
  if (typeof balance.balance !== "string") {
    return (
      <div className={styles.box}>
        <p className={styles.lead}>
          Tu cuenta necesita fondos para enviar XLM. Pídelos a Friendbot en el capítulo 4.
        </p>
      </div>
    );
  }

  const busy = phase === "building" || phase === "signing" || phase === "sending";
  const wrongNetwork = wallet.network !== "TESTNET";

  function changeTo(value: string) {
    setTo(value);
    const v = value.trim();
    // La estrella de destino aparece en cuanto la dirección es válida
    setDest(validatePayment(wallet.address, v, "1", "") ? "" : v);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    const recipient = to.trim();
    const value = amount.trim();
    const invalid = validatePayment(wallet.address, recipient, value, memo);
    if (invalid) {
      setError(invalid);
      return;
    }

    let launched = false;
    try {
      setPhase("building");
      const xdr = await buildPaymentXdr(wallet.address, recipient, value, memo);

      setPhase("signing");
      const signed = await signTransaction(xdr, {
        networkPassphrase: NETWORK_PASSPHRASE,
        address: wallet.address,
      });
      if (signed.error) {
        setError("La firma fue cancelada o falló en Varial.");
        setPhase("idle");
        return;
      }

      // Firmada: la esfera sale hacia el destino mientras la red la confirma
      setPhase("sending");
      engine?.startPayment(() => {
        setPhase("done");
        destBalance.refresh();
      });
      launched = true;
      const result = await submitSignedXdr(signed.signedTxXdr);
      engine?.resolvePayment(true);
      balance.refresh();
      onSent({ ...result, amount: value, to: recipient });
      if (!engine) setPhase("done");
    } catch (err) {
      if (launched) engine?.resolvePayment(false);
      setError(describeTxError(err));
      setPhase("idle");
    }
  }

  const currentStep = STEPS.findIndex((s) => s.id === phase);
  const destNew = dest && destBalance.balance === null;

  return (
    <form className={styles.box} onSubmit={handleSubmit}>
      <p className={styles.lead}>
        Tienes <b>{formatXlm(balance.balance)} XLM</b>. Elige a quién enviar:
      </p>

      <label className={tx.field}>
        <span>Destino (clave pública)</span>
        <input
          className={tx.input}
          placeholder="G…"
          value={to}
          onChange={(e) => changeTo(e.target.value)}
          spellCheck={false}
          autoComplete="off"
          disabled={busy}
        />
      </label>
      <button
        type="button"
        className={styles.link}
        onClick={() => changeTo(randomTestAddress())}
        disabled={busy}
      >
        Usar una cuenta de prueba nueva
      </button>
      {destNew && (
        <small className={tx.note}>
          Esta cuenta aún no existe: tu pago la creará (hay que enviar al menos 1 XLM).
        </small>
      )}

      <div className={tx.row}>
        <label className={tx.field}>
          <span>Monto (XLM)</span>
          <input
            className={tx.input}
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={busy}
          />
        </label>
        <label className={tx.field}>
          <span>Memo (opcional)</span>
          <input
            className={tx.input}
            maxLength={28}
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            disabled={busy}
          />
        </label>
      </div>

      <button className={styles.primary} type="submit" disabled={busy || wrongNetwork}>
        {busy ? "Enviando…" : "Firmar y enviar"}
      </button>
      {wrongNetwork && <p className={styles.warn}>⚠️ Cambia Varial a Testnet para enviar.</p>}

      {phase !== "idle" && (
        <ol className={tx.steps}>
          {STEPS.map((s, i) => (
            <li
              key={s.id}
              className={i < currentStep ? tx.done : i === currentStep ? (phase === "done" ? tx.done : tx.now) : ""}
            >
              {s.label}
            </li>
          ))}
        </ol>
      )}

      {error && <p className={styles.error}>{error}</p>}

      {lastTx && phase !== "building" && phase !== "signing" && (
        <p className={tx.success}>
          ✅ Enviaste {formatXlm(lastTx.amount)} XLM, confirmados en el ledger #{lastTx.ledger}.{" "}
          <a href={txExplorerUrl(lastTx.hash)} target="_blank" rel="noreferrer">
            Ver transacción
          </a>
        </p>
      )}
    </form>
  );
}
