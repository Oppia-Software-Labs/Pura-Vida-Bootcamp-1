import { useCallback, useEffect, useState } from 'react'
import { connectWallet, disconnectWallet, shortAddress } from './lib/wallet'
import { formatXlm, fundWithFriendbot, getXlmBalance } from './lib/stellar'

export default function App() {
  const [address, setAddress] = useState(null)
  const [error, setError] = useState('')
  const [balance, setBalance] = useState(undefined)
  const [loadingBalance, setLoadingBalance] = useState(false)

  const refreshBalance = useCallback(async () => {
    if (!address) return
    setLoadingBalance(true)
    try {
      setBalance(await getXlmBalance(address))
    } catch {
      setError('No se pudo leer el saldo desde Horizon.')
    } finally {
      setLoadingBalance(false)
    }
  }, [address])

  const [funding, setFunding] = useState(false)
  const [fundMsg, setFundMsg] = useState('')

  async function handleFund() {
    setFunding(true)
    setFundMsg('')
    setError('')
    try {
      await fundWithFriendbot(address)
      setFundMsg('Listo: Friendbot depositó 10.000 XLM de prueba.')
      await refreshBalance()
    } catch (err) {
      setError(err.message)
    } finally {
      setFunding(false)
    }
  }

  useEffect(() => {
    refreshBalance()
  }, [refreshBalance])

  async function handleConnect() {
    setError('')
    try {
      setAddress(await connectWallet())
    } catch (err) {
      setError(err?.message || 'No se pudo conectar la wallet.')
    }
  }

  async function handleDisconnect() {
    await disconnectWallet()
    setAddress(null)
    setBalance(undefined)
  }

  return (
    <div className="page">
      <header className="bar container">
        <span className="logo">Pura Vida Wallet</span>
        <span className="network">Testnet</span>
      </header>

      <main className="container">
        <h1>Tu primera app en Stellar</h1>
        <p className="lead">
          Conecta tu wallet de Stellar, revisa tu saldo, carga XLM de prueba y envía pagos en la testnet.
        </p>

        <div className="grid">
        <section className="card">
          <h2>Wallet</h2>
          {address ? (
            <>
              <p className="muted">Cuenta conectada</p>
              <p className="address" title={address}>{shortAddress(address)}</p>
              <div className="row">
                <button className="secondary" onClick={() => navigator.clipboard.writeText(address)}>
                  Copiar dirección
                </button>
                <button className="secondary" onClick={handleDisconnect}>Desconectar</button>
              </div>
            </>
          ) : (
            <>
              <p className="muted">Conecta Freighter, xBull, Albedo u otra wallet compatible.</p>
              <button onClick={handleConnect}>Conectar wallet</button>
            </>
          )}
          {error && <p className="error">{error}</p>}
        </section>

        {address && (
          <section className="card">
            <h2>Saldo</h2>
            {balance === undefined ? (
              <p className="muted">Cargando...</p>
            ) : balance === null ? (
              <p className="muted">Esta cuenta todavía no existe en la testnet. Necesita su primer depósito.</p>
            ) : (
              <p className="balance">{formatXlm(balance)} XLM</p>
            )}
            <div className="row">
              <button className="secondary" onClick={refreshBalance} disabled={loadingBalance}>
                {loadingBalance ? 'Actualizando...' : 'Actualizar saldo'}
              </button>
              <button onClick={handleFund} disabled={funding}>
                {funding ? 'Fondeando...' : 'Cargar XLM de prueba'}
              </button>
            </div>
            {fundMsg && <p className="ok">{fundMsg}</p>}
          </section>
        )}
        </div>
      </main>

      <footer className="container footer">Pura Vida Bootcamp · Hecho con Stellar Raven</footer>
    </div>
  )
}
