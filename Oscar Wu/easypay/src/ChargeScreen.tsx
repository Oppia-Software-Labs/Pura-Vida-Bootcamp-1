import { Minus, Plus, QrCode, Trash2, WifiOff } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import type { Currency } from './payments'
import { ICONS, stockState, type CartItem, type Product } from './products'

interface Props {
  products: Product[]
  offline: boolean
  /** En línea: abre el QR para que el cliente pague. */
  onRequestQr: (amount: number, currency: Currency, items?: CartItem[]) => void
  /** Sin conexión: guarda el cobro localmente (pendiente de sincronizar). */
  onSaveOffline: (amount: number, currency: Currency, items?: CartItem[]) => void
}

type Mode = 'amount' | 'products'

const QUICK: Record<Currency, number[]> = {
  CRC: [1000, 2500, 5000, 10000],
  USDC: [1, 5, 10, 20],
}

/** Cobro (monto libre o productos) + lista de cobros. El QR es real (SEP-7); la cola sin conexión es demo. */
export default function ChargeScreen({ products, offline, onRequestQr, onSaveOffline }: Props) {
  const [mode, setMode] = useState<Mode>('amount')
  const [amount, setAmount] = useState('')
  const [currency, setCurrency] = useState<Currency>('CRC')
  const [cart, setCart] = useState<Record<string, number>>({})

  const cartItems: CartItem[] = products
    .filter((p) => cart[p.id] > 0)
    .map((p) => ({ productId: p.id, name: p.name, qty: cart[p.id], price: p.price }))
  const cartTotal = cartItems.reduce((s, i) => s + i.qty * i.price, 0)

  const value = mode === 'amount' ? Number(amount) : cartTotal
  const valid = Number.isFinite(value) && value > 0

  function addToCart(p: Product) {
    setCart((c) => ((c[p.id] ?? 0) < p.stock ? { ...c, [p.id]: (c[p.id] ?? 0) + 1 } : c))
  }
  function removeFromCart(p: Product) {
    setCart((c) => {
      const next = { ...c, [p.id]: Math.max(0, (c[p.id] ?? 0) - 1) }
      if (!next[p.id]) delete next[p.id]
      return next
    })
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!valid) return
    const cur: Currency = mode === 'products' ? 'CRC' : currency
    const items = mode === 'products' ? cartItems : undefined
    if (offline) onSaveOffline(value, cur, items)
    else onRequestQr(value, cur, items)
    setAmount('')
    setCart({})
  }

  return (
    <section className="charge">
      <form className="charge-form" onSubmit={handleSubmit}>
        <div className="charge-head">
          <div className="seg" role="tablist" aria-label="Tipo de cobro">
            <button type="button" role="tab" aria-selected={mode === 'amount'} className={mode === 'amount' ? 'on' : ''} onClick={() => setMode('amount')}>Monto libre</button>
            <button type="button" role="tab" aria-selected={mode === 'products'} className={mode === 'products' ? 'on' : ''} onClick={() => setMode('products')}>Productos</button>
          </div>
          {mode === 'amount' && (
            <div className="seg" role="group" aria-label="Moneda">
              <button type="button" className={currency === 'CRC' ? 'on' : ''} onClick={() => setCurrency('CRC')}>₡</button>
              <button type="button" className={currency === 'USDC' ? 'on' : ''} onClick={() => setCurrency('USDC')}>USDC</button>
            </div>
          )}
        </div>

        {mode === 'amount' ? (
          <>
            <label htmlFor="amount" className="sr-only">Monto a cobrar</label>
            <div className="amount-field">
              <span aria-hidden="true">{currency === 'CRC' ? '₡' : '$'}</span>
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
            </div>
            <div className="quick">
              {QUICK[currency].map((q) => (
                <button type="button" key={q} onClick={() => setAmount(String((Number(amount) || 0) + q))}>
                  +{q.toLocaleString('es-CR')}
                </button>
              ))}
              <button type="button" className="quick-clear" onClick={() => setAmount('')} disabled={!amount}>Borrar</button>
            </div>
          </>
        ) : (
          <>
            <ul className="catalog">
              {products.map((p) => {
                const Icon = ICONS[p.icon]
                const st = stockState(p.stock)
                const inCart = cart[p.id] ?? 0
                return (
                  <li key={p.id}>
                    <button type="button" className={inCart ? 'in' : ''} disabled={p.stock - inCart <= 0} onClick={() => addToCart(p)}>
                      <Icon size={20} strokeWidth={1.8} />
                      <b>{p.name}</b>
                      <span>₡{p.price.toLocaleString('es-CR')}</span>
                      <small className={st}>{st === 'out' ? 'Agotado' : `${p.stock - inCart} disp.`}</small>
                      {inCart > 0 && <i className="badge">{inCart}</i>}
                    </button>
                  </li>
                )
              })}
            </ul>
            <ul className="cart">
              {cartItems.length === 0 && <li className="cart-empty">Toca un producto para agregarlo.</li>}
              {cartItems.map((i) => {
                const p = products.find((x) => x.id === i.productId)!
                return (
                  <li key={i.productId}>
                    <span className="cart-name">{i.name}</span>
                    <span className="cart-qty">
                      <button type="button" onClick={() => removeFromCart(p)} aria-label={`Quitar ${i.name}`}><Minus size={13} /></button>
                      <b>{i.qty}</b>
                      <button type="button" onClick={() => addToCart(p)} aria-label={`Agregar ${i.name}`}><Plus size={13} /></button>
                    </span>
                    <span className="cart-sub">₡{(i.qty * i.price).toLocaleString('es-CR')}</span>
                  </li>
                )
              })}
            </ul>
            <div className="cart-total">
              <span>Total</span>
              <b>₡{cartTotal.toLocaleString('es-CR')}</b>
              <button type="button" className="icon-btn" onClick={() => setCart({})} disabled={cartItems.length === 0} aria-label="Vaciar carrito" title="Vaciar carrito"><Trash2 size={15} /></button>
            </div>
          </>
        )}

        <button className="btn-primary charge-btn" type="submit" disabled={!valid}>
          {offline ? <><WifiOff size={20} /> Guardar sin conexión</> : <><QrCode size={20} /> Cobrar con QR</>}
        </button>
        <p className="charge-hint">
          {offline
            ? 'Sin señal: el cobro queda guardado en este dispositivo y se envía a Stellar al reconectar.'
            : 'El cliente escanea el QR con su wallet de Stellar y paga al instante.'}
        </p>
      </form>

    </section>
  )
}
