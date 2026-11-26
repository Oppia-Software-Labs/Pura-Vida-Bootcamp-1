import { useEffect, useState } from 'react'
import { WalletButton } from './components/WalletButton'
import { RegisterGame } from './components/RegisterGame'
import { VerifyGame } from './components/VerifyGame'
import { History } from './components/History'
import { PlayGame } from './components/PlayGame'
import { CameraGame } from './components/CameraGame'
import { CONTRACT_ID } from './lib/config'

type Tab = 'home' | 'play' | 'camera' | 'register' | 'verify' | 'history'

const TABS: { id: Tab; label: string }[] = [
  { id: 'home', label: 'Inicio' },
  { id: 'play', label: 'Jugar' },
  { id: 'camera', label: 'Cámara' },
  { id: 'register', label: 'Registrar' },
  { id: 'verify', label: 'Verificar' },
  { id: 'history', label: 'Historial' },
]

const STEPS: { n: string; t: string; d: string; to: Tab; cta: string }[] = [
  { n: '01', t: 'Conectá tu wallet', d: 'Instalá Freighter, pasala a Testnet y tocá “Conectar wallet” arriba a la derecha. Esa dirección firma tus registros.', to: 'play', cta: 'Ir a jugar' },
  { n: '02', t: 'Jugá en la app', d: 'Elegí nombres y control de tiempo, jugá en el tablero y al terminar registrá la partida con un clic.', to: 'play', cta: 'Jugar' },
  { n: '03', t: 'O usá la cámara', d: 'Con el vision-bridge corriendo, la cámara lee un tablero físico y arma el PGN jugada a jugada.', to: 'camera', cta: 'Abrir cámara' },
  { n: '04', t: 'Registrá un PGN', d: '¿Jugaste en otro lado? Pegá el PGN con blancas, negras y resultado. Se guarda su hash on-chain una sola vez.', to: 'register', cta: 'Registrar' },
  { n: '05', t: 'Verificá', d: 'Pegá cualquier PGN y comprobá si coincide con una partida registrada. Una jugada distinta cambia todo el hash.', to: 'verify', cta: 'Verificar' },
  { n: '06', t: 'Revisá tus partidas', d: 'Mirá todas tus partidas registradas con resultados, actividad por mes y ranking de jugadores.', to: 'history', cta: 'Ver partidas' },
]

const PILLARS = [
  { t: 'Hash inmutable', d: 'Las jugadas SAN se convierten en un SHA-256 único.' },
  { t: 'Escritura única', d: 'El contrato Soroban guarda cada registro una sola vez.' },
  { t: 'Verificación abierta', d: 'Cualquiera puede comprobar una partida, sin pedir permiso.' },
]

const EXPLORER = `https://stellar.expert/explorer/testnet/contract/${CONTRACT_ID}`

function Splash() {
  const [gone, setGone] = useState(false)
  const [hidden, setHidden] = useState(false)
  useEffect(() => {
    const a = setTimeout(() => setGone(true), 1100)
    const b = setTimeout(() => setHidden(true), 1700)
    return () => { clearTimeout(a); clearTimeout(b) }
  }, [])
  if (hidden) return null
  return (
    <div className={`splash${gone ? ' is-gone' : ''}`} aria-hidden="true">
      <div className="splash-board">
        {Array.from({ length: 16 }, (_, i) => (
          <span key={i} className={(Math.floor(i / 4) + i) % 2 ? 'd' : 'l'} style={{ ['--i' as string]: i }} />
        ))}
      </div>
      <p className="splash-name">Chess <em>Ledger</em></p>
      <span className="splash-bar"><span /></span>
    </div>
  )
}


// La primera vez la animación espera al splash; después aparece directo.
const delay = (d: number) => `${(performance.now() < 2500 ? 1.15 : 0) + d}s`

function Home({ go }: { go: (t: Tab) => void }) {
  return (
    <div className="home">
      <section className="hero">
        <div className="hero-glow" aria-hidden="true" />
        <p className="hero-kicker reveal" style={{ ['--d' as string]: delay(0) }}>Cada jugada, para siempre.</p>
        <h1 className="reveal" style={{ ['--d' as string]: delay(0.1) }}>
          Tu partida,<br /><em>inmutable</em> on-chain.
        </h1>
        <p className="hero-sub reveal" style={{ ['--d' as string]: delay(0.25) }}>
          Jugá, registrá y verificá partidas de ajedrez en Stellar Soroban. Sin planillas de papel que se puedan alterar.
        </p>
        <div className="hero-cta reveal" style={{ ['--d' as string]: delay(0.4) }}>
          <button className="btn-primary" onClick={() => go('play')}>Empezar a jugar <span aria-hidden>→</span></button>
          <button className="btn-ghost" onClick={() => go('verify')}>Verificar un PGN</button>
        </div>
      </section>

      <section className="about reveal" style={{ ['--d' as string]: delay(0.55) }}>
        <div className="about-text">
          <span className="eyebrow">Quiénes somos</span>
          <h2>Ajedrez con <em>memoria</em> que no se borra.</h2>
          <p>
            Chess Ledger nace en el Pura Vida Bootcamp para resolver un problema simple: las planillas de papel se pierden, se
            corrigen o se discuten. Acá cada partida queda sellada en la blockchain de Stellar, con su autor, jugadores, resultado y fecha.
          </p>
          <p>Para clubes, torneos y jugadores que quieren poder demostrar que una partida existió, tal como se jugó.</p>
        </div>
        <ul className="pillars">
          {PILLARS.map((p) => <li key={p.t}><b>{p.t}</b><span>{p.d}</span></li>)}
        </ul>
      </section>

      <section className="steps-wrap">
        <h2 className="title"><small>Cómo se</small>Usa</h2>
        <div className="features">
          {STEPS.map((f, i) => (
            <article key={f.n} className="feature reveal" style={{ ['--d' as string]: delay(0.65 + i * 0.08) }}>
              <span className="feature-n">Paso {f.n}</span>
              <h3>{f.t}</h3>
              <p>{f.d}</p>
              <button className="feature-go" onClick={() => go(f.to)}>{f.cta} <span aria-hidden>→</span></button>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}

export default function App() {
  const [address, setAddress] = useState<string>()
  const [tab, setTab] = useState<Tab>('home')

  function go(t: Tab) {
    setTab(t)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <>
      <Splash />

      <header className="nav">
        <div className="nav-inner">
          <a className="brand" href="#" onClick={(e) => { e.preventDefault(); go('home') }}>
            <span className="brand-mark">♞</span>
            Chess Ledger
          </a>
          <nav className="tabs" aria-label="Secciones">
            {TABS.map((t) => (
              <button key={t.id} className={tab === t.id ? 'tab active' : 'tab'} onClick={() => go(t.id)}>
                {t.label}
              </button>
            ))}
          </nav>
          <WalletButton address={address} onConnect={setAddress} />
        </div>
      </header>

      <main className="content" id="app">
        <div key={tab} className="tab-view">
          {tab === 'home' && <Home go={go} />}
          {tab === 'play' && <PlayGame address={address} />}
          {tab === 'camera' && <CameraGame address={address} />}
          {tab === 'register' && <RegisterGame address={address} />}
          {tab === 'verify' && <VerifyGame address={address} />}
          {tab === 'history' && <History address={address} />}
        </div>
      </main>

      <footer className="footer">
        <div className="footer-glow" aria-hidden="true" />
        <div className="footer-inner">
          <div className="footer-top">
            <div className="footer-brand">
              <span className="brand"><span className="brand-mark">♞</span>Chess Ledger</span>
              <p>Registro de partidas de ajedrez on-chain. Demostrá que tu partida existía, tal como se jugó.</p>
            </div>
            <div className="footer-col">
              <h4>Producto</h4>
              {TABS.map((t) => <button key={t.id} className="footer-link" onClick={() => go(t.id)}>{t.label}</button>)}
            </div>
            <div className="footer-col">
              <h4>Red</h4>
              <a className="footer-link" href={EXPLORER} target="_blank" rel="noreferrer">Contrato en Stellar Expert ↗</a>
              <a className="footer-link" href="https://www.freighter.app/" target="_blank" rel="noreferrer">Freighter Wallet ↗</a>
              <a className="footer-link" href="https://developers.stellar.org/docs/build/smart-contracts/overview" target="_blank" rel="noreferrer">Soroban Docs ↗</a>
            </div>
          </div>

          <p className="footer-sign">Diseñado y desarrollado por <em>Joaquin Pappa</em></p>

          <div className="footer-bottom">
            <span>© {new Date().getFullYear()} Joaquin Pappa. Todos los derechos reservados.</span>
            <span className="footer-badges">
              <span className="dot" /> Stellar Testnet · Soroban · Pura Vida Bootcamp
            </span>
          </div>
        </div>
      </footer>
    </>
  )
}
