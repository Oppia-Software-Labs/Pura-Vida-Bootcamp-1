import { useState } from 'react'
import {
  disconnect,
  getNetworkDetails,
  isConnected,
  requestAccess,
} from '@stellar/varial-sdk'
import {
  connectFreighter,
  WalletNotInstalledError,
} from './stellarWallet'
import './App.css'

const FRIEND_BOT_URL = 'https://friendbot.stellar.org'

async function readXlmBalance(address, networkUrl) {
  const horizonUrl = networkUrl.replace(/\/+$/, '')
  const response = await fetch(`${horizonUrl}/accounts/${address}`)

  if (response.status === 404) {
    return null
  }

  if (!response.ok) {
    throw new Error(`Horizon respondió con el código ${response.status}.`)
  }

  const account = await response.json()
  const nativeBalance = account.balances.find(
    (balance) => balance.asset_type === 'native',
  )

  return nativeBalance?.balance ?? '0'
}

function getErrorMessage(error) {
  return error instanceof Error
    ? error.message
    : 'Ocurrió un error inesperado. Inténtalo de nuevo.'
}

function App() {
  const [wallet, setWallet] = useState(null)
  const [balance, setBalance] = useState(null)
  const [accountStatus, setAccountStatus] = useState('idle')
  const [isBusy, setIsBusy] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [walletMissing, setWalletMissing] = useState(false)
  const [notice, setNotice] = useState('')

  async function refreshBalance(address, networkUrl) {
    setAccountStatus('loading')
    const nextBalance = await readXlmBalance(address, networkUrl)

    if (nextBalance === null) {
      setBalance('0')
      setAccountStatus('missing')
      return
    }

    setBalance(nextBalance)
    setAccountStatus('ready')
  }

  async function handleConnect() {
    setIsBusy(true)
    setErrorMessage('')
    setWalletMissing(false)
    setNotice('')

    try {
      const connectedWallet = await connectFreighter({
        isConnected,
        requestAccess,
        getNetworkDetails,
      })
      setWallet(connectedWallet)
      await refreshBalance(
        connectedWallet.address,
        connectedWallet.networkUrl,
      )
    } catch (error) {
      setAccountStatus('error')
      setErrorMessage(getErrorMessage(error))
      setWalletMissing(error instanceof WalletNotInstalledError)
    } finally {
      setIsBusy(false)
    }
  }

  async function handleRefresh() {
    if (!wallet) return

    setIsBusy(true)
    setErrorMessage('')
    setWalletMissing(false)
    setNotice('')

    try {
      await refreshBalance(wallet.address, wallet.networkUrl)
    } catch (error) {
      setAccountStatus('error')
      setErrorMessage(getErrorMessage(error))
    } finally {
      setIsBusy(false)
    }
  }

  async function handleFundTestnet() {
    if (!wallet || wallet.network.toUpperCase() !== 'TESTNET') return

    setIsBusy(true)
    setErrorMessage('')
    setWalletMissing(false)
    setNotice('')

    try {
      const response = await fetch(
        `${FRIEND_BOT_URL}/?addr=${encodeURIComponent(wallet.address)}`,
      )
      if (!response.ok) {
        throw new Error(
          `Friendbot respondió con el código ${response.status}.`,
        )
      }

      await refreshBalance(wallet.address, wallet.networkUrl)
      setNotice('¡Tu cuenta ya tiene XLM de prueba!')
    } catch (error) {
      setAccountStatus('error')
      setErrorMessage(getErrorMessage(error))
    } finally {
      setIsBusy(false)
    }
  }

  async function handleDisconnect() {
    setIsBusy(true)
    setErrorMessage('')
    setWalletMissing(false)
    setNotice('')

    try {
      const result = await disconnect()
      if (result.error) {
        throw new Error(result.error.message)
      }

      setWallet(null)
      setBalance(null)
      setAccountStatus('idle')
    } catch (error) {
      setErrorMessage(getErrorMessage(error))
    } finally {
      setIsBusy(false)
    }
  }

  const isTestnet = wallet?.network.toUpperCase() === 'TESTNET'
  const formattedBalance =
    balance === null
      ? '—'
      : Number(balance).toLocaleString('es-CR', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 7,
        })
  const explorerNetwork =
    wallet?.network === 'PUBLIC'
      ? 'public'
      : wallet?.network === 'TESTNET'
        ? 'testnet'
        : null

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#inicio" aria-label="Pura Vida Wallet, inicio">
          <span className="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 32 32" fill="none">
              <path
                d="M16 3.5 27 9.75v12.5L16 28.5 5 22.25V9.75L16 3.5Z"
                stroke="currentColor"
                strokeWidth="1.7"
              />
              <path
                d="m10.5 16 3.6 3.6 7.8-8.1"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
              />
            </svg>
          </span>
          <span>
            <strong>pura vida</strong>
            <small>WALLET</small>
          </span>
        </a>

        <nav className="topbar-nav" aria-label="Navegación principal">
          <a href="#wallet">Mi wallet</a>
          <a href="#como-funciona">Cómo funciona</a>
        </nav>

        {wallet ? (
          <button
            className="button button-outline button-small"
            disabled={isBusy}
            onClick={handleDisconnect}
            type="button"
          >
            Desconectar
          </button>
        ) : (
          <button
            className="button button-dark button-small"
            disabled={isBusy}
            onClick={handleConnect}
            type="button"
          >
            {isBusy ? 'Conectando…' : 'Conectar wallet'}
          </button>
        )}
      </header>

      {errorMessage && (
        <div className="top-error-banner" role="alert">
          <span>{errorMessage}</span>
          {walletMissing && (
            <a
              href="https://chromewebstore.google.com/detail/freighter/bcacfldlkkdogcmkkibnjlakofdplcbk"
              rel="noreferrer"
              target="_blank"
            >
              Instalar Freighter <span aria-hidden="true">↗</span>
            </a>
          )}
        </div>
      )}

      <main>
        <section className="hero" id="inicio">
          <div className="hero-copy">
            <div className="eyebrow">
              <span className="eyebrow-dot" />
              HECHO PARA EXPLORAR STELLAR
            </div>
            <h1>
              Dinero global,
              <br />
              <span>pura vida.</span>
            </h1>
            <p className="hero-description">
              Una forma sencilla de dar tus primeros pasos en Stellar. Conecta
              tu wallet y explora tu saldo en una red abierta.
            </p>
            <a className="text-link" href="#wallet">
              Explorar mi wallet <span aria-hidden="true">↓</span>
            </a>
            <div className="hero-note">
              <span className="sparkle" aria-hidden="true">✳</span>
              Sin complicaciones. Tú tienes el control.
            </div>
          </div>

          <div className="hero-art" aria-hidden="true">
            <div className="orbit orbit-one" />
            <div className="orbit orbit-two" />
            <div className="coin coin-back">₳</div>
            <div className="coin coin-main">
              <span className="coin-symbol">✳</span>
              <span>STELLAR</span>
            </div>
            <div className="coin coin-front">✦</div>
            <div className="art-caption">
              <span className="caption-dot" />
              El futuro se mueve contigo
            </div>
          </div>
        </section>

        <section className="wallet-section" id="wallet">
          <div className="section-heading">
            <div>
              <span className="section-kicker">TU ESPACIO</span>
              <h2>Tu wallet Stellar</h2>
            </div>
            {wallet && (
              <span className="network-pill">
                <span className="status-dot" />
                {wallet.network}
              </span>
            )}
          </div>

          <div className={`wallet-card${wallet ? ' is-connected' : ''}`}>
            <div className="wallet-card-top">
              <div className="wallet-card-label">
                <span className="wallet-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none">
                    <rect
                      x="3.5"
                      y="5.5"
                      width="17"
                      height="13"
                      rx="3"
                      stroke="currentColor"
                      strokeWidth="1.5"
                    />
                    <path
                      d="M3.5 9h17m-4.5 5h1.5"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeWidth="1.5"
                    />
                  </svg>
                </span>
                <span>
                  <strong>Saldo disponible</strong>
                  <small>
                    {wallet ? 'Cuenta conectada' : 'Conecta tu wallet para empezar'}
                  </small>
                </span>
              </div>
              {wallet && (
                <button
                  aria-label="Actualizar saldo"
                  className="refresh-button"
                  disabled={isBusy}
                  onClick={handleRefresh}
                  type="button"
                >
                  <svg
                    className={isBusy ? 'is-spinning' : ''}
                    viewBox="0 0 20 20"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M16.5 9.2A6.6 6.6 0 0 0 5.3 5.1L3.7 6.7m0 0V3.8m0 2.9h2.9m-3.1 3.1a6.6 6.6 0 0 0 11.2 4.1l1.6-1.6m0 0v2.9m0-2.9h-2.9"
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="1.5"
                    />
                  </svg>
                </button>
              )}
            </div>

            <div className="balance-line">
              <span className="balance-amount">
                {wallet && accountStatus === 'loading' ? 'Cargando…' : formattedBalance}
              </span>
              <span className="balance-unit">XLM</span>
            </div>

            {wallet ? (
              <div className="account-details">
                <div className="address-row">
                  <span className="address-label">DIRECCIÓN PÚBLICA</span>
                  <code title={wallet.address}>
                    {wallet.address.slice(0, 7)}…{wallet.address.slice(-6)}
                  </code>
                </div>
                <div className="wallet-actions">
                  {explorerNetwork && (
                    <a
                      className="text-link compact-link"
                      href={`https://stellar.expert/explorer/${explorerNetwork}/account/${wallet.address}`}
                      rel="noreferrer"
                      target="_blank"
                    >
                      Ver en Stellar Expert <span aria-hidden="true">↗</span>
                    </a>
                  )}
                  {isTestnet && accountStatus === 'missing' && (
                    <button
                      className="button button-green button-small"
                      disabled={isBusy}
                      onClick={handleFundTestnet}
                      type="button"
                    >
                      {isBusy ? 'Activando…' : 'Activar cuenta de prueba'}
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="connect-prompt">
                <p>
                  Conecta Freighter para consultar tu saldo y la red seleccionada.
                  Nunca compartiremos tus claves privadas.
                </p>
                <button
                  className="button button-green"
                  disabled={isBusy}
                  onClick={handleConnect}
                  type="button"
                >
                  {isBusy ? 'Conectando…' : 'Conectar Freighter'}
                  {!isBusy && <span aria-hidden="true">→</span>}
                </button>
              </div>
            )}

            {notice && (
              <p className="feedback feedback-success" role="status">
                {notice}
              </p>
            )}
            {wallet && accountStatus === 'missing' && !isTestnet && (
              <p className="feedback feedback-info" role="status">
                Esta cuenta aún no existe en {wallet.network}. Cambia a Testnet
                en Freighter para probarla sin usar fondos reales.
              </p>
            )}
          </div>
          <p className="wallet-footnote">
            Tus activos permanecen en la red Stellar. Esta aplicación solo consulta
            información pública.
          </p>
        </section>

        <section className="how-section" id="como-funciona">
          <div className="how-intro">
            <span className="section-kicker">ASÍ DE SIMPLE</span>
            <h2>Un primer paso, sin vueltas.</h2>
            <p>
              Empieza con una wallet y descubre cómo funciona la red Stellar.
            </p>
          </div>
          <div className="steps">
            <article className="step-card">
              <span className="step-number">01</span>
              <h3>Conecta</h3>
              <p>Autoriza Freighter para mostrar tu dirección pública.</p>
            </article>
            <article className="step-card">
              <span className="step-number">02</span>
              <h3>Explora</h3>
              <p>Consulta tu saldo XLM directamente desde Horizon.</p>
            </article>
            <article className="step-card">
              <span className="step-number">03</span>
              <h3>Experimenta</h3>
              <p>Usa Testnet para aprender con XLM de prueba, sin riesgo.</p>
            </article>
          </div>
        </section>
      </main>

      <footer className="footer">
        <a className="brand footer-brand" href="#inicio">
          <span className="brand-mark" aria-hidden="true">
            <svg viewBox="0 0 32 32" fill="none">
              <path
                d="M16 3.5 27 9.75v12.5L16 28.5 5 22.25V9.75L16 3.5Z"
                stroke="currentColor"
                strokeWidth="1.7"
              />
              <path
                d="m10.5 16 3.6 3.6 7.8-8.1"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
              />
            </svg>
          </span>
          <span>
            <strong>pura vida</strong>
            <small>WALLET</small>
          </span>
        </a>
        <span>Una pequeña app para explorar Stellar.</span>
        <a href="https://stellar.org/" rel="noreferrer" target="_blank">
          Con tecnología Stellar <span aria-hidden="true">↗</span>
        </a>
      </footer>
    </div>
  )
}

export default App
