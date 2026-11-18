import { CheckCircle2, Copy, FlaskConical, X } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'
import { useEffect, useRef, useState } from 'react'
import { formatAmount, stellarPayUri, toXlm, type Currency } from './payments'
import { hasPaymentWithMemo, shortAddress } from './wallet'

interface Props {
  amount: number
  currency: Currency
  ref_: string
  address: string
  demo: boolean
  onPaid: () => void
  onCancel: () => void
}

const TTL = 300 // segundos que dura el QR

/** QR de cobro: el cliente lo escanea con su wallet y paga. La app espera la confirmación. */
export default function PayModal({ amount, currency, ref_, address, demo, onPaid, onCancel }: Props) {
  const [left, setLeft] = useState(TTL)
  const [paid, setPaid] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  const done = useRef(false)

  const xlm = toXlm(amount, currency)
  const uri = stellarPayUri(address, xlm, ref_)

  function markPaid() {
    if (done.current) return
    done.current = true
    setPaid(true)
    setTimeout(onPaid, 1400)
  }

  // Cuenta regresiva
  useEffect(() => {
    if (paid) return
    const t = setInterval(() => setLeft((s) => Math.max(0, s - 1)), 1000)
    return () => clearInterval(t)
  }, [paid])

  // Detección REAL del pago en testnet (solo con wallet real; en demo la cuenta no existe en la red)
  useEffect(() => {
    if (demo || paid || left === 0) return
    const t = setInterval(async () => {
      if (await hasPaymentWithMemo(address, ref_)) markPaid()
    }, 4000)
    return () => clearInterval(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [demo, paid, left === 0, address, ref_])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && !paid && onCancel()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [paid, onCancel])

  async function copy(what: 'link' | 'address' | 'ref') {
    const text = what === 'link' ? uri : what === 'address' ? address : ref_
    try {
      await navigator.clipboard.writeText(text)
      setCopied(what)
      setTimeout(() => setCopied(null), 1500)
    } catch {
      /* sin permiso de portapapeles */
    }
  }

  const expired = left === 0 && !paid
  const mm = String(Math.floor(left / 60)).padStart(2, '0')
  const ss = String(left % 60).padStart(2, '0')

  return (
    <div className="wm-backdrop" onMouseDown={(e) => e.target === e.currentTarget && !paid && onCancel()}>
      <div className="wm pay" role="dialog" aria-modal="true" aria-label="Cobro con QR">
        {paid ? (
          <div className="wm-step pay-done">
            <CheckCircle2 size={64} strokeWidth={1.6} />
            <h2>Cobro recibido</h2>
            <p>{formatAmount(amount, currency)} · ref. {ref_}</p>
          </div>
        ) : (
          <>
            <header className="wm-head">
              <h2>Cobrar con QR</h2>
              <button className="wm-x" onClick={onCancel} aria-label="Cancelar cobro"><X size={18} /></button>
            </header>

            <div className="pay-amount">
              <b>{formatAmount(amount, currency)}</b>
              <span>≈ {xlm.toLocaleString('es-CR', { maximumFractionDigits: 2 })} XLM · tasa de demo</span>
            </div>

            <div className={`pay-qr${expired ? ' expired' : ''}`}>
              <QRCodeSVG value={uri} size={188} level="M" bgColor="#ffffff" fgColor="#2a1650" marginSize={2} />
              {expired && <div className="pay-expired"><b>QR vencido</b><span>Genera uno nuevo</span></div>}
            </div>

            <p className="pay-status">
              {expired ? 'El tiempo se agotó.' : <><span className="spinner" aria-hidden="true" /> Esperando el pago… {mm}:{ss}</>}
            </p>

            <dl className="pay-info">
              <div><dt>Destino</dt><dd title={address}>{shortAddress(address)}</dd><button onClick={() => copy('address')} aria-label="Copiar dirección"><Copy size={14} />{copied === 'address' ? 'Copiado' : ''}</button></div>
              <div><dt>Referencia</dt><dd>{ref_}</dd><button onClick={() => copy('ref')} aria-label="Copiar referencia"><Copy size={14} />{copied === 'ref' ? 'Copiado' : ''}</button></div>
              <div><dt>Red</dt><dd>Stellar testnet</dd><span /></div>
            </dl>

            <div className="wm-actions row">
              <button className="btn-ghost" onClick={() => copy('link')}><Copy size={15} /> {copied === 'link' ? 'Enlace copiado' : 'Copiar enlace'}</button>
              <button className="btn-ghost" onClick={onCancel}>Cancelar</button>
            </div>
            <button className="pay-sim" onClick={markPaid} disabled={expired}>
              <FlaskConical size={15} /> Simular pago del cliente <span className="wm-tag demo">DEMO</span>
            </button>
          </>
        )}
      </div>
    </div>
  )
}
