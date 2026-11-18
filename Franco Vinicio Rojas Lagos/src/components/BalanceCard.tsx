import { Coins, Droplets, RefreshCw, AlertTriangle } from "lucide-react";
import { formatXlm, shortenAddress, type AccountSnapshot } from "../lib/stellar";

interface BalanceCardProps {
  account: AccountSnapshot | null;
  loading: boolean;
  funding: boolean;
  fundMessage: string | null;
  error: string | null;
  onRefresh: () => Promise<void>;
  onFundWithFriendbot: () => Promise<void>;
}

export function BalanceCard({
  account,
  loading,
  funding,
  fundMessage,
  error,
  onRefresh,
  onFundWithFriendbot,
}: BalanceCardProps) {
  const xlmNum = account ? Number.parseFloat(account.xlmBalance) : 0;
  const estimatedReserve = account?.funded
    ? (2 + account.subentryCount) * 0.5
    : 0;
  const spendableXlm = Math.max(0, xlmNum - estimatedReserve);
  const otherAssets = account?.balances.filter((b) => !b.isNative) ?? [];

  return (
    <section className="card" aria-labelledby="balance-heading">
      <div className="section-header">
        <div>
          <span className="eyebrow">Paso 2 · Estado en Horizon</span>
          <h2 id="balance-heading">Balances de la Cuenta</h2>
        </div>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={onRefresh}
          disabled={loading}
          aria-busy={loading}
        >
          <RefreshCw
            size={15}
            className={loading ? "spin" : undefined}
            aria-hidden="true"
          />
          {loading ? "Actualizando…" : "Actualizar"}
        </button>
      </div>

      {error && (
        <div className="alert alert-error" role="alert">
          {error}
        </div>
      )}

      {fundMessage && (
        <div className="alert alert-success" role="status">
          {fundMessage}
        </div>
      )}

      {!account ? (
        <p className="muted">Cargando estado de la cuenta desde Stellar Horizon…</p>
      ) : !account.funded ? (
        <div className="unfunded-box">
          <div className="unfunded-header">
            <AlertTriangle size={20} aria-hidden="true" />
            <div>
              <h3>Cuenta aún no activada en Testnet</h3>
              <p className="muted">
                Horizon devolvió <code>404 NotFoundError</code>: esta llave pública todavía no
                tiene saldo mínimo en Stellar Testnet. Fondea la cuenta gratis con{" "}
                <strong>Friendbot</strong> para recibir <strong>10,000 XLM</strong> de prueba.
              </p>
            </div>
          </div>

          <button
            type="button"
            className="btn btn-primary"
            onClick={onFundWithFriendbot}
            disabled={funding}
          >
            <Droplets size={18} aria-hidden="true" />
            {funding ? "Fondeando con Friendbot…" : "Fondear con Friendbot (+10,000 XLM)"}
          </button>
        </div>
      ) : (
        <div className="balance-content">
          <div className="balance-hero">
            <div className="balance-main">
              <span className="balance-label">
                <Coins size={16} aria-hidden="true" />
                Balance nativo (Lumens)
              </span>
              <p className="balance-value">
                {formatXlm(account.xlmBalance)} <span className="unit">XLM</span>
              </p>
            </div>

            <dl className="balance-metrics">
              <div>
                <dt>Disponible estimado</dt>
                <dd>{formatXlm(spendableXlm)} XLM</dd>
              </div>
              <div>
                <dt>Reserva mínima</dt>
                <dd>{formatXlm(estimatedReserve)} XLM</dd>
              </div>
              <div>
                <dt>Subentradas</dt>
                <dd>{account.subentryCount}</dd>
              </div>
            </dl>
          </div>

          {otherAssets.length > 0 && (
            <div className="assets-list">
              <h3>Otros Assets (Trustlines)</h3>
              <ul>
                {otherAssets.map((asset) => (
                  <li key={`${asset.code}-${asset.issuer}`}>
                    <div>
                      <strong>{asset.code}</strong>
                      {asset.issuer && (
                        <span className="hint">
                          Emisor: {shortenAddress(asset.issuer, 6, 4)}
                        </span>
                      )}
                    </div>
                    <span className="mono">{formatXlm(asset.balance)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="friendbot-footer">
            <span className="hint">
              Cuenta activa en ledger {account.lastModifiedLedger ?? "—"} · Red de pruebas
            </span>
          </div>
        </div>
      )}
    </section>
  );
}
