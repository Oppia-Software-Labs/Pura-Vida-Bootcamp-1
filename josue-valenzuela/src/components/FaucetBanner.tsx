import React, { useState } from 'react';
import { Droplet, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { fundWithFriendbot } from '../services/stellar';

interface FaucetBannerProps {
  walletAddress: string;
  onFunded: () => void;
}

export const FaucetBanner: React.FC<FaucetBannerProps> = ({ walletAddress, onFunded }) => {
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleFund = async () => {
    setLoading(true);
    setFeedback(null);
    const res = await fundWithFriendbot(walletAddress);
    if (res.success) {
      setFeedback({ type: 'success', message: res.message });
      onFunded();
    } else {
      setFeedback({ type: 'error', message: res.message });
    }
    setLoading(false);
  };

  return (
    <div className="faucet-banner">
      <div className="faucet-content">
        <div className="faucet-icon-badge">
          <Droplet size={20} className="faucet-drop-icon" />
        </div>
        <div className="faucet-info">
          <div className="faucet-title">Stellar Friendbot Testnet Faucet</div>
          <div className="faucet-desc">
            ¿Tu wallet no tiene fondos en Testnet? Recibe <strong>10,000 XLM de prueba</strong> al instante para probar pagos, postulaciones y contratos.
          </div>
        </div>
      </div>

      <div className="faucet-action-area">
        <button
          className="btn btn-faucet"
          onClick={handleFund}
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 size={16} className="btn-spinner" />
              Fondeando cuenta...
            </>
          ) : (
            <>
              <Droplet size={16} className="btn-icon" />
              Solicitar 10,000 XLM
            </>
          )}
        </button>
      </div>

      {feedback && (
        <div className={`faucet-feedback ${feedback.type}`}>
          {feedback.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{feedback.message}</span>
        </div>
      )}
    </div>
  );
};
