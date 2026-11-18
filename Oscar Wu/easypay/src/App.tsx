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
    <main className="app">
      <header className="brand">
        <div className="logo" aria-hidden="true">✓</div>
        <h1>EasyPay</h1>
      </header>
      <p className="tagline">Cobra aunque no tengas internet</p>

      {address ? (
        <>
          <div className="card wallet">
            <div>
              <span className="muted">Wallet conectada · testnet</span>
              <strong className="address" title={address}>{shortAddress(address)}</strong>
              <span className="muted small">
                {balance === null ? 'Cuenta no fondeada en testnet' : `${balance} XLM`}
              </span>
            </div>
            <button className="btn-ghost" onClick={() => disconnectWallet().then(() => setAddress(null))}>
              Desconectar
            </button>
          </div>

          <p className="demo-note">
            DEMO: los cobros y la sincronización son simulados. No se guarda nada offline ni se envía nada a Stellar.
          </p>
          <SyncBar pending={pending} synced={synced} syncing={syncing} onSync={simulateReconnect} />
          <ChargeScreen payments={payments} onCharge={(p) => setPayments((prev) => [p, ...prev])} />
        </>
      ) : (
        <div className="landing">
          <button className="btn-primary" onClick={handleConnect} disabled={connecting}>
            {connecting ? 'Conectando…' : 'Conectar wallet'}
          </button>
          {error && <p className="error" role="alert">{error}</p>}
        </div>
      )}
    </main>
  )
}
