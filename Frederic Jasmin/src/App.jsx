import { useState } from 'react'
import { connectWallet, disconnectWallet, shortAddress } from './lib/wallet'

export default function App() {
  const [address, setAddress] = useState(null)
  const [error, setError] = useState('')

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
      </main>

      <footer className="container footer">Pura Vida Bootcamp · Hecho con Stellar Raven</footer>
    </div>
  )
}
