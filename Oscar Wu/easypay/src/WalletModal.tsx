import { ArrowLeft, Check, ExternalLink, FlaskConical, Search, ShieldCheck, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { connectWithWallet, createDemoAddress, listWallets, type WalletInfo } from './wallet'

type Step =
  | { name: 'list' }
  | { name: 'connecting'; wallet: WalletInfo }
  | { name: 'error'; wallet: WalletInfo; message: string }
  | { name: 'demo-approve' }
  | { name: 'demo-connecting' }

interface Props {
  open: boolean
  onClose: () => void
  /** `demo` = true cuando se conectó con la wallet de demostración. */
  onConnected: (address: string, demo: boolean) => void
}

/** Selector de wallets propio: lista escalable con búsqueda + segundo paso de aprobación. */
export default function WalletModal({ open, onClose, onConnected }: Props) {
  const [step, setStep] = useState<Step>({ name: 'list' })
  const [wallets, setWallets] = useState<WalletInfo[] | null>(null)
  const [query, setQuery] = useState('')
  const searchRef = useRef<HTMLInputElement>(null)
  const attempt = useRef(0)

  useEffect(() => {
    if (!open) return
    setStep({ name: 'list' })
    setQuery('')
    listWallets().then(setWallets).catch(() => setWallets([]))
  }, [open])

  useEffect(() => {
    if (open && step.name === 'list') searchRef.current?.focus()
  }, [open, step.name])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return (wallets ?? []).filter((w) => w.name.toLowerCase().includes(q))
  }, [wallets, query])

  function close() {
    attempt.current++ // invalida cualquier conexión en curso
    onClose()
  }

  async function pickWallet(wallet: WalletInfo) {
    const id = ++attempt.current
    setStep({ name: 'connecting', wallet })
    try {
      const address = await connectWithWallet(wallet.id)
      if (id !== attempt.current) return
      onConnected(address, false)
    } catch (e) {
      if (id !== attempt.current) return
      const message = e instanceof Error && e.message ? e.message : 'No se pudo conectar con la wallet'
      setStep({ name: 'error', wallet, message })
    }
  }

  function approveDemo() {
    const id = ++attempt.current
    setStep({ name: 'demo-connecting' })
    setTimeout(() => {
      if (id !== attempt.current) return
      onConnected(createDemoAddress(), true)
    }, 1300)
  }

  if (!open) return null

  return (
    <div className="wm-backdrop" onMouseDown={(e) => e.target === e.currentTarget && close()}>
      <div className="wm" role="dialog" aria-modal="true" aria-label="Conectar wallet">
        {step.name === 'list' && (
          <>
            <header className="wm-head">
              <h2>Conectar wallet</h2>
              <button className="wm-x" onClick={close} aria-label="Cerrar"><X size={18} /></button>
            </header>

            <button className="wm-demo" onClick={() => setStep({ name: 'demo-approve' })}>
              <span className="wm-demo-ic"><FlaskConical size={20} /></span>
              <span>
                <b>Wallet de demostración</b>
                <small>No necesitas instalar nada</small>
              </span>
              <span className="wm-tag demo">DEMO</span>
            </button>

            <label className="wm-search">
              <Search size={16} />
              <input
                ref={searchRef}
                placeholder={`Buscar entre ${wallets?.length ?? '…'} wallets`}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>

            <ul className="wm-list">
              {wallets === null && <li className="wm-empty">Cargando wallets…</li>}
              {wallets !== null && filtered.length === 0 && <li className="wm-empty">No hay wallets con ese nombre.</li>}
              {filtered.map((w) => (
                <li key={w.id}>
                  <button onClick={() => pickWallet(w)}>
                    <img src={w.icon} alt="" width={26} height={26} />
                    <span className="wm-name">
                      <b>{w.name}</b>
                      <small className={w.isAvailable ? 'ok' : ''}>{w.isAvailable ? 'Detectada' : 'Instalar'}</small>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            <p className="wm-foot"><ShieldCheck size={14} /> Solo leemos tu dirección pública. Red: testnet.</p>
          </>
        )}

        {step.name === 'connecting' && (
          <div className="wm-step">
            <img className="wm-big" src={step.wallet.icon} alt="" />
            <h2>Conectando con {step.wallet.name}</h2>
            <p>Aprueba la conexión en la ventana de {step.wallet.name}.</p>
            <span className="spinner big" aria-hidden="true" />
            <button className="btn-ghost" onClick={close}>Cancelar</button>
          </div>
        )}

        {step.name === 'error' && (
          <div className="wm-step">
            <img className="wm-big" src={step.wallet.icon} alt="" />
            <h2>No pudimos conectar</h2>
            <p>{step.wallet.isAvailable ? step.message : `No detectamos ${step.wallet.name} en este navegador.`}</p>
            <div className="wm-actions">
              {!step.wallet.isAvailable && (
                <a className="btn-ghost wm-link" href={step.wallet.url} target="_blank" rel="noreferrer">
                  Instalar {step.wallet.name} <ExternalLink size={14} />
                </a>
              )}
              <button className="btn-primary" onClick={() => setStep({ name: 'demo-approve' })}>Probar con la demo</button>
              <button className="btn-ghost" onClick={() => setStep({ name: 'list' })}><ArrowLeft size={14} /> Volver</button>
            </div>
          </div>
        )}

        {step.name === 'demo-approve' && (
          <div className="wm-step">
            <span className="wm-tag demo">DEMO</span>
            <span className="wm-demo-ic big"><FlaskConical size={30} /></span>
            <h2>Demo Wallet</h2>
            <p><b>EasyPay</b> quiere ver la dirección pública de tu cuenta.</p>
            <ul className="wm-perms">
              <li><Check size={14} /> Ver tu dirección pública</li>
              <li><Check size={14} /> Red: Stellar testnet</li>
              <li className="no"><X size={14} /> No puede mover tus fondos</li>
            </ul>
            <div className="wm-actions row">
              <button className="btn-ghost" onClick={() => setStep({ name: 'list' })}>Rechazar</button>
              <button className="btn-primary" onClick={approveDemo}>Aprobar</button>
            </div>
          </div>
        )}

        {step.name === 'demo-connecting' && (
          <div className="wm-step">
            <span className="wm-demo-ic big"><FlaskConical size={30} /></span>
            <h2>Conectando…</h2>
            <p>Creando tu cuenta de demostración en testnet.</p>
            <span className="spinner big" aria-hidden="true" />
          </div>
        )}
      </div>
    </div>
  )
}
