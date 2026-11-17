import type { Transaction } from '@stellar/stellar-sdk'
import { ArrowRight, Copy } from 'lucide-react'
import { useRef, useState } from 'react'
import { getWalletPaymentUri } from './payment'
import type { PaymentDetails } from './payment'
import { connectWallet, WalletError } from './wallet'

type PaymentAttempt =
  | { status: 'ready' }
  | { status: 'retry'; transaction: Transaction; uncertain: boolean }
  | { status: 'sent' }

const pendingLabels = {
  connect: 'Esperando a Varial…',
  authorize: 'Revisá el pago en Varial…',
  submit: 'Enviando a Testnet…',
}

export function PaymentPage({ details }: { details: PaymentDetails }) {
  const [copyMessage, setCopyMessage] = useState('')
  const [payer, setPayer] = useState('')
  const [attempt, setAttempt] = useState<PaymentAttempt>({ status: 'ready' })
  const [pending, setPending] = useState<keyof typeof pendingLabels | null>(null)
  const [issue, setIssue] = useState<Error | null>(null)
  const actionInProgress = useRef(false)

  async function handlePayment() {
    if (actionInProgress.current || attempt.status === 'sent') return
    actionInProgress.current = true
    setIssue(null)

    try {
      if (!payer) {
        setPending('connect')
        const address = await connectWallet()
        if (address === details.address) {
          setIssue(new Error('Seleccioná en Varial la cuenta que va a pagar este cobro.'))
        } else {
          setPayer(address)
        }
        return
      }

      setPending(attempt.status === 'retry' ? 'submit' : 'authorize')
      const { authorizePayment, submitPayment } = await import('./paymentTransaction')
      const transaction = attempt.status === 'retry'
        ? attempt.transaction
        : await authorizePayment(payer, details)

      setPending('submit')
      const result = await submitPayment(transaction)
      if (result === 'submitted') {
        setAttempt({ status: 'sent' })
        return
      }

      const uncertain = result === 'unknown' || (attempt.status === 'retry' && attempt.uncertain)
      setAttempt(result === 'rejected' && !uncertain
        ? { status: 'ready' }
        : { status: 'retry', transaction, uncertain })
      const message = {
        rejected: uncertain
          ? 'El primer envío quedó sin respuesta. Revisá su estado en Stellar antes de iniciar otro pago.'
          : 'Testnet rechazó el envío. Revisá el pago y volvé a intentarlo.',
        retry: 'Testnet pidió esperar. Podés reintentar el mismo envío.',
        unknown: 'Testnet no respondió. Podés reintentar el mismo envío.',
      }[result]
      setIssue(new Error(message))
    } catch (error) {
      if (error instanceof WalletError) setPayer('')
      setIssue(error instanceof Error ? error : new Error('No se pudo iniciar el pago. Volvé a intentarlo.'))
    } finally {
      setPending(null)
      actionInProgress.current = false
    }
  }

  async function copyAddress() {
    try {
      await navigator.clipboard.writeText(details.address)
      setCopyMessage('Dirección copiada.')
    } catch {
      setCopyMessage('Seleccioná la dirección y copiala manualmente.')
    }
  }

  const readyLabel = payer ? 'Pagar con Varial' : 'Conectar wallet'
  const idleLabel = attempt.status === 'retry' ? 'Reintentar envío' : readyLabel
  const actionLabel = pending ? pendingLabels[pending] : idleLabel

  return (
    <main className="shell payment-page">
      <div className="intro">
        <h1>Revisá el cobro</h1>
        <p>Comprobá el monto y la wallet receptora antes de pagar.</p>
      </div>
      <section className="payment-card" aria-label="Datos del pago">
        <p className="wallet-label">Monto a pagar</p>
        <p className="payment-amount">{details.amount.replace('.', ',')} <span>XLM</span></p>
        <dl className="payment-details">
          {details.concept && (
            <div>
              <dt>Concepto</dt>
              <dd>{details.concept}</dd>
            </div>
          )}
          <div>
            <dt>Wallet receptora</dt>
            <dd className="payment-address">{details.address}</dd>
          </div>
          {payer && (
            <div>
              <dt>Wallet que paga</dt>
              <dd className="payment-address" title={payer}>{payer.slice(0, 8)}…{payer.slice(-6)}</dd>
            </div>
          )}
        </dl>
        {attempt.status === 'sent' ? (
          <p className="payment-status" role="status">
            <strong>Pago enviado a Testnet</strong>
            <span>Pendiente de confirmación.</span>
          </p>
        ) : (
          <button className="primary" type="button" onClick={handlePayment} disabled={pending !== null}>
            {actionLabel}
            {!pending && <ArrowRight size={20} aria-hidden="true" />}
          </button>
        )}
        {issue && (
          <p className="field-message" role="alert">
            {issue.message}{' '}
            {issue instanceof WalletError && issue.missing && (
              <a href="https://varialwallet.com/" target="_blank" rel="noreferrer">Obtener Varial</a>
            )}
          </p>
        )}
        <div className="payment-actions">
          {attempt.status === 'ready' && !pending && (
            <a className="secondary" href={getWalletPaymentUri(details)}>Abrir con SEP-7</a>
          )}
          <button className="secondary" type="button" onClick={copyAddress}>
            <Copy size={18} aria-hidden="true" />
            Copiar dirección
          </button>
        </div>
        {copyMessage && <p className="field-message" role="status">{copyMessage}</p>}
      </section>
    </main>
  )
}
