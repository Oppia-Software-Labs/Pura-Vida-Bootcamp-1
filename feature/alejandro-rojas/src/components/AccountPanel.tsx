import type { AccountFunds } from '../lib/stellar.ts'

type AccountPanelProps = {
  publicKey: string
  funds: AccountFunds
  error: string
  needsFunding: boolean
  onFund: () => void
  onLogout: () => void
}

export default function AccountPanel({
  publicKey,
  funds,
  error,
  needsFunding,
  onFund,
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
        </div>
      )}
      {error && <p className="form-error">{error}</p>}
      <div className="actions">
        {needsFunding && (
          <button type="button" className="btn-solid-reg" onClick={onFund}>
            Fondear en testnet
          </button>
        )}
        <button type="button" className="btn-outline-reg" onClick={onLogout}>
          Cerrar sesión
        </button>
      </div>
    </div>
  )
}
