import { useEffect, useState } from 'react'
import {
  ArrowRight,
  Carrot,
  Check,
  RefreshCw,
  ChevronDown,
  ListChecks,
  Shirt,
  ShieldCheck,
  Smartphone,
  Store,
  Truck,
  UtensilsCrossed,
  Wallet,
  WifiOff,
  Zap,
  type LucideIcon,
} from 'lucide-react'
import CountUp from './CountUp'

const NAV = [
  { id: 'como-funciona', label: 'Cómo funciona' },
  { id: 'beneficios', label: 'Beneficios' },
  { id: 'para-quien', label: 'Para quién' },
  { id: 'preguntas', label: 'Preguntas' },
]

const steps: { Icon: LucideIcon; title: string; text: string }[] = [
  { Icon: Wallet, title: 'Conecta tu wallet', text: 'Varial (Freighter), xBull o Albedo. Tu clave privada nunca sale de tu wallet.' },
  { Icon: WifiOff, title: 'Cobra sin señal', text: 'El cobro se guarda en tu dispositivo al instante, aunque no haya internet.' },
  { Icon: RefreshCw, title: 'Sincroniza en Stellar', text: 'Cuando vuelve la conexión, los cobros pendientes se liquidan en bloque.' },
]

const features: { Icon: LucideIcon; title: string; text: string }[] = [
  { Icon: WifiOff, title: 'Funciona sin señal', text: 'Pensado para ferias, pulperías y zonas con mala cobertura.' },
  { Icon: Zap, title: 'Liquidación rápida', text: 'Stellar confirma en segundos y con comisiones mínimas.' },
  { Icon: ShieldCheck, title: 'Sin custodia', text: 'Los pagos van directo a tu wallet. Nadie más toca tu dinero.' },
  { Icon: Wallet, title: 'Wallet real', text: 'Conexión con Stellar Wallets Kit. Hoy funciona en testnet.' },
  { Icon: ListChecks, title: 'Cuentas claras', text: 'Ves cuántos cobros están pendientes y cuántos ya sincronizados.' },
  { Icon: Smartphone, title: 'Hecho para el celular', text: 'Una mano, pantalla pequeña, botones grandes.' },
]

const useCases: { Icon: LucideIcon; title: string; text: string }[] = [
  { Icon: Store, title: 'Pulperías', text: 'Cobra aunque el router esté caído.' },
  { Icon: Carrot, title: 'Ferias del agricultor', text: 'Mucha gente, poca señal, cero filas.' },
  { Icon: UtensilsCrossed, title: 'Sodas y comedores', text: 'Cobra en la mesa sin datáfono.' },
  { Icon: Truck, title: 'Food trucks', text: 'Vende en cualquier esquina.' },
  { Icon: Shirt, title: 'Emprendedores', text: 'Ventas en ferias, eventos y redes.' },
]

const faqs = [
  { q: '¿Necesito internet para cobrar?', a: 'La idea de EasyPay es que no. El cobro se registra en tu dispositivo y se sincroniza cuando vuelve la señal. Hoy esa cola es una demostración visual.' },
  { q: '¿Qué wallet necesito?', a: 'Una wallet de Stellar compatible, por ejemplo Varial (Freighter), xBull o Albedo, configurada en testnet.' },
  { q: '¿Se usa dinero real?', a: 'No. La conexión de wallet y el saldo funcionan en la red de pruebas (testnet) de Stellar.' },
  { q: '¿EasyPay custodia mi dinero?', a: 'No. Tu clave privada se queda en tu wallet; la app solo lee tu dirección pública.' },
]

const checklist = [
  'Conecta tu wallet de Stellar',
  'Registra cobros en segundos',
  'Mira pendientes y sincronizados',
  'Sin custodia ni intermediarios',
]

const partners = ['Stellar', 'Varial', 'xBull', 'Albedo', 'USDC', 'Horizon', 'Soroban']

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

export default function Landing() {
  const [open, setOpen] = useState<number | null>(0)
  const [scrolled, setScrolled] = useState(false)

  // Barra como la de GCM: transparente arriba, píldora blanca al bajar.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Aparición suave: portada al cargar y titulares/filas al entrar en pantalla.
  useEffect(() => {
    const els = Array.from(
      document.querySelectorAll<HTMLElement>('.lp-copy > *, .lp-phone, .lp-title, .lp-step, .lp-big-stat'),
    )
    els.forEach((el) => {
      const i = Array.from(el.parentElement?.children ?? []).indexOf(el)
      el.style.setProperty('--rv-delay', `${Math.min(i, 5) * 90}ms`)
      el.setAttribute('data-rv', 'out')
    })
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.setAttribute('data-rv', 'in')
          io.unobserve(e.target)
        }
      }),
      { threshold: 0.15, rootMargin: '0px 0px -6% 0px' },
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])

  // Igual que Recallyah: oculta la barra de scroll nativa en la landing.
  useEffect(() => {
    document.body.classList.add('landing-scroll-theme')
    return () => document.body.classList.remove('landing-scroll-theme')
  }, [])

  return (
    <div className="lp">
      <div className={`lp-top${scrolled ? ' scrolled' : ''}`}>
        <header className="lp-topbar">
          <a className="lp-brand" href="#/" aria-label="EasyPay, inicio">
            <img className="logo" src={scrolled ? '/logo-dark.png' : '/logo.png'} alt="" /> <span>EasyPay</span>
          </a>
          <nav className="lp-links" aria-label="Principal">
            {NAV.map((n) => (
              <button key={n.id} onClick={() => scrollToId(n.id)}>{n.label}</button>
            ))}
          </nav>
          <div className="lp-actions">
            <a className="lp-topcta" href="#/app">Abrir app</a>
          </div>
        </header>
      </div>

      {/* Portada */}
      <section className="lp-hero">
        <div className="lp-copy">
          <h1>
            Cobra sin internet.<br />
            <span className="lp-grad">Liquida en Stellar.</span>
          </h1>
          <p>
            EasyPay guarda tus cobros cuando se cae la señal y los sincroniza con Stellar apenas
            vuelve. Para negocios que no pueden parar de vender.
          </p>
          <div className="lp-cta">
            <a className="lp-btn lp-btn--primary" href="#/app">Probar la app <ArrowRight size={18} /></a>
            <button className="lp-btn lp-btn--ghost" onClick={() => scrollToId('como-funciona')}>Cómo funciona</button>
          </div>
        </div>

        <div className="lp-phone" aria-hidden="true">
          <div className="lp-phone-bar"><span className="dot" /> Wallet conectada · testnet</div>
          <div className="lp-phone-label">Total de hoy</div>
          <div className="lp-phone-amount">₡ <CountUp value={12500} duration={2000} /></div>
          <div className="lp-phone-offline"><WifiOff size={15} /> Sin conexión · 1 cobro en cola</div>
          <div className="lp-mock-row"><span>Café + empanada</span><b className="warn">Pendiente</b></div>
          <div className="lp-mock-row"><span>Tortillas x3</span><b className="ok">Sincronizado</b></div>
          <div className="lp-mock-row"><span>Fruta de temporada</span><b className="ok">Sincronizado</b></div>
        </div>
      </section>

      <section className="lp-strip" aria-label="Funciona con">
        <p>Funciona con la red y las wallets de Stellar</p>
        <div className="lp-marquee">
          <div className="lp-track">
            {[...partners, ...partners].map((p, i) => (
              <span className="lp-logo" key={i}>{p}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Banda morada: pasos (sí es una secuencia, por eso van numerados) */}
      <section id="como-funciona" className="lp-band lp-band--deep">
        <div className="lp-wrap">
          <h2 className="lp-title">Tres pasos y estás cobrando</h2>
          <ol className="lp-steps">
            {steps.map(({ Icon, title, text }, i) => (
              <li className="lp-step" key={title}>
                <span className="lp-step-node">
                  <Icon size={30} strokeWidth={1.8} />
                  <span className="lp-step-n" aria-hidden="true">{i + 1}</span>
                </span>
                <h3>{title}</h3>
                <p>{text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Banda clara: dos ideas, texto y lista simple */}
      <section className="lp-band lp-band--pale">
        <div className="lp-wrap lp-alt">
          <div className="lp-alt-row">
            <div>
              <h2 className="lp-title">Cobra ahora, sincroniza después.</h2>
              <p>Si se cae el internet, el cobro queda en la cola de tu dispositivo. Cuando vuelve la señal, se envía a Stellar en bloque.</p>
              <button className="lp-link" onClick={() => { window.location.hash = '#/app' }}>Probar el flujo <ArrowRight size={16} /></button>
            </div>
            <ul className="lp-list" aria-hidden="true">
              <li><span>Café</span><b className="warn">En cola</b></li>
              <li><span>Empanada</span><b className="warn">En cola</b></li>
              <li><span>Señal recuperada</span><b className="ok">Enviando…</b></li>
            </ul>
          </div>
          <div className="lp-alt-row rev">
            <div>
              <h2 className="lp-title">Tu dinero va directo a tu wallet.</h2>
              <p>Conecta Varial (Freighter), xBull o Albedo. EasyPay solo lee tu dirección pública: la clave privada nunca sale de tu wallet.</p>
              <button className="lp-link" onClick={() => { window.location.hash = '#/app' }}>Conectar wallet <ArrowRight size={16} /></button>
            </div>
            <ul className="lp-list" aria-hidden="true">
              <li><span>Wallet conectada</span><b className="ok">testnet</b></li>
              <li><span>Dirección</span><b className="mono">GA7Q…K3XM</b></li>
              <li><span>Saldo</span><b><CountUp value={10000} whenVisible /> XLM</b></li>
            </ul>
          </div>
        </div>
      </section>

      {/* Banda morada: tres datos clave, cada uno con su explicación */}
      <section className="lp-band lp-band--brand lp-bignums" aria-label="EasyPay en cifras">
        <div className="lp-wrap lp-bignums-row">
          <div className="lp-big-stat">
            <b><CountUp value={3} whenVisible duration={1200} /></b>
            <h3>pasos para cobrar</h3>
            <p>Conectas tu wallet, cobras y sincronizas. Nada más.</p>
          </div>
          <div className="lp-big-stat">
            <b><CountUp value={0} whenVisible /></b>
            <h3>custodia de tu dinero</h3>
            <p>Los pagos van directo a tu wallet, sin pasar por EasyPay.</p>
          </div>
          <div className="lp-big-stat">
            <b><CountUp value={1} whenVisible duration={900} /></b>
            <h3>wallet: la tuya</h3>
            <p>Varial (Freighter), xBull o Albedo. Tú conservas la clave.</p>
          </div>
        </div>
      </section>

      {/* Banda oscura: beneficios en lista a dos columnas */}
      <section id="beneficios" className="lp-band lp-band--ink">
        <div className="lp-wrap">
          <h2 className="lp-title">Todo tu cobro en un solo lugar</h2>
          <ul className="lp-features">
            {features.map(({ Icon, title, text }) => (
              <li key={title}>
                <Icon size={26} strokeWidth={1.8} />
                <div>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Banda clara: índice tipográfico de negocios */}
      <section id="para-quien" className="lp-band lp-band--pale">
        <div className="lp-wrap">
          <h2 className="lp-title">Hecho para negocios como el tuyo</h2>
          <ul className="lp-index">
            {useCases.map(({ Icon, title, text }) => (
              <li key={title}>
                <a href="#/app">
                  <span className="lp-index-name">{title}</span>
                  <span className="lp-index-text">{text}</span>
                  <Icon size={28} strokeWidth={1.6} aria-hidden="true" />
                </a>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Banda oscura: preguntas sin cajas */}
      <section id="preguntas" className="lp-band lp-band--ink">
        <div className="lp-wrap lp-faq">
          <h2 className="lp-title">Preguntas frecuentes</h2>
          <div>
            {faqs.map((f, i) => (
              <div className={`lp-faq-item${open === i ? ' open' : ''}`} key={f.q}>
                <button className="lp-faq-q" onClick={() => setOpen(open === i ? null : i)} aria-expanded={open === i}>
                  <span>{f.q}</span>
                  <ChevronDown size={22} className="lp-chev" />
                </button>
                {open === i && <p className="lp-faq-a">{f.a}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Cierre */}
      <section className="lp-band lp-band--deep lp-final">
        <div className="lp-wrap">
          <div className="lp-cta-card">
            <img className="lp-cta-mark" src="/logo.png" alt="" aria-hidden="true" />
            <div className="lp-cta-main">
              <h2>Pon tu cobro en orden hoy.</h2>
              <p>Conecta tu wallet de testnet y prueba el flujo completo en un minuto.</p>
              <a className="lp-btn lp-btn--primary" href="#/app">Abrir EasyPay <ArrowRight size={18} /></a>
            </div>
            <ul className="lp-check">
              {checklist.map((c) => (
                <li key={c}><span className="lp-tick"><Check size={16} strokeWidth={3} /></span> {c}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <footer className="lp-foot">
        <div className="lp-foot-brand">
          <a className="lp-brand" href="#/"><img className="logo" src="/logo.png" alt="" /> <span>EasyPay</span></a>
          <p>Cobra aunque no tengas internet.</p>
        </div>
        <div className="lp-foot-cols">
          <div>
            <b>Producto</b>
            <button onClick={() => scrollToId('como-funciona')}>Cómo funciona</button>
            <a href="#/app">Abrir app</a>
          </div>
          <div>
            <b>Ayuda</b>
            <button onClick={() => scrollToId('para-quien')}>Para quién</button>
            <button onClick={() => scrollToId('preguntas')}>Preguntas</button>
          </div>
        </div>
        <small>© 2026 EasyPay · Pura Vida Bootcamp · Stellar · Por Oscar Wu</small>
      </footer>
    </div>
  )
}
