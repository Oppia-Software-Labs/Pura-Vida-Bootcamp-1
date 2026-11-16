import type { AccountFunds } from '../lib/stellar.ts'

type AccountPanelProps = {
  publicKey: string
  funds: AccountFunds
  error: string
  needsFunding: boolean
  onFund: () => void
}

export default function AccountPanel({
  publicKey,
  funds,
  error,
  needsFunding,
  onFund,
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
    </>
  )
}
