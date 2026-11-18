import { useState } from "react";

export function WalletSection() {
  const [notice, setNotice] = useState("");

  // Estado base (sin conexión real con Freighter / Varial todavía)
  const isConnected = false;
  const publicKey = null;
  const activeNetwork = "Stellar Testnet";
  const xlmBalance = null;

  const handleConnectClick = () => {
    setNotice(
      "Interfaz base lista. La conexión real con Freighter (@stellar/varial-sdk) se integrará en el siguiente paso."
    );
  };

  return (
    <section className="wallet-card" aria-labelledby="wallet-section-title">
      <div className="wallet-card__header">
        <div>
          <span className="eyebrow">Wallet de Stellar</span>
          <h2 id="wallet-section-title" className="wallet-card__title">
            Conexión con Freighter / Varial
          </h2>
        </div>

        <span
          className={`status-pill ${
            isConnected ? "status-pill--connected" : "status-pill--disconnected"
          }`}
        >
          <span className="status-pill__dot" aria-hidden="true" />
          {isConnected ? "Conectada" : "Desconectada"}
        </span>
      </div>

      <p className="wallet-card__description">
        Conecta tu wallet de navegador en <strong>Testnet</strong> para
        consultar tu cuenta y firmar transacciones en la red de pruebas de
        Stellar.
      </p>

      <div className="wallet-card__actions">
        <button
          type="button"
          className="btn-primary"
          onClick={handleConnectClick}
        >
          Conectar wallet
        </button>
      </div>

      {notice && (
        <div className="wallet-notice" role="status" aria-live="polite">
          {notice}
        </div>
      )}

      <div className="wallet-grid">
        <div className="info-tile info-tile--wide">
          <span className="info-tile__label">Llave pública</span>
          <p className="info-tile__value info-tile__value--mono">
            {publicKey ?? "Sin conectar (G...)"}
          </p>
        </div>

        <div className="info-tile">
          <span className="info-tile__label">Red activa</span>
          <p className="info-tile__value">
            <span className="network-badge">{activeNetwork}</span>
          </p>
        </div>

        <div className="info-tile">
          <span className="info-tile__label">Balance en Testnet</span>
          <p className="info-tile__value info-tile__value--balance">
            {xlmBalance !== null ? `${xlmBalance} XLM` : "— XLM"}
          </p>
        </div>
      </div>
    </section>
  );
}
