import { useVarial } from "../hooks/useVarial.js";
import { useTestnetBalance } from "../hooks/useTestnetBalance.js";

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

function formatXlmBalance(balance) {
  if (balance === null || balance === undefined) return "— XLM";
  const numeric = Number(balance);
  if (Number.isNaN(numeric)) return `${balance} XLM`;
  return `${numeric.toLocaleString("es-CR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 7,
  })} XLM`;
}

export function WalletSection() {
  const {
    connected,
    address,
    network,
    isTestnet,
    connecting,
    error: walletError,
    connect,
    disconnect,
  } = useVarial();

  const {
    balance,
    funded,
    loading: loadingBalance,
    funding,
    error: balanceError,
    refreshBalance,
    fundWithFriendbot,
  } = useTestnetBalance(connected ? address : null);

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
        llave pública, la red activa y tu saldo real de XLM desde{" "}
        <code>Horizon Testnet</code>.
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
          <>
            <button
              type="button"
              className="btn-outline"
              onClick={refreshBalance}
              disabled={loadingBalance || funding}
            >
              {loadingBalance ? "Actualizando..." : "Refrescar balance"}
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={disconnect}
              disabled={funding}
            >
              Desconectar wallet
            </button>
          </>
        )}
      </div>

      {walletError && (
        <div className="wallet-alert wallet-alert--error" role="alert">
          {walletError}
        </div>
      )}

      {balanceError && (
        <div className="wallet-alert wallet-alert--error" role="alert">
          {balanceError}
        </div>
      )}

      {connected && !isTestnet && (
        <div className="wallet-alert wallet-alert--warning" role="status">
          Tu wallet está en <strong>{formatNetworkName(network)}</strong>.
          Cambia a <strong>Test Net</strong> en la configuración de Freighter /
          Varial para operar en Stellar Testnet.
        </div>
      )}

      {connected && !loadingBalance && !funded && (
        <div className="friendbot-banner" role="status">
          <div className="friendbot-banner__text">
            <strong>Cuenta no fondeada en Testnet (404)</strong>
            <p>
              Esta cuenta aún no está activada en Stellar Testnet. Puedes
              fondearla gratis con XLM de prueba usando Friendbot.
            </p>
          </div>
          <button
            type="button"
            className="btn-primary"
            onClick={fundWithFriendbot}
            disabled={funding}
          >
            {funding ? "Fondeando con Friendbot..." : "Fondear con Friendbot"}
          </button>
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
            {!connected
              ? "— XLM"
              : loadingBalance
                ? "Consultando..."
                : !funded
                  ? "0 XLM (sin activar)"
                  : formatXlmBalance(balance)}
          </p>
        </div>
      </div>
    </section>
  );
}
