import { useCallback, useEffect, useState } from 'react'
import { Networks, StellarWalletsKit } from '@creit.tech/stellar-wallets-kit'
import { defaultModules } from '@creit.tech/stellar-wallets-kit/modules/utils'
import {
  fundWithFriendbot,
  isUnfunded,
  loadAccountSummary,
  networkPassphrase,
  type AccountSummary,
} from './lib/stellar'

const STORAGE_KEY = 'pura-vida:selected-wallet'

StellarWalletsKit.init({
  modules: defaultModules(),
  network: Networks.TESTNET,
  selectedWalletId: localStorage.getItem(STORAGE_KEY) ?? undefined,
})

type Status = 'idle' | 'loading' | 'ready' | 'unfunded' | 'error'

function shorten(value?: string | null): string {
  if (!value) return '—'
  if (value.length <= 10) return value
  return `${value.slice(0, 6)}…${value.slice(-4)}`
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  return 'Ocurrió un problema al hablar con la red de Stellar'
}

function App() {
  const [address, setAddress] = useState<string | null>(null)
  const [walletName, setWalletName] = useState<string | null>(null)
  const [summary, setSummary] = useState<AccountSummary | null>(null)
  const [status, setStatus] = useState<Status>('idle')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState(false)

  const refreshSummary = useCallback(async (publicKey: string) => {
    setStatus('loading')
    setMessage('')
    try {
      const result = await loadAccountSummary(publicKey)
      setSummary(result)
      setStatus('ready')
    } catch (error) {
      setSummary(null)
      if (isUnfunded(error)) {
        setStatus('unfunded')
        setMessage('Esta cuenta todavía no existe en la red de pruebas.')
      } else {
        setStatus('error')
        setMessage(errorMessage(error))
      }
    }
  }, [])

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) return
    StellarWalletsKit.getAddress()
      .then(({ address: savedAddress }) => {
        if (!savedAddress) {
          localStorage.removeItem(STORAGE_KEY)
          return
        }
        setAddress(savedAddress)
        setWalletName(StellarWalletsKit.selectedModule?.productName ?? 'Wallet')
        void refreshSummary(savedAddress)
      })
      .catch(() => localStorage.removeItem(STORAGE_KEY))
  }, [refreshSummary])

  async function connect() {
    setBusy(true)
    setMessage('')
    try {
      const { address: connectedAddress } = await StellarWalletsKit.authModal()
      const selected = StellarWalletsKit.selectedModule
      localStorage.setItem(STORAGE_KEY, selected.productId)
      setAddress(connectedAddress)
      setWalletName(selected.productName)
      await refreshSummary(connectedAddress)
    } catch (error) {
      setMessage(errorMessage(error))
    } finally {
      setBusy(false)
    }
  }

  async function disconnect() {
    await StellarWalletsKit.disconnect()
    localStorage.removeItem(STORAGE_KEY)
    setAddress(null)
    setWalletName(null)
    setSummary(null)
    setStatus('idle')
    setMessage('')
    setCopied(false)
  }

  async function fund() {
    if (!address) return
    setBusy(true)
    try {
      await fundWithFriendbot(address)
      await refreshSummary(address)
    } catch (error) {
      setStatus('error')
      setMessage(errorMessage(error))
    } finally {
      setBusy(false)
    }
  }

  async function copy() {
    if (!address) return
    await navigator.clipboard.writeText(address)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }

  return (
    <div className="shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark" aria-hidden="true" />
          <span>Pura Vida</span>
        </div>
        <span className="network" title={networkPassphrase}>
          <span className="network-dot" aria-hidden="true" />
          Stellar Testnet
        </span>
      </header>

      <main>
        <section className="hero" aria-labelledby="hero-title">
          <p className="eyebrow">Tu ventana a Stellar</p>
          <h1 id="hero-title">
            Conecta tu wallet.
            <br />
            Mira la red.
          </h1>
          <p className="lede">
            Una app mínima para conectar una wallet de Stellar, leer tu saldo en XLM
            y ver tus últimos movimientos en la red de pruebas.
          </p>
        </section>

        <div className="columns">
          <section className="panel wallet-panel" aria-labelledby="wallet-title">
            <div className="panel-heading">
              <h2 id="wallet-title">Tu wallet</h2>
              <span className="step">01 / Conexión</span>
            </div>

            {!address ? (
              <>
                <p className="panel-copy">
                  Elige entre Freighter, Varial y otras wallets compatibles. La
                  conexión se hace desde el modal oficial de Stellar Wallets Kit.
                </p>
                <button className="primary" type="button" onClick={connect} disabled={busy}>
                  {busy ? 'Abriendo wallets…' : 'Conectar wallet'}
                </button>
              </>
            ) : (
              <>
                <div className="connected-row">
                  <span className="connected-dot" aria-hidden="true" />
                  <span>Conectado con {walletName}</span>
                </div>
                <div className="address-block">
                  <span className="field-label">Dirección pública</span>
                  <div className="address-line">
                    <code title={address}>{shorten(address)}</code>
                    <button className="ghost" type="button" onClick={copy}>
                      {copied ? 'Copiado' : 'Copiar'}
                    </button>
                  </div>
                </div>
                <button className="secondary" type="button" onClick={disconnect}>
                  Desconectar
                </button>
              </>
            )}
            {message && status !== 'unfunded' && status !== 'error' && (
              <p className="notice" role="status">
                {message}
              </p>
            )}
          </section>

          <section className="panel account-panel" aria-labelledby="account-title">
            <div className="panel-heading">
              <h2 id="account-title">Tu cuenta</h2>
              <span className="step">02 / Red</span>
            </div>

            {!address && (
              <p className="panel-copy empty">
                Conecta una wallet para consultar su saldo y actividad en Testnet.
              </p>
            )}

            {address && status === 'loading' && (
              <p className="panel-copy" role="status">
                Consultando Horizon…
              </p>
            )}

            {address && (status === 'error' || status === 'unfunded') && (
              <div className="state-message">
                <p>{message}</p>
                {status === 'unfunded' && (
                  <button className="primary" type="button" onClick={fund} disabled={busy}>
                    {busy ? 'Financiando…' : 'Pedir XLM de prueba'}
                  </button>
                )}
                {status === 'error' && (
                  <button className="secondary" type="button" onClick={() => refreshSummary(address)}>
                    Reintentar
                  </button>
                )}
              </div>
            )}

            {address && status === 'ready' && summary && (
              <>
                <div className="balance">
                  <span className="field-label">Saldo disponible</span>
                  <strong>
                    {(Number(summary.balance) || 0).toLocaleString('es-EC', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 4,
                    })}{' '}
                    <span>XLM</span>
                  </strong>
                </div>
                <div className="meta-row">
                  <span>{summary.subentryCount} subentradas</span>
                  <span>Testnet</span>
                </div>
                <div className="activity">
                  <span className="field-label">Últimos movimientos</span>
                  {summary.payments.length === 0 ? (
                    <p className="no-activity">Todavía no hay pagos registrados.</p>
                  ) : (
                    <ul>
                      {summary.payments.map((payment) => {
                        const incoming = payment.to === address
                        return (
                          <li key={payment.id}>
                            <span className={`direction ${incoming ? 'in' : 'out'}`}>
                              {incoming ? '↙' : '↗'}
                            </span>
                            <span className="party">
                              {shorten(incoming ? payment.from : payment.to)}
                              <small>{payment.type.replace(/_/g, ' ')}</small>
                            </span>
                            <span className="amount">
                              {incoming ? '+' : '−'}
                              {payment.amount} {payment.asset}
                            </span>
                          </li>
                        )
                      })}
                    </ul>
                  )}
                </div>
              </>
            )}
          </section>
        </div>
      </main>

      <footer>
        <span>
          Desarrollado con{' '}
          <a href="https://raven.stellar.org/" target="_blank" rel="noreferrer">
            Stellar Raven
          </a>
          , el MCP oficial de Stellar.
        </span>
        <span>Alejandro Anchundia · Pura Vida Bootcamp</span>
      </footer>
    </div>
  )
}

export default App
