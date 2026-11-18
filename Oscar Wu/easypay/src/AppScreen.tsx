import { ArrowLeft, History, LogOut, Package, QrCode, RefreshCw, Wallet, Wifi, WifiOff } from 'lucide-react'
import { useEffect, useState } from 'react'
import ChargeScreen from './ChargeScreen'
import SyncBar from './SyncBar'
import CountUp from './CountUp'
import PayModal from './PayModal'
import PaymentsList from './PaymentsList'
import InventoryView from './InventoryView'
import { SEED_PRODUCTS, stockState, type CartItem, type Product } from './products'
import { createPayment, newRef, toCrc, type Currency, type Payment } from './payments'
import WalletModal from './WalletModal'
import {
  disconnectWallet,
  fetchXlmBalance,
  onWalletDisconnect,
  shortAddress,
} from './wallet'

type View = 'cobrar' | 'inventario' | 'historial'

export default function AppScreen() {
  const [address, setAddress] = useState<string | null>(null)
  const [balance, setBalance] = useState<string | null>(null)
  const [demo, setDemo] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [view, setView] = useState<View>('cobrar')
  const [payments, setPayments] = useState<Payment[]>([])
  const [syncing, setSyncing] = useState(false)
  const [offline, setOffline] = useState(false)
  const [products, setProducts] = useState<Product[]>(SEED_PRODUCTS)
  const [charging, setCharging] = useState<{ amount: number; currency: Currency; ref: string; items?: CartItem[] } | null>(null)

  const lowStock = products.filter((p) => stockState(p.stock) !== 'ok').length
  const pending = payments.filter((p) => p.status === 'pending').length
  const synced = payments.length - pending
  const totalCrc = Math.round(payments.reduce((sum, p) => sum + toCrc(p.amount, p.currency), 0))

  // MOCK: simula el envío de los pendientes. No se envía ninguna transacción a Stellar.
  function sync() {
    if (syncing) return
    setSyncing(true)
    setTimeout(() => {
      setPayments((prev) => prev.map((p) => ({ ...p, status: 'synced' as const })))
      setSyncing(false)
    }, 1500)
  }

  // Al volver "la señal" con cobros guardados, se sincronizan solos.
  function toggleOffline() {
    const next = !offline
    setOffline(next)
    if (!next && pending > 0) setTimeout(sync, 500)
  }

  function addPayment(amount: number, currency: Currency, via: 'qr' | 'offline', ref = newRef(), items?: CartItem[]) {
    setPayments((prev) => [createPayment(amount, currency, via, ref, items), ...prev])
    // Cada venta descuenta del inventario.
    if (items?.length) {
      setProducts((prev) =>
        prev.map((p) => {
          const sold = items.find((i) => i.productId === p.id)
          return sold ? { ...p, stock: Math.max(0, p.stock - sold.qty) } : p
        }),
      )
    }
  }

  useEffect(() => onWalletDisconnect(() => setAddress(null)), [])

  useEffect(() => {
    if (!address) return setBalance(null)
    // Demo: la cuenta es nueva y no existe en la red, se muestra un saldo de ejemplo.
    if (demo) return setBalance('10000')
    fetchXlmBalance(address).then(setBalance)
  }, [address, demo])

  function handleConnected(addr: string, isDemo: boolean) {
    setDemo(isDemo)
    setAddress(addr)
    setModalOpen(false)
  }

  async function handleDisconnect() {
    await disconnectWallet()
    setAddress(null)
    setDemo(false)
    setView('cobrar')
  }

  const tabs: { id: View; label: string; Icon: typeof QrCode; badge?: number }[] = [
    { id: 'cobrar', label: 'Cobrar', Icon: QrCode },
    { id: 'inventario', label: 'Inventario', Icon: Package, badge: lowStock || undefined },
    { id: 'historial', label: 'Historial', Icon: History, badge: pending || undefined },
  ]

  return (
    <main className="app dash">
      <header className="topbar">
        <div className="tb-left">
          <a className="back" href="#/"><ArrowLeft size={16} /> <span>Inicio</span></a>
          <div className="dash-brand">
            <img className="logo" src="/logo.png" alt="" />
            <span>EasyPay</span>
          </div>
        </div>

        {address ? (
          <>
            <nav className="tb-nav" aria-label="Secciones">
              {tabs.map(({ id, label, Icon, badge }) => (
                <button key={id} className={view === id ? 'on' : ''} aria-current={view === id ? 'page' : undefined} onClick={() => setView(id)}>
                  <Icon size={16} /> <span>{label}</span>
                  {badge ? <i className="badge warn">{badge}</i> : null}
                </button>
              ))}
            </nav>

            <div className="tb-right">
              <button
                type="button"
                className={`conn-switch${offline ? ' off' : ''}`}
                role="switch"
                aria-checked={offline}
                onClick={toggleOffline}
                title={offline ? 'Sin conexión: los cobros se guardan en el dispositivo' : 'En línea'}
              >
                {offline ? <WifiOff size={16} /> : <Wifi size={16} />}
                <span>{offline ? 'Sin conexión' : 'En línea'}</span>
                <i aria-hidden="true" />
              </button>
              <button className="tb-sync" onClick={sync} disabled={offline || syncing || pending === 0} title="Sincronizar cobros pendientes">
                <RefreshCw size={16} className={syncing ? 'spin' : ''} />
                <span>{syncing ? 'Sincronizando…' : 'Sincronizar'}</span>
              </button>
              <div className="wallet-chip">
                <span className="dot" />
                {demo && <span className="demo-pill">DEMO</span>}
                <div>
                  <strong className="address" title={address}>{shortAddress(address)}</strong>
                  <span className="chip-sub">
                    {balance === null ? 'Sin fondos en testnet' : <><CountUp value={Number(balance)} decimals={2} duration={1600} /> XLM</>}
                  </span>
                </div>
                <button className="icon-btn" aria-label="Desconectar wallet" title="Desconectar" onClick={handleDisconnect}>
                  <LogOut size={16} />
                </button>
              </div>
            </div>
          </>
        ) : null}
      </header>

      {address ? (
        <>
          {view === 'cobrar' && (
            <div className="dash-grid">
              <ChargeScreen
                products={products}
                offline={offline}
                onRequestQr={(amount, currency, items) => setCharging({ amount, currency, ref: newRef(), items })}
                onSaveOffline={(amount, currency, items) => addPayment(amount, currency, 'offline', newRef(), items)}
              />
              <div className="dash-side">
                <SyncBar totalCrc={totalCrc} pending={pending} synced={synced} />
                <PaymentsList payments={payments} title="Últimos cobros" limit={6} onSeeAll={() => setView('historial')} />
              </div>
            </div>
          )}

          {view === 'inventario' && <InventoryView products={products} onChange={setProducts} />}

          {view === 'historial' && (
            <section className="view hist-view" aria-label="Historial de cobros">
              <SyncBar totalCrc={totalCrc} pending={pending} synced={synced} />
              <PaymentsList payments={payments} title="Todos los cobros" />
            </section>
          )}

          <p className="demo-note">
            El QR genera un enlace de pago Stellar real (testnet). La cola sin conexión, la sincronización y el inventario son una demostración: no se guarda nada en el dispositivo ni se envía a la red.
          </p>
        </>
      ) : (
        <div className="connect">
          <img className="logo" src="/logo.png" alt="" />
          <h1>Conecta tu wallet para empezar a cobrar</h1>
          <p>Elige tu wallet de Stellar o prueba con la demo. Solo leemos tu dirección pública.</p>
          <button className="btn-primary" onClick={() => setModalOpen(true)}>
            <Wallet size={18} /> Conectar wallet
          </button>
        </div>
      )}

      {charging && address && (
        <PayModal
          amount={charging.amount}
          currency={charging.currency}
          ref_={charging.ref}
          address={address}
          demo={demo}
          onPaid={() => {
            addPayment(charging.amount, charging.currency, 'qr', charging.ref, charging.items)
            setCharging(null)
          }}
          onCancel={() => setCharging(null)}
        />
      )}
      <WalletModal open={modalOpen} onClose={() => setModalOpen(false)} onConnected={handleConnected} />
    </main>
  )
}
