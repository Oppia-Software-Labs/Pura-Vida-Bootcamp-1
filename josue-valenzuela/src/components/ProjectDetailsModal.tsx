import React, { useState } from 'react';
import { Project, Applicant } from '../types';
import { X, MapPin, Coins, CheckCircle, Send, Wallet, ShieldCheck, User, ExternalLink, CreditCard } from 'lucide-react';

interface ProjectDetailsModalProps {
  project: Project;
  onClose: () => void;
  walletAddress: string | null;
  onApply: (projectId: string, applicant: Omit<Applicant, 'id' | 'appliedAt' | 'status'>) => void;
  onInitiatePayment: (project: Project, applicant: Applicant) => void;
  isOwner: boolean;
}

export const ProjectDetailsModal: React.FC<ProjectDetailsModalProps> = ({
  project,
  onClose,
  walletAddress,
  onApply,
  onInitiatePayment,
  isOwner
}) => {
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [proposal, setProposal] = useState('');
  const [portfolio, setPortfolio] = useState('');
  const [appliedSuccess, setAppliedSuccess] = useState(false);

  const hasAlreadyApplied = walletAddress
    ? project.applicants.some((a) => a.developerAddress.toLowerCase() === walletAddress.toLowerCase())
    : false;

  const handleSubmitApplication = (e: React.FormEvent) => {
    e.preventDefault();
    if (!walletAddress) return;
    if (!name.trim() || !proposal.trim()) return;

    onApply(project.id, {
      developerAddress: walletAddress,
      developerName: name.trim(),
      developerContact: contact.trim(),
      proposal: proposal.trim(),
      portfolioUrl: portfolio.trim() || undefined
    });

    setAppliedSuccess(true);
  };

  const truncate = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-6)}`;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <div className="modal-header-info">
            <div className="company-badge-row">
              <span className="country-flag">{project.countryFlag}</span>
              <span className="modal-company">{project.company}</span>
              <span className="dot-divider">•</span>
              <span className="modal-location">
                <MapPin size={12} /> {project.location}
              </span>
              <span className="badge badge-bounty">{project.type}</span>
            </div>
            <h2 className="modal-title">{project.title}</h2>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          {/* Reward and Publisher Banner */}
          <div className="modal-reward-box">
            <div className="reward-details">
              <div className="reward-label">Recompensa total garantizada</div>
              <div className="reward-big-amount">
                <Coins size={24} className="text-stellar" />
                <span>{project.rewardXlm.toLocaleString()}</span>
                <span className="reward-currency">XLM</span>
              </div>
              <div className="reward-subtext">Pagadero directamente en Stellar Testnet</div>
            </div>
            <div className="publisher-meta">
              <div className="meta-label">Publicado por (Escrow/Empresa)</div>
              <div className="publisher-address" title={project.publisherAddress}>
                {truncate(project.publisherAddress)}
              </div>
              <a
                href={`https://stellar.expert/explorer/testnet/account/${project.publisherAddress}`}
                target="_blank"
                rel="noreferrer"
                className="explorer-link"
              >
                Ver en explorador <ExternalLink size={12} />
              </a>
            </div>
          </div>

          {/* Description */}
          <div className="modal-section">
            <h3 className="section-title">Descripción del Proyecto</h3>
            <p className="modal-desc-text">{project.description}</p>
          </div>

          {/* Requirements */}
          <div className="modal-section">
            <h3 className="section-title">Requisitos Técnicos</h3>
            <ul className="requirements-list">
              {project.requirements.map((req, i) => (
                <li key={i}>
                  <ShieldCheck size={16} className="text-cyan req-check-icon" />
                  <span>{req}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Applicants List */}
          <div className="modal-section">
            <div className="section-header-row">
              <h3 className="section-title">Postulaciones ({project.applicants.length})</h3>
              {isOwner && <span className="owner-tag">Modo Empleador: Puedes aprobar y pagar</span>}
            </div>

            {project.applicants.length === 0 ? (
              <div className="empty-applicants">
                Aún no hay postulaciones registradas. ¡Sé el primero en aplicar!
              </div>
            ) : (
              <div className="applicants-list">
                {project.applicants.map((applicant) => (
                  <div key={applicant.id} className="applicant-card">
                    <div className="applicant-header">
                      <div className="applicant-avatar">
                        <User size={18} />
                      </div>
                      <div className="applicant-main-info">
                        <div className="applicant-name">{applicant.developerName}</div>
                        <div className="applicant-wallet" title={applicant.developerAddress}>
                          Stellar: {truncate(applicant.developerAddress)}
                        </div>
                      </div>
                      <div className="applicant-status-badge">
                        {applicant.status === 'paid' ? (
                          <span className="badge badge-paid">
                            <CheckCircle size={12} /> Pagado ({project.rewardXlm} XLM)
                          </span>
                        ) : applicant.status === 'accepted' ? (
                          <span className="badge badge-accepted">Aceptado</span>
                        ) : (
                          <span className="badge badge-pending">En revisión</span>
                        )}
                      </div>
                    </div>

                    <div className="applicant-proposal">{applicant.proposal}</div>

                    {applicant.txHash && (
                      <div className="tx-receipt">
                        <span>Recibo de pago en Blockchain:</span>
                        <a
                          href={`https://stellar.expert/explorer/testnet/tx/${applicant.txHash}`}
                          target="_blank"
                          rel="noreferrer"
                          className="tx-hash-link"
                        >
                          {applicant.txHash.slice(0, 14)}... <ExternalLink size={12} />
                        </a>
                      </div>
                    )}

                    {/* Pay Button for project owner or testing */}
                    {applicant.status !== 'paid' && (
                      <div className="applicant-actions">
                        <button
                          className="btn btn-pay-dev"
                          onClick={() => onInitiatePayment(project, applicant)}
                        >
                          <CreditCard size={14} className="btn-icon" />
                          Liberar Recompensa ({project.rewardXlm} XLM) a este Dev
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Application Form */}
          <div className="modal-section application-form-section">
            <h3 className="section-title">Postularme como Desarrollador</h3>

            {!walletAddress ? (
              <div className="connect-prompt-box">
                <Wallet size={24} className="text-stellar" />
                <div>
                  <div className="prompt-title">Conecta tu Wallet para postularte</div>
                  <div className="prompt-desc">
                    Tu dirección de Stellar servirá como tu identidad y será donde recibas la remuneración en XLM al completar el entregable.
                  </div>
                </div>
              </div>
            ) : hasAlreadyApplied || appliedSuccess ? (
              <div className="already-applied-box">
                <CheckCircle size={22} className="text-success" />
                <div>
                  <div className="applied-title">¡Ya te has postulado a este proyecto!</div>
                  <div className="applied-desc">
                    El empleador revisará tu propuesta y podrá contactarte o liberar el pago directamente a tu wallet ({truncate(walletAddress)}).
                  </div>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmitApplication} className="application-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>Tu Nombre o Alias</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Ej. Josué Valenzuela"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Contacto (Email, Discord o Telegram)</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Ej. josue@ejemplo.com o @josh"
                      value={contact}
                      onChange={(e) => setContact(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Propuesta / ¿Por qué eres el dev ideal para este proyecto?</label>
                  <textarea
                    className="form-textarea"
                    rows={3}
                    placeholder="Describe tu experiencia relevante con Soroban/Stellar, tiempo estimado de entrega y metodología..."
                    value={proposal}
                    onChange={(e) => setProposal(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Enlace a GitHub o Portafolio Web3 (Opcional)</label>
                  <input
                    type="url"
                    className="form-input"
                    placeholder="https://github.com/tu-usuario"
                    value={portfolio}
                    onChange={(e) => setPortfolio(e.target.value)}
                  />
                </div>

                <div className="form-actions">
                  <button type="submit" className="btn btn-primary btn-submit-app">
                    <Send size={16} className="btn-icon" />
                    Enviar Postulación con mi Wallet ({truncate(walletAddress)})
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
