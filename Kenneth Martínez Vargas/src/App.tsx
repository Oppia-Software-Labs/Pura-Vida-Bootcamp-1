import { ArrowLeft, ArrowRight, Download, Link2, ScanQrCode, Wallet } from 'lucide-react'
import { toDataURL } from 'qrcode'
import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { PaymentPage } from './PaymentPage'
import {
  amountError, conceptLength, getPaymentUrl, getWalletPaymentUri, normalizeAmount, readPaymentLink,
} from './payment'
import { WalletError, connectWallet, disconnectWallet, verifyWallet } from './wallet'
import './App.css'

type ShareFormat = 'web' | 'sep7'

type ShareLink = {
  url: string
  qrImage: string
}

const shareFormats = ['web', 'sep7'] as const
const qrOptions = { width: 384, margin: 4, errorCorrectionLevel: 'M' } as const

function CreatePayment() {
  const [address, setAddress] = useState('')
  const [amount, setAmount] = useState('')
  const [concept, setConcept] = useState('')
  const [pending, setPending] = useState<'wallet' | 'payment' | 'disconnect' | null>(null)
  const [invalidAmount, setInvalidAmount] = useState(false)
  const [walletIssue, setWalletIssue] = useState<WalletError | null>(null)
  const [shared, setShared] = useState<Record<ShareFormat, ShareLink> | null>(null)
  const [shareFormat, setShareFormat] = useState<ShareFormat>('web')
  const [shareMessage, setShareMessage] = useState('')
  const amountInput = useRef<HTMLInputElement>(null)
  const shareHeading = useRef<HTMLHeadingElement>(null)
  const linkInput = useRef<HTMLInputElement>(null)
  const selectedShare = shared?.[shareFormat]
  const shareOpen = shared !== null
  const isSep7 = shareFormat === 'sep7'

  useEffect(() => {
    if (shareOpen) shareHeading.current?.focus()
  }, [shareOpen])

  function clearShare() {
    setShared(null)
    setShareFormat('web')
    setShareMessage('')
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending) return
    setWalletIssue(null)

    if (!address) {
      setPending('wallet')
      try {
        setAddress(await connectWallet())
      } catch (error) {
        setWalletIssue(error instanceof WalletError ? error : new WalletError('No se pudo conectar con Varial. Volvé a intentar.'))
      } finally {
        setPending(null)
      }
      return
    }

    const validAmount = normalizeAmount(amount)
    if (!validAmount) {
      setInvalidAmount(true)
      amountInput.current?.focus()
      return
    }

    setPending('payment')
    setShareMessage('')
    try {
      await verifyWallet(address)
      const details = { address, amount: validAmount, concept: concept.trim() }
      const webUrl = getPaymentUrl(details)
      const sep7Url = getWalletPaymentUri(details)
      const [webQr, sep7Qr] = await Promise.all([
        toDataURL(webUrl, qrOptions),
        toDataURL(sep7Url, qrOptions),
      ])
      setShared({
        web: { url: webUrl, qrImage: webQr },
        sep7: { url: sep7Url, qrImage: sep7Qr },
      })
    } catch (error) {
      if (error instanceof WalletError) {
        setAddress('')
        setWalletIssue(error)
        clearShare()
      } else {
        setShareMessage('No se pudo generar el código QR. Volvé a intentar.')
      }
    } finally {
      setPending(null)
    }
  }

  async function handleDisconnect() {
    setPending('disconnect')
    setAddress('')
    setWalletIssue(null)
    clearShare()

    try {
      await disconnectWallet()
    } catch (error) {
      if (error instanceof WalletError) setWalletIssue(error)
    } finally {
      setPending(null)
    }
  }

  async function copyLink() {
    if (!selectedShare) return
    try {
      await navigator.clipboard.writeText(selectedShare.url)
      setShareMessage(isSep7 ? 'Enlace SEP-7 copiado.' : 'Enlace del cobro copiado.')
    } catch {
      const input = linkInput.current
      if (input?.value === selectedShare.url) input.select()
      setShareMessage('Seleccioná el enlace y copialo manualmente.')
    }
  }

  function showForm() {
    clearShare()
    requestAnimationFrame(() => amountInput.current?.focus())
  }

  const actionLabel = {
    wallet: 'Esperando a Varial…',
    payment: 'Generando cobro…',
    disconnect: 'Desconectando…',
    ready: address ? 'Generar cobro' : 'Conectar wallet',
  }[pending ?? 'ready']

  return (
    <main className="shell create-page">
      <div className="intro">
        <h1>Creá un cobro</h1>
        <p>Recibí XLM con un enlace o un QR.</p>
      </div>

      <div className={shareOpen ? 'cobro sharing-open' : 'cobro'}>
        <form className="fields" aria-label="Datos del cobro" noValidate onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="monto">Monto a cobrar</label>
            <div className="amount-field">
              <input
                id="monto"
                ref={amountInput}
                type="text"
                inputMode="decimal"
                autoComplete="off"
                maxLength={20}
                placeholder="0,00"
                value={amount}
                disabled={pending === 'payment'}
                aria-invalid={invalidAmount}
                aria-describedby={invalidAmount ? 'moneda monto-error' : 'moneda'}
                onChange={(event) => {
                  setAmount(event.target.value)
                  setInvalidAmount(false)
                  clearShare()
                }}
              />
              <span className="currency" id="moneda">XLM</span>
            </div>
            {invalidAmount && <p className="field-message" id="monto-error" role="alert">{amountError}</p>}
          </div>

          <div className="field">
            <label htmlFor="concepto">Concepto <span className="optional">(opcional)</span></label>
            <input
              id="concepto"
              type="text"
              autoComplete="off"
              maxLength={conceptLength}
              placeholder="Ej. Almuerzo"
              value={concept}
              disabled={pending === 'payment'}
              onChange={(event) => {
                setConcept(event.target.value)
                clearShare()
              }}
            />
          </div>

          <div className="wallet">
            <span className="wallet-icon"><Wallet size={21} aria-hidden="true" /></span>
            <div className="wallet-details">
              <span className="wallet-label">Wallet receptora</span>
              <span className="wallet-status" title={address || undefined}>
                {address ? `${address.slice(0, 8)}…${address.slice(-6)}` : 'Sin conectar'}
              </span>
            </div>
            {address && (
              <button className="text-button" type="button" onClick={handleDisconnect} disabled={pending !== null}>
                Desconectar
              </button>
            )}
          </div>

          <button className="primary" type="submit" disabled={pending !== null}>
            {actionLabel}
            {!pending && <ArrowRight size={20} aria-hidden="true" />}
          </button>
          {walletIssue && (
            <p className="field-message" role="alert">
              {walletIssue.message}{' '}
              {walletIssue.missing && <a href="https://varialwallet.com/" target="_blank" rel="noreferrer">Obtener Varial</a>}
            </p>
          )}
        </form>

        <section className="sharing" aria-labelledby="sharing-title">
          <h2 id="sharing-title" ref={shareHeading} tabIndex={-1}>Enlace y código QR</h2>
          {selectedShare && (
            <div className="share-formats" role="group" aria-label="Formato para compartir">
              {shareFormats.map((format) => (
                <button
                  className="secondary"
                  type="button"
                  key={format}
                  aria-pressed={shareFormat === format}
                  onClick={() => {
                    setShareFormat(format)
                    setShareMessage('')
                  }}
                >
                  {format === 'web' ? 'Navegador' : 'Wallet SEP-7'}
                </button>
              ))}
            </div>
          )}
          <div className="qr-slot">
            {selectedShare ? (
              <>
                <img
                  src={selectedShare.qrImage}
                  alt={isSep7 ? 'Código QR SEP-7' : 'Código QR del enlace de cobro'}
                  width={384}
                  height={384}
                />
                {isSep7 && <p>Escaneá con una wallet SEP-7.</p>}
              </>
            ) : (
              <>
                <ScanQrCode size={46} strokeWidth={1.6} aria-hidden="true" />
                <p>Generá un cobro para compartirlo.</p>
              </>
            )}
          </div>
          {selectedShare && (
            <input
              className="share-link"
              aria-label={isSep7 ? 'Enlace SEP-7' : 'Enlace del cobro'}
              readOnly
              ref={linkInput}
              value={selectedShare.url}
              onFocus={(event) => event.currentTarget.select()}
            />
          )}
          <div className={selectedShare ? 'share-actions' : 'share-actions empty-actions'}>
            <button className="secondary" type="button" onClick={copyLink} disabled={!selectedShare}>
              <Link2 size={18} aria-hidden="true" />
              Copiar enlace
            </button>
            {selectedShare ? (
              <a className="secondary" href={selectedShare.qrImage} download={isSep7 ? 'cobro-sep7.png' : 'cobro-qr.png'}>
                <Download size={18} aria-hidden="true" />
                Descargar QR
              </a>
            ) : (
              <button className="secondary" type="button" disabled>
                <Download size={18} aria-hidden="true" />
                Descargar QR
              </button>
            )}
          </div>
          {shareMessage && <p className="field-message" role="status">{shareMessage}</p>}
          {shared && (
            <button className="return-to-form text-button" type="button" onClick={showForm}>
              <ArrowLeft size={18} aria-hidden="true" />
              Volver al formulario
            </button>
          )}
        </section>
      </div>
    </main>
  )
}

function App() {
  const view = readPaymentLink(window.location.search)

  return (
    <>
      <header className="topbar">
        <div className="shell topbar-inner">
          <span className="network">Stellar Testnet</span>
        </div>
      </header>
      {view.kind === 'create' && <CreatePayment />}
      {view.kind === 'payment' && <PaymentPage details={view.details} />}
      {view.kind === 'invalid' && (
        <main className="shell payment-page">
          <div className="intro">
            <h1>Enlace inválido</h1>
            <p>Pedile a quien te cobra que te vuelva a enviar el enlace.</p>
          </div>
          <a className="secondary" href={window.location.pathname}>Crear un cobro</a>
        </main>
      )}
    </>
  )
}

export default App
