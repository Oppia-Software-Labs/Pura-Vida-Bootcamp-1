import { useId } from "react";
import { ArrowDownLeft, ArrowUpRight, ExternalLink, History } from "lucide-react";
import {
  formatXlm,
  getExplorerTxUrl,
  shortenAddress,
  type PaymentRecord,
} from "../lib/stellar";

interface PaymentsTableProps {
  payments: PaymentRecord[];
  loading: boolean;
  funded: boolean;
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("es-CR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function getOperationLabel(payment: PaymentRecord): string {
  if (payment.type === "create_account") {
    return payment.direction === "in" ? "Cuenta creada" : "Creó cuenta";
  }
  if (payment.direction === "self") return "Auto-pago";
  return payment.direction === "in" ? "Recibido" : "Enviado";
}

export function PaymentsTable({ payments, loading, funded }: PaymentsTableProps) {
  const captionId = useId();

  return (
    <section className="card" aria-labelledby="history-heading">
      <div className="section-header">
        <div>
          <span className="eyebrow">Paso 4 · Actividad reciente</span>
          <h2 id="history-heading">Historial de Pagos</h2>
        </div>
        <span className="badge badge-info">
          <History size={14} aria-hidden="true" />
          Últimos 10 movimientos
        </span>
      </div>

      {!funded ? (
        <p className="muted">
          Una vez que la cuenta esté activa en Stellar Testnet, aquí aparecerán tus pagos y
          fondeos recientes.
        </p>
      ) : loading && payments.length === 0 ? (
        <p className="muted">Consultando operaciones recientes en Horizon…</p>
      ) : payments.length === 0 ? (
        <p className="muted">No se encontraron pagos registrados para esta cuenta.</p>
      ) : (
        <div
          tabIndex={0}
          role="region"
          aria-labelledby={captionId}
          className="table-wrapper"
        >
          <table className="payments-table">
            <caption id={captionId} className="visually-hidden">
              Historial de los últimos pagos en Stellar Testnet
            </caption>
            <thead>
              <tr>
                <th scope="col">Tipo</th>
                <th scope="col">Monto</th>
                <th scope="col">Contraparte</th>
                <th scope="col">Fecha</th>
                <th scope="col">Transacción</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr key={payment.id}>
                  <th scope="row">
                    <span
                      className={`direction-pill ${
                        payment.direction === "in" ? "is-in" : "is-out"
                      }`}
                    >
                      {payment.direction === "in" ? (
                        <ArrowDownLeft size={14} aria-hidden="true" />
                      ) : (
                        <ArrowUpRight size={14} aria-hidden="true" />
                      )}
                      {getOperationLabel(payment)}
                    </span>
                  </th>
                  <td className="mono">
                    {payment.direction === "in" ? "+" : "-"}
                    {formatXlm(payment.amount)} {payment.assetCode}
                  </td>
                  <td className="mono" title={payment.counterparty}>
                    {shortenAddress(payment.counterparty, 6, 6)}
                  </td>
                  <td>{formatDate(payment.createdAt)}</td>
                  <td>
                    <a
                      href={getExplorerTxUrl(payment.transactionHash)}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-link"
                    >
                      {shortenAddress(payment.transactionHash, 6, 4)}
                      <ExternalLink size={13} aria-hidden="true" />
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
