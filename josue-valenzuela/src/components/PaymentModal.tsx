import React, { useState } from 'react';
import { Project, Applicant } from '../types';
import { X, Send, Coins, User, AlertCircle, CheckCircle2, Loader2, ExternalLink } from 'lucide-react';
import { sendPaymentXlm } from '../services/stellar';

interface PaymentModalProps {
  project: Project;
  applicant: Applicant;
  fromAddress: string;
  onClose: () => void;
  onPaymentSuccess: (projectId: string, applicantId: string, txHash: string) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  project,
  applicant,
  fromAddress,
  onClose,
  onPaymentSuccess
}) => {
  const [amount, setAmount] = useState<string>(project.rewardXlm.toString());
  const [memo, setMemo] = useState<string>(`Pago: ${project.title.slice(0, 15)}`);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successHash, setSuccessHash] = useState<string | null>(null);

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await sendPaymentXlm({
      fromAddress,
      toAddress: applicant.developerAddress,
      amountXlm: amount,
      memo
    });

    setLoading(false);

    if (res.success && res.hash) {
      setSuccessHash(res.hash);
      onPaymentSuccess(project.id, applicant.id, res.hash);
    } else {
      setError(res.error || 'No se pudo completar la transacción.');
    }
  };

  const truncate = (addr: string) => `${addr.slice(0, 8)}...${addr.slice(-8)}`;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content modal-payment" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-header-info">
            <div className="modal-subtitle-badge badge-payout">
              <Coins size={14} /> Liberación de Fondos en Blockchain
            </div>
            <h2 className="modal-title">Pagar Recompensa en XLM</h2>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {successHash ? (
            <div className="payment-success-view">
              <CheckCircle2 size={48} className="text-success" />
              <h3>¡Pago enviado exitosamente!</h3>
              <p>
                Se han transferido <strong>{amount} XLM</strong> a la wallet del desarrollador en Stellar Testnet.
              </p>
              <div className="tx-hash-box">
                <span className="hash-label">Hash de la transacción:</span>
                <code>{successHash}</code>
              </div>
              <a
                href={`https://stellar.expert/explorer/testnet/tx/${successHash}`}
                target="_blank"
                rel="noreferrer"
                className="btn btn-primary"
              >
                Ver en Stellar Expert <ExternalLink size={16} />
              </a>
              <button className="btn btn-secondary mt-2" onClick={onClose}>
                Cerrar
              </button>
            </div>
          ) : (
            <form onSubmit={handlePay} className="payment-form">
              <div className="payment-summary-card">
                <div className="summary-row">
                  <span className="summary-label">Proyecto:</span>
                  <span className="summary-value font-semibold">{project.title}</span>
                </div>
                <div className="summary-row">
                  <span className="summary-label">Desarrollador receptor:</span>
                  <span className="summary-value flex items-center gap-1">
                    <User size={14} /> {applicant.developerName}
                  </span>
                </div>
                <div className="summary-row">
                  <span className="summary-label">Dirección Stellar (Destino):</span>
                  <code className="summary-code">{truncate(applicant.developerAddress)}</code>
                </div>
                <div className="summary-row">
                  <span className="summary-label">Tu Wallet (Origen):</span>
                  <code className="summary-code">{truncate(fromAddress)}</code>
                </div>
              </div>

              <div className="form-group">
                <label>Monto a transferir (XLM)</label>
                <div className="input-with-icon">
                  <Coins size={16} className="input-icon text-stellar" />
                  <input
                    type="number"
                    step="0.0001"
                    min="0.1"
                    className="form-input"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                  />
                </div>
                <span className="input-hint">Red de prueba: Stellar Testnet (sin costo real).</span>
              </div>

              <div className="form-group">
                <label>Memo de la transacción (Opcional, máx 28 caracteres)</label>
                <input
                  type="text"
                  maxLength={28}
                  className="form-input"
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                />
              </div>

              {error && (
                <div className="form-alert error">
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}

              <div className="payment-note">
                <AlertCircle size={16} className="text-cyan flex-shrink-0" />
                <span>
                  Al hacer clic en pagar, Freighter abrirá una ventana para que revises y confirmes la transacción.
                </span>
              </div>

              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 size={16} className="btn-spinner" />
                      Firmando con Freighter...
                    </>
                  ) : (
                    <>
                      <Send size={16} className="btn-icon" />
                      Firmar y Pagar {amount} XLM
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
