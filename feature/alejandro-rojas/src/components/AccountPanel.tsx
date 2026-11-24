import type { AccountEntry, AccountFunds } from '../lib/stellar.ts'

type AccountPanelProps = {
  publicKey: string
  funds: AccountFunds
  entries: AccountEntry[]
  error: string
  needsFunding: boolean
  saving: boolean
  hasMessage: boolean
  onFund: () => void
  onSaveMessage: () => void
  onLogout: () => void
}

export default function AccountPanel({
  publicKey,
  funds,
  entries,
  error,
  needsFunding,
  saving,
  hasMessage,
  onFund,
  onSaveMessage,
  onLogout,
}: AccountPanelProps) {
  return (
    <div className="account-card">
      <p className="address">{publicKey}</p>
      {funds.total && (
        <div className="funds">
          <p>
            <span className="fund-label">BALANCE TESTNET</span>
            <span className="fund-value">{funds.total} XLM</span>
          </p>
          <p>
            <span className="fund-label">CONGELADO</span>
            <span className="fund-value">{funds.reserved} XLM</span>
          </p>
          <p>
            <span className="fund-label">DISPONIBLE</span>
            <span className="fund-value">{funds.available} XLM</span>
          </p>
          {entries.length === 0 ? (
            <p>
              <span className="fund-label">DATO EN LA CUENTA</span>
              <span className="fund-value">Vacío</span>
            </p>
          ) : (
            entries.map((entry) => (
              <p key={entry.name}>
                <span className="fund-label">{entry.name}</span>
                <span className="fund-value">{entry.value}</span>
              </p>
            ))
          )}
        </div>
      )}
      {error && <p className="form-error">{error}</p>}
      <div className="actions">
        {needsFunding && (
          <button type="button" className="btn-solid-reg" onClick={onFund}>
            Fondear en testnet
          </button>
        )}
        {funds.total && !hasMessage && (
          <button type="button" className="btn-solid-reg" onClick={onSaveMessage} disabled={saving}>
            {saving ? 'Esperando firma…' : 'Guardar mensaje'}
          </button>
        )}
        <button type="button" className="btn-outline-reg" onClick={onLogout}>
          Cerrar sesión
        </button>
      </div>
    </div>
  )
}
