import { useId, useState, type FormEvent } from "react";
import {
  AlertTriangle,
  Check,
  Copy,
  ExternalLink,
  Eye,
  LogOut,
  ShieldCheck,
  Sparkles,
  User,
  Wallet,
} from "lucide-react";
import {
  getExplorerAccountUrl,
  getNetworkConfig,
  shortenAddress,
  type StellarNetworkId,
} from "../lib/stellar";
import type { ConnectionMode } from "../hooks/useStellarWallet";

interface WalletSectionProps {
  address: string | null;
  mode: ConnectionMode;
  walletName: string | null;
  networkId: StellarNetworkId;
  isConnecting: boolean;
  error: string | null;
  onChangeNetwork: (networkId: StellarNetworkId) => void;
  onConnect: () => Promise<void>;
  onDisconnect: () => Promise<void>;
  onConnectWatch: (publicKey: string) => void;
  onGenerateDemo: () => string;
  onOpenProfile: () => Promise<void>;
  onClearError: () => void;
}

export function WalletSection({
  address,
  mode,
  walletName,
  networkId,
  isConnecting,
  error,
  onChangeNetwork,
  onConnect,
  onDisconnect,
  onConnectWatch,
  onGenerateDemo,
  onOpenProfile,
  onClearError,
}: WalletSectionProps) {
  const [watchInput, setWatchInput] = useState("");
  const [copied, setCopied] = useState(false);
  const [showWatchForm, setShowWatchForm] = useState(false);
  const watchInputId = useId();
  const watchHintId = useId();
  const networkConfig = getNetworkConfig(networkId);

  const handleCopy = async () => {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignore clipboard failures in restricted contexts
    }
  };

  const handleWatchSubmit = (event: FormEvent) => {
    event.preventDefault();
    onConnectWatch(watchInput);
  };

  return (
    <section className="card wallet-card" aria-labelledby="wallet-section-heading">
      <div className="section-header">
        <div>
          <span className="eyebrow">Paso 1 · Conexión</span>
          <h2 id="wallet-section-heading">Conecta tu Wallet de Stellar</h2>
        </div>

        <div className="network-controls">
          <div
            className="network-switch"
            role="group"
            aria-label="Seleccionar red de Stellar"
          >
            <button
              type="button"
              className={`network-btn ${networkId === "testnet" ? "is-active" : ""}`}
              aria-pressed={networkId === "testnet"}
              onClick={() => onChangeNetwork("testnet")}
            >
              <span className="status-dot" aria-hidden="true" />
              Testnet
            </button>
            <button
              type="button"
              className={`network-btn ${
                networkId === "mainnet" ? "is-active is-mainnet" : ""
              }`}
              aria-pressed={networkId === "mainnet"}
              onClick={() => onChangeNetwork("mainnet")}
            >
              <span className="status-dot status-dot-warn" aria-hidden="true" />
              Mainnet
            </button>
          </div>
        </div>
      </div>

      {networkId === "mainnet" && (
        <div className="alert alert-warning" role="status">
          <AlertTriangle size={16} aria-hidden="true" />
          <span>
            <strong>Stellar Mainnet activa:</strong> los balances y envíos usan{" "}
            <strong>XLM reales</strong> (ideal para probar wallets Mainnet como LOBSTR). Para
            pruebas gratuitas con Friendbot, cambia a <strong>Testnet</strong>.
          </span>
        </div>
      )}

      {error && (
        <div className="alert alert-error" role="alert">
          <span>{error}</span>
          <button
            type="button"
            className="btn-link"
            onClick={onClearError}
            aria-label="Cerrar mensaje de error"
          >
            Cerrar
          </button>
        </div>
      )}

      {!address ? (
        <div className="wallet-disconnected">
          <p className="muted">
            Conecta tu wallet favorita mediante <strong>Stellar Wallets Kit v2</strong>{" "}
            (LOBSTR, Freighter / Varial, xBull, Albedo, Hana y más) sobre{" "}
            <strong>{networkConfig.label}</strong> para consultar balances y firmar pagos en
            XLM.
          </p>

          <div className="wallet-actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={onConnect}
              disabled={isConnecting}
            >
              <Wallet size={18} aria-hidden="true" />
              {isConnecting ? "Abriendo selector de wallets…" : "Conectar Wallet"}
            </button>

            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setShowWatchForm((prev) => !prev)}
              aria-expanded={showWatchForm}
            >
              <Eye size={18} aria-hidden="true" />
              {showWatchForm
                ? "Ocultar modo explorador"
                : "Explorar una dirección (solo lectura)"}
            </button>
          </div>

          {showWatchForm && (
            <div className="watch-panel">
              <form className="watch-form" onSubmit={handleWatchSubmit}>
                <div className="field">
                  <label htmlFor={watchInputId}>Dirección pública Stellar (G…)</label>
                  <span id={watchHintId} className="hint">
                    Solo lectura: podrás consultar balances e historial en{" "}
                    {networkConfig.shortLabel} sin extensión de wallet.
                  </span>
                  <div className="inline-input-row">
                    <input
                      id={watchInputId}
                      type="text"
                      value={watchInput}
                      onChange={(e) => setWatchInput(e.target.value)}
                      placeholder="G..."
                      aria-describedby={watchHintId}
                      spellCheck={false}
                      autoComplete="off"
                    />
                    <button type="submit" className="btn btn-secondary">
                      Inspeccionar
                    </button>
                  </div>
                </div>
              </form>

              {networkId === "testnet" && (
                <div className="demo-row">
                  <span className="hint">¿No tienes una dirección a mano?</span>
                  <button
                    type="button"
                    className="btn-link"
                    onClick={() => {
                      const generated = onGenerateDemo();
                      setWatchInput(generated);
                    }}
                  >
                    <Sparkles size={14} aria-hidden="true" />
                    Generar dirección de prueba en Testnet
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="wallet-connected">
          <div className="wallet-identity">
            <div className="wallet-badges">
              <span
                className={`badge ${mode === "wallet" ? "badge-success" : "badge-info"}`}
              >
                <ShieldCheck size={14} aria-hidden="true" />
                {walletName ?? "Wallet conectada"}
              </span>
              <span className="badge badge-network">{networkConfig.label}</span>
              {mode === "watch" && (
                <span className="hint">
                  Para firmar y enviar XLM, conecta una wallet real.
                </span>
              )}
            </div>

            <div className="address-box">
              <code className="address-full" title={address}>
                {address}
              </code>
              <code className="address-short" aria-hidden="true">
                {shortenAddress(address, 8, 8)}
              </code>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={handleCopy}
                aria-label="Copiar dirección pública"
              >
                {copied ? (
                  <>
                    <Check size={15} aria-hidden="true" />
                    Copiada
                  </>
                ) : (
                  <>
                    <Copy size={15} aria-hidden="true" />
                    Copiar
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="wallet-actions">
            {mode === "wallet" && (
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={onOpenProfile}
              >
                <User size={15} aria-hidden="true" />
                Perfil
              </button>
            )}
            {mode === "watch" && (
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={onConnect}
                disabled={isConnecting}
              >
                <Wallet size={15} aria-hidden="true" />
                Conectar Wallet Real
              </button>
            )}
            <a
              href={getExplorerAccountUrl(address, networkId)}
              target="_blank"
              rel="noreferrer"
              className="btn btn-secondary btn-sm"
            >
              <ExternalLink size={15} aria-hidden="true" />
              Stellar Expert
            </a>
            <button
              type="button"
              className="btn btn-danger btn-sm"
              onClick={onDisconnect}
            >
              <LogOut size={15} aria-hidden="true" />
              Desconectar
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
