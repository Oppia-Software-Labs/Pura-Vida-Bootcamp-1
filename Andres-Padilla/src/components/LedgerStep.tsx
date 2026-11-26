"use client";

import { useEffect, useState } from "react";
import { ledgerExplorerUrl, txExplorerUrl, type LedgerInfo } from "@/lib/stellar";
import type { SentTx } from "./TransactionStep";
import styles from "./WalletSteps.module.css";
import l from "./LedgerStep.module.css";

type Props = {
  ledger: LedgerInfo | null;
  error: string;
  lastTx: SentTx | null;
};

/** Segundos desde que se cerró el ledger, actualizados cada segundo. */
function useSecondsSince(iso?: string) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  if (!iso) return null;
  return Math.max(0, Math.round((now - Date.parse(iso)) / 1000));
}

export default function LedgerStep({ ledger, error, lastTx }: Props) {
  const ago = useSecondsSince(ledger?.closedAt);

  return (
    <div className={styles.box}>
      <div className={l.live}>
        <span className={l.dot} aria-hidden />
        <span>Testnet en vivo</span>
      </div>

      {ledger ? (
        <p className={l.current}>
          Último ledger{" "}
          <a href={ledgerExplorerUrl(ledger.sequence)} target="_blank" rel="noreferrer">
            #{ledger.sequence.toLocaleString("es-CR")}
          </a>
          <small>
            {ledger.txCount} transacciones · cerrado hace {ago ?? "…"} s
          </small>
        </p>
      ) : (
        !error && <p className={styles.lead}>Conectando con la red…</p>
      )}
      {error && <p className={styles.error}>{error}</p>}

      {lastTx ? (
        <p className={l.mine}>
          Tu pago quedó en el ledger{" "}
          <a href={ledgerExplorerUrl(lastTx.ledger)} target="_blank" rel="noreferrer">
            #{lastTx.ledger.toLocaleString("es-CR")}
          </a>
          {ledger && ledger.sequence > lastTx.ledger && (
            <> · desde entonces la red ha cerrado {ledger.sequence - lastTx.ledger} más</>
          )}
          .{" "}
          <a href={txExplorerUrl(lastTx.hash)} target="_blank" rel="noreferrer">
            Ver tu transacción
          </a>
        </p>
      ) : (
        <p className={styles.lead}>
          Si envías un pago en el capítulo anterior, aquí verás el ledger exacto que lo confirmó.
        </p>
      )}

      <p className={l.outro}>
        Ya recorriste lo básico de Stellar: blockchain, validadores, cuentas, reserva,
        transacciones y ledgers.
      </p>
    </div>
  );
}
