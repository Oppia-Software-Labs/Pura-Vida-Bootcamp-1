import type { Transaction } from '@stellar/stellar-sdk'
import { ArrowRight, Copy } from 'lucide-react'
import { useRef, useState } from 'react'
import { getWalletPaymentUri } from './payment'
import type { PaymentDetails } from './payment'
import { usePaymentConfirmation } from './usePaymentConfirmation'
import { connectWallet, WalletError } from './wallet'

type PaymentAttempt =
  | { status: 'ready' }
  | { status: 'retry'; transaction: Transaction; hash: string; uncertain: boolean }
  | { status: 'sent'; hash: string }

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
  const trackingHash = attempt.status === 'sent' || (attempt.status === 'retry' && attempt.uncertain)
    ? attempt.hash
    : null
  const { status: confirmation, checkAgain } = usePaymentConfirmation(trackingHash)
  const confirmed = confirmation === 'confirmed'
  const failed = confirmation === 'failed'
  const canPay = !confirmed && (attempt.status !== 'sent' || failed)

  async function handlePayment() {
    if (actionInProgress.current || !canPay) return
    actionInProgress.current = true
    setIssue(null)
    setCopyMessage('')

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

      const retry = attempt.status === 'retry' && !failed ? attempt : null
      if (failed) setAttempt({ status: 'ready' })

      setPending(retry ? 'submit' : 'authorize')
      const { authorizePayment, submitPayment } = await import('./paymentTransaction')
      const transaction = retry?.transaction ?? await authorizePayment(payer, details)

      setPending('submit')
      const { status: result, hash } = await submitPayment(transaction)
      if (result === 'submitted') {
        setAttempt({ status: 'sent', hash })
        return
      }

      const uncertain = result === 'unknown' || retry?.uncertain === true
      setAttempt(result === 'rejected' && !uncertain
        ? { status: 'ready' }
        : { status: 'retry', transaction, hash, uncertain })
      const message = {
        rejected: uncertain
          ? 'El envío anterior quedó sin respuesta. Consultá su estado en Stellar.'
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

  async function copyText(value: string, message: string) {
    try {
      await navigator.clipboard.writeText(value)
      setCopyMessage(message)
    } catch {
      setCopyMessage('Seleccioná el texto y copialo manualmente.')
    }
  }

  const readyLabel = payer ? 'Pagar con Varial' : 'Conectar wallet'
  const retryLabel = failed ? 'Reintentar pago' : 'Reintentar envío'
  const idleLabel = failed || attempt.status === 'retry' ? retryLabel : readyLabel
  const actionLabel = pending ? pendingLabels[pending] : idleLabel
  const statusLabel = {
    checking: attempt.status === 'sent' ? 'Pendiente de confirmación' : 'Verificando el envío',
    unconfirmed: 'Aún sin confirmar',
    confirmed: 'Pago confirmado',
    failed: 'Pago fallido',
  }[confirmation]

  return (
    <main className={confirmed ? 'shell payment-page payment-complete' : 'shell payment-page'}>
      <div className="intro">
        <h1 aria-live="polite">{confirmed ? 'Pago confirmado' : 'Revisá el cobro'}</h1>
        {!confirmed && <p>Comprobá el monto y la wallet receptora antes de pagar.</p>}
      </div>
      <section className="payment-card" aria-label="Datos del pago">
        <p className="wallet-label">{confirmed ? 'Monto pagado' : 'Monto a pagar'}</p>
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
        {trackingHash && !confirmed && (
          <p className="payment-status" role="status">
            <strong>{statusLabel}</strong>
          </p>
        )}
        {confirmed && trackingHash && (
          <div className="payment-receipt">
            <p>Hash de la transacción</p>
            <code className="payment-address">{trackingHash}</code>
          </div>
        )}
        {canPay && (
          <button className="primary" type="button" onClick={handlePayment} disabled={pending !== null}>
            {actionLabel}
            {!pending && <ArrowRight size={20} aria-hidden="true" />}
          </button>
        )}
        {issue && !confirmed && !failed && (
          <p className="field-message" role="alert">
            {issue.message}{' '}
            {issue instanceof WalletError && issue.missing && (
              <a href="https://varialwallet.com/" target="_blank" rel="noreferrer">Obtener Varial</a>
            )}
          </p>
        )}
        <div className="payment-actions">
          {trackingHash && confirmation === 'unconfirmed' && (
            <button className="secondary" type="button" onClick={checkAgain}>Consultar estado</button>
          )}
          {attempt.status === 'ready' && !pending && (
            <a className="secondary" href={getWalletPaymentUri(details)}>Abrir con SEP-7</a>
          )}
          {confirmed && trackingHash ? (
            <button className="secondary" type="button" onClick={() => copyText(trackingHash, 'Hash copiado.')}>
              <Copy size={18} aria-hidden="true" />
              Copiar hash
            </button>
          ) : (
            <button className="secondary" type="button" onClick={() => copyText(details.address, 'Dirección copiada.')}>
              <Copy size={18} aria-hidden="true" />
              Copiar dirección
            </button>
          )}
        </div>
        {copyMessage && <p className="field-message" role="status">{copyMessage}</p>}
      </section>
    </main>
  )
}
