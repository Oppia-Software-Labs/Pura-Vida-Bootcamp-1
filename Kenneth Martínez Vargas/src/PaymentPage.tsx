import { ArrowRight, Copy } from 'lucide-react'
import { useState } from 'react'
import { getWalletPaymentUri } from './payment'
import type { PaymentDetails } from './payment'

export function PaymentPage({ details }: { details: PaymentDetails }) {
  const [copyMessage, setCopyMessage] = useState('')

  async function copyAddress() {
    try {
      await navigator.clipboard.writeText(details.address)
      setCopyMessage('Dirección copiada.')
    } catch {
      setCopyMessage('Seleccioná la dirección y copiala manualmente.')
    }
  }

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
        </dl>
        <a className="primary" href={getWalletPaymentUri(details)}>
          Abrir en wallet compatible
          <ArrowRight size={20} aria-hidden="true" />
        </a>
        <button className="secondary" type="button" onClick={copyAddress}>
          <Copy size={18} aria-hidden="true" />
          Copiar dirección
        </button>
        {copyMessage && <p className="field-message" role="status">{copyMessage}</p>}
      </section>
    </main>
  )
}
