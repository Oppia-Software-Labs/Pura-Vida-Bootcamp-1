import { useVarial } from "../hooks/useVarial.js";

function formatNetworkName(network) {
  if (!network) return "Sin detectar";
  const normalized = network.toUpperCase();
  if (normalized === "TESTNET") return "Stellar Testnet";
  if (normalized === "PUBLIC" || normalized === "MAINNET") {
    return "Stellar Mainnet";
  }
  if (normalized === "FUTURENET") return "Stellar Futurenet";
  return network;
}

export function WalletSection() {
  const {
    connected,
    address,
    network,
    isTestnet,
    connecting,
    error,
    connect,
    disconnect,
  } = useVarial();

  // El balance real en Horizon se integrará en el siguiente paso
  const xlmBalance = null;

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
            connected ? "status-pill--connected" : "status-pill--disconnected"
          }`}
        >
          <span className="status-pill__dot" aria-hidden="true" />
          {connected ? "Conectada" : "Desconectada"}
        </span>
      </div>

      <p className="wallet-card__description">
        Conecta tu wallet de navegador en <strong>Testnet</strong> para ver tu
        llave pública y la red activa mediante <code>@stellar/varial-sdk</code>.
      </p>

      <div className="wallet-card__actions">
        {!connected ? (
          <button
            type="button"
            className="btn-primary"
            onClick={connect}
            disabled={connecting}
          >
            {connecting ? "Conectando..." : "Conectar wallet"}
          </button>
        ) : (
          <button
            type="button"
            className="btn-secondary"
            onClick={disconnect}
          >
            Desconectar wallet
          </button>
        )}
      </div>

      {error && (
        <div className="wallet-alert wallet-alert--error" role="alert">
          {error}
        </div>
      )}

      {connected && !isTestnet && (
        <div className="wallet-alert wallet-alert--warning" role="status">
          Tu wallet está en <strong>{formatNetworkName(network)}</strong>.
          Cambia a <strong>Test Net</strong> en la configuración de Freighter /
          Varial para trabajar en Stellar Testnet.
        </div>
      )}

      <div className="wallet-grid">
        <div className="info-tile info-tile--wide">
          <span className="info-tile__label">Llave pública</span>
          <p className="info-tile__value info-tile__value--mono">
            {address ?? "Sin conectar (G...)"}
          </p>
        </div>

        <div className="info-tile">
          <span className="info-tile__label">Red activa</span>
          <p className="info-tile__value">
            <span
              className={`network-badge ${
                connected && !isTestnet ? "network-badge--warning" : ""
              }`}
            >
              {connected ? formatNetworkName(network) : "Sin conectar"}
            </span>
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
