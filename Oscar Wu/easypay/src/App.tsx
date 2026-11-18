import { useEffect, useState } from 'react'
import ChargeScreen from './ChargeScreen'
import SyncBar from './SyncBar'
import type { Payment } from './payments'
import {
  connectWallet,
  disconnectWallet,
  fetchXlmBalance,
  onWalletDisconnect,
  shortAddress,
} from './wallet'

export default function App() {
  const [address, setAddress] = useState<string | null>(null)
  const [balance, setBalance] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [connecting, setConnecting] = useState(false)
  const [payments, setPayments] = useState<Payment[]>([])
  const [syncing, setSyncing] = useState(false)

  const pending = payments.filter((p) => p.status === 'pending').length
  const synced = payments.length - pending

  // MOCK: simula la reconexión. No se envía ninguna transacción a Stellar.
  function simulateReconnect() {
    if (syncing || pending === 0) return
    setSyncing(true)
    setTimeout(() => {
      setPayments((prev) => prev.map((p) => ({ ...p, status: 'synced' as const })))
      setSyncing(false)
    }, 1500)
  }

  useEffect(() => onWalletDisconnect(() => setAddress(null)), [])

  useEffect(() => {
    if (!address) return setBalance(null)
    fetchXlmBalance(address).then(setBalance)
  }, [address])

  async function handleConnect() {
    setError(null)
    setConnecting(true)
    try {
      setAddress(await connectWallet())
    } catch (e) {
      // Cerrar el modal sin elegir wallet también cae aquí; no es un error grave.
      setError(e instanceof Error && e.message ? e.message : 'No se pudo conectar la wallet')
    } finally {
      setConnecting(false)
    }
  }

  return (
    <main>
      <h1>EasyPay</h1>
      <p>Cobra aunque no tengas internet</p>
      {address ? (
        <div>
          <p>Wallet conectada (testnet): <strong title={address}>{shortAddress(address)}</strong></p>
          <p>Saldo: {balance === null ? 'cuenta no fondeada en testnet' : `${balance} XLM`}</p>
          <button onClick={() => disconnectWallet().then(() => setAddress(null))}>Desconectar</button>
          <SyncBar pending={pending} synced={synced} syncing={syncing} onSync={simulateReconnect} />
          <ChargeScreen payments={payments} onCharge={(p) => setPayments((prev) => [p, ...prev])} />
        </div>
      ) : (
        <button onClick={handleConnect} disabled={connecting}>
          {connecting ? 'Conectando…' : 'Conectar wallet'}
        </button>
      )}
      {error && <p role="alert">{error}</p>}
    </main>
  )
}
