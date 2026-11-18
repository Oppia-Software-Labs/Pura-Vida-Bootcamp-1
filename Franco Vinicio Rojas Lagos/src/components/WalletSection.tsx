import { useId, useState, type FormEvent } from "react";
import {
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
import { getExplorerAccountUrl, shortenAddress } from "../lib/stellar";
import type { ConnectionMode } from "../hooks/useStellarWallet";

interface WalletSectionProps {
  address: string | null;
  mode: ConnectionMode;
  walletName: string | null;
  isConnecting: boolean;
  error: string | null;
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
  isConnecting,
  error,
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
        <span className="badge badge-network">
          <span className="status-dot" aria-hidden="true" />
          Stellar Testnet
        </span>
      </div>

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
            (Freighter / Varial, xBull, Albedo, Lobstr, Hana y más) para consultar balances,
            fondear en Testnet y firmar pagos en XLM.
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
              {showWatchForm ? "Ocultar modo explorador" : "Explorar una dirección (solo lectura)"}
            </button>
          </div>

          {showWatchForm && (
            <div className="watch-panel">
              <form className="watch-form" onSubmit={handleWatchSubmit}>
                <div className="field">
                  <label htmlFor={watchInputId}>Dirección pública Stellar (G…)</label>
                  <span id={watchHintId} className="hint">
                    Solo lectura: podrás consultar balances, fondear con Friendbot e historial sin
                    extensión de wallet.
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
            </div>
          )}
        </div>
      ) : (
        <div className="wallet-connected">
          <div className="wallet-identity">
            <div className="wallet-badges">
              <span className={`badge ${mode === "wallet" ? "badge-success" : "badge-info"}`}>
                <ShieldCheck size={14} aria-hidden="true" />
                {walletName ?? "Wallet conectada"}
              </span>
              {mode === "watch" && (
                <span className="hint">Para firmar y enviar XLM, conecta una wallet real.</span>
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
              <button type="button" className="btn btn-secondary btn-sm" onClick={onOpenProfile}>
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
              href={getExplorerAccountUrl(address)}
              target="_blank"
              rel="noreferrer"
              className="btn btn-secondary btn-sm"
            >
              <ExternalLink size={15} aria-hidden="true" />
              Stellar Expert
            </a>
            <button type="button" className="btn btn-danger btn-sm" onClick={onDisconnect}>
              <LogOut size={15} aria-hidden="true" />
              Desconectar
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
