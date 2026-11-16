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
    <>
      <p>Dirección: {publicKey}</p>
      {funds.total && (
        <>
          <p>Balance testnet: {funds.total} XLM</p>
          <p>Congelado: {funds.reserved} XLM</p>
          <p>Disponible: {funds.available} XLM</p>
        </>
      )}
      {needsFunding && (
        <button type="button" className="counter" onClick={onFund}>
          Fondear en testnet
        </button>
      )}
      {error && <p>{error}</p>}
      <button type="button" className="counter" onClick={onLogout}>
        Cerrar sesión
      </button>
    </>
  )
}
