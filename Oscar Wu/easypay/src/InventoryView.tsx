import { Minus, Plus, Trash2 } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { ICONS, stockState, type Product } from './products'

interface Props {
  products: Product[]
  onChange: (products: Product[]) => void
}

/** Inventario básico: ver stock, ajustar, agregar y quitar productos (todo en memoria, demo). */
export default function InventoryView({ products, onChange }: Props) {
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [stock, setStock] = useState('')

  const value = products.reduce((s, p) => s + p.price * p.stock, 0)
  const low = products.filter((p) => stockState(p.stock) !== 'ok').length

  function adjust(id: string, delta: number) {
    onChange(products.map((p) => (p.id === id ? { ...p, stock: Math.max(0, p.stock + delta) } : p)))
  }

  function add(e: FormEvent) {
    e.preventDefault()
    const pr = Number(price)
    const st = Number(stock)
    if (!name.trim() || !(pr > 0) || !(st >= 0)) return
    onChange([...products, { id: crypto.randomUUID(), name: name.trim(), price: pr, stock: Math.floor(st), icon: 'other' }])
    setName('')
    setPrice('')
    setStock('')
  }

  return (
    <section className="view inv-view" aria-label="Inventario">
      <div className="inv">

        <div className="inv-stats">
          <div><b>{products.length}</b><span>productos</span></div>
          <div><b>₡{value.toLocaleString('es-CR')}</b><span>valor en stock</span></div>
          <div className={low ? 'warn' : ''}><b>{low}</b><span>con poco stock</span></div>
        </div>

        <ul className="inv-list">
          {products.map((p) => {
            const Icon = ICONS[p.icon]
            const st = stockState(p.stock)
            return (
              <li key={p.id}>
                <Icon size={18} strokeWidth={1.8} />
                <span className="inv-name"><b>{p.name}</b><small>₡{p.price.toLocaleString('es-CR')}</small></span>
                <span className={`inv-state ${st}`}>{st === 'out' ? 'Agotado' : st === 'low' ? 'Bajo' : 'OK'}</span>
                <span className="cart-qty">
                  <button onClick={() => adjust(p.id, -1)} aria-label={`Quitar una unidad de ${p.name}`}><Minus size={13} /></button>
                  <b>{p.stock}</b>
                  <button onClick={() => adjust(p.id, 1)} aria-label={`Agregar una unidad de ${p.name}`}><Plus size={13} /></button>
                </span>
                <button className="icon-btn" onClick={() => onChange(products.filter((x) => x.id !== p.id))} aria-label={`Eliminar ${p.name}`} title="Eliminar"><Trash2 size={14} /></button>
              </li>
            )
          })}
          {products.length === 0 && <li className="wm-empty">No hay productos. Agrega el primero abajo.</li>}
        </ul>

        <form className="inv-add" onSubmit={add}>
          <input placeholder="Producto" value={name} onChange={(e) => setName(e.target.value)} aria-label="Nombre del producto" />
          <input placeholder="Precio ₡" type="number" min="1" value={price} onChange={(e) => setPrice(e.target.value)} aria-label="Precio en colones" />
          <input placeholder="Stock" type="number" min="0" value={stock} onChange={(e) => setStock(e.target.value)} aria-label="Cantidad en stock" />
          <button className="btn-primary" type="submit" disabled={!name.trim() || !(Number(price) > 0) || stock === ''}>Agregar</button>
        </form>
      </div>
    </section>
  )
}
