import { useState, type FormEvent } from 'react'
import { createPayment, formatAmount, type Currency, type Payment } from './payments'

interface Props {
  payments: Payment[]
  onCharge: (payment: Payment) => void
}

/** Pantalla de cobro (MOCK): solo agrega una tarjeta local, no toca la blockchain. */
export default function ChargeScreen({ payments, onCharge }: Props) {
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState<Currency>('CRC')

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const value = Number(amount)
    if (!Number.isFinite(value) || value <= 0) return
    onCharge(createPayment(value, currency))
    setAmount('')
  }

  return (
    <section className="charge">
      <form className="card charge-form" onSubmit={handleSubmit}>
        <label htmlFor="amount">Monto a cobrar</label>
        <div className="charge-row">
          <input
            id="amount"
            type="number"
            inputMode="decimal"
            min="0"
            step="any"
            placeholder="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <select
            aria-label="Moneda"
            value={currency}
            onChange={(e) => setCurrency(e.target.value as Currency)}
          >
            <option value="CRC">₡ Colones</option>
            <option value="USDC">USDC</option>
          </select>
        </div>
        <button className="btn-primary" type="submit" disabled={!(Number(amount) > 0)}>
          Cobrar
        </button>
      </form>

      <ul className="payments">
        {payments.length === 0 && <li className="empty">Aún no hay cobros.</li>}
        {payments.map((p) => (
          <li key={p.id} className={`card payment ${p.status}`}>
            <span className="payment-amount">{formatAmount(p.amount, p.currency)}</span>
            <span className="payment-status">
              {p.status === 'pending' ? '🕒 Guardado localmente' : '✓ Sincronizado'}
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}
