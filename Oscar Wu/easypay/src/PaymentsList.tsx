import { Check, Clock, Download } from 'lucide-react'
import { useState } from 'react'
import { formatAmount, formatTime, paymentsToCsv, type Payment } from './payments'
import { describeItems } from './products'

type Filter = 'all' | 'pending' | 'synced'

interface Props {
  payments: Payment[]
  title: string
  /** Si se indica, solo se muestran los últimos N cobros y se oculta el filtro. */
  limit?: number
  onSeeAll?: () => void
}

/** Lista de cobros con filtro y exportación a CSV. */
export default function PaymentsList({ payments, title, limit, onSeeAll }: Props) {
  const [filter, setFilter] = useState<Filter>('all')
  const filtered = payments.filter((p) => filter === 'all' || p.status === filter)
  const shown = limit ? filtered.slice(0, limit) : filtered

  function exportCsv() {
    const blob = new Blob([paymentsToCsv(payments)], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'cobros-easypay.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="payments-wrap">
      <div className="payments-head">
        <h2 className="panel-title">{title}</h2>
        {!limit && (
          <div className="tabs" role="tablist" aria-label="Filtrar cobros">
            {(['all', 'pending', 'synced'] as Filter[]).map((f) => (
              <button key={f} role="tab" aria-selected={filter === f} className={filter === f ? 'on' : ''} onClick={() => setFilter(f)}>
                {f === 'all' ? 'Todos' : f === 'pending' ? 'Pendientes' : 'Sincronizados'}
              </button>
            ))}
          </div>
        )}
        {limit && onSeeAll && payments.length > 0 && (
          <button className="lp-link small" onClick={onSeeAll}>Ver todo</button>
        )}
        {!limit && (
          <button className="icon-btn" onClick={exportCsv} disabled={payments.length === 0} aria-label="Exportar cobros a CSV" title="Exportar CSV">
            <Download size={16} />
          </button>
        )}
      </div>
      <ul className="payments">
        {shown.length === 0 && (
          <li className="empty">{payments.length === 0 ? 'Aún no hay cobros. Registra el primero.' : 'No hay cobros en este filtro.'}</li>
        )}
        {shown.map((p) => (
          <li key={p.id} className={`payment ${p.status}`}>
            <span className="payment-main">
              <span className="payment-amount">{formatAmount(p.amount, p.currency)}</span>
              <span className="payment-meta">{formatTime(p.createdAt)} · {p.via === 'qr' ? 'QR' : 'Sin conexión'} · {p.ref}</span>
              {p.items && p.items.length > 0 && <span className="payment-items">{describeItems(p.items)}</span>}
            </span>
            <span className="payment-status">
              {p.status === 'pending' ? <><Clock size={14} /> Por sincronizar</> : <><Check size={14} /> En Stellar</>}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
