import { useCallback, useEffect, useState } from "react";
import {
  explorerAccountUrl,
  explorerTxUrl,
  formatAmount,
  loadPayments,
  shortAddress,
  type PaymentRecord,
} from "../lib/stellar";
import {
  AlertIcon,
  ArrowDownLeftIcon,
  ArrowUpRightIcon,
  ExternalIcon,
  RefreshIcon,
  SparkIcon,
} from "./Icons";

interface ActivityListProps {
  address: string;
  refreshKey: number;
}

function paymentTitle(payment: PaymentRecord): string {
  switch (payment.kind) {
    case "received":
      return "Recibiste XLM";
    case "sent":
      return "Enviaste XLM";
    case "created":
      return "Cuenta creada";
  }
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("es-CR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function ActivityList({ address, refreshKey }: ActivityListProps) {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const records = await loadPayments(address);
      setPayments(records);
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "No se pudo cargar la actividad.",
      );
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => {
    let active = true;

    // oxlint-disable-next-line react/set-state-in-effect -- reset UI before the network request
    setLoading(true);
    setError(null);

    loadPayments(address)
      .then((records) => {
        if (active) setPayments(records);
      })
      .catch((loadError: unknown) => {
        if (active) {
          setError(
            loadError instanceof Error
              ? loadError.message
              : "No se pudo cargar la actividad.",
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [address, refreshKey]);

  return (
    <section className="panel activity-panel">
      <div className="panel-head">
        <div>
          <span className="eyebrow eyebrow--dark">
            <SparkIcon size={15} />
            Historial
          </span>
          <h2>Actividad reciente</h2>
        </div>
        <button
          className="icon-button"
          onClick={() => void load()}
          aria-label="Actualizar actividad"
          title="Actualizar actividad"
          disabled={loading}
        >
          <RefreshIcon size={17} className={loading ? "spin" : undefined} />
        </button>
      </div>

      {loading && payments.length === 0 && (
        <div className="activity-skeleton" aria-label="Cargando actividad">
          <span />
          <span />
          <span />
        </div>
      )}

      {error && (
        <p className="inline-message inline-message--error" role="alert">
          <AlertIcon size={17} />
          {error}
        </p>
      )}

      {!loading && !error && payments.length === 0 && (
        <div className="empty-activity">
          <span className="empty-orbit" aria-hidden="true" />
          <strong>Todavía no hay movimientos.</strong>
          <p>Fondea tu cuenta o envía tu primer XLM para verlos aquí.</p>
        </div>
      )}

      {payments.length > 0 && (
        <ul className="activity-list">
          {payments.map((payment) => {
            const incoming = payment.kind === "received";
            const neutral = payment.kind === "created";

            return (
              <li key={payment.id}>
                <span
                  className={`activity-icon ${
                    incoming
                      ? "activity-icon--in"
                      : neutral
                        ? "activity-icon--neutral"
                        : "activity-icon--out"
                  }`}
                  aria-hidden="true"
                >
                  {incoming ? (
                    <ArrowDownLeftIcon size={18} />
                  ) : neutral ? (
                    <SparkIcon size={18} />
                  ) : (
                    <ArrowUpRightIcon size={18} />
                  )}
                </span>

                <div className="activity-main">
                  <strong>{paymentTitle(payment)}</strong>
                  <span>
                    {payment.counterparty
                      ? shortAddress(payment.counterparty, 5)
                      : "—"}{" "}
                    · {formatDate(payment.createdAt)}
                  </span>
                </div>

                <div className="activity-amount">
                  <strong>
                    {incoming || neutral ? "+" : "−"}
                    {formatAmount(payment.amount)} {payment.asset}
                  </strong>
                  <a
                    href={explorerTxUrl(payment.transactionHash)}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="Ver transacción en Stellar Expert"
                  >
                    Ver tx
                    <ExternalIcon size={13} />
                  </a>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <a
        href={explorerAccountUrl(address)}
        target="_blank"
        rel="noreferrer"
        className="panel-link"
      >
        Ver historial completo en Stellar Expert
        <ExternalIcon size={16} />
      </a>
    </section>
  );
}
