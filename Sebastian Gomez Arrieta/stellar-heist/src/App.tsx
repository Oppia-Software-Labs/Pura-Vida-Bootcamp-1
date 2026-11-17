import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, MotionConfig, motion } from 'motion/react'
import { ArrowRight, ChevronRight, CircleHelp, Crosshair, Fingerprint, Orbit, ShieldCheck, X } from 'lucide-react'
import { Vault } from './components/Vault'
import { Dialog } from './components/Dialog'
import { MagneticButton } from './components/MagneticButton'
import { MissionHUD } from './components/MissionHUD'
import { useExperienceController } from './experience/useExperienceController'
import { useDocumentVisibility } from './hooks/useDocumentVisibility'
import { useMotionPreference } from './hooks/useMotionPreference'
import { introduction, missions } from './data/missions'
import { useWallet } from './hooks/useWallet'
import './App.css'

const bootLabels = ['Preparando tu entrada…', 'Encendiendo la cámara…', 'Despertando la bóveda…', 'Todo listo.']

function App() {
  const wallet = useWallet()
  const completedCount = (wallet.identity ? 1 : 0) + (wallet.proof ? 1 : 0)
  const proofVisualState = wallet.proof ? 'verified' : ['requesting', 'verifying'].includes(wallet.proofStatus) ? 'scanning' : 'idle'
  const prefersReduced = useMotionPreference()
  const tabVisible = useDocumentVisibility()
  const [lightQuality, setLightQuality] = useState(false)
  const [renderMode, setRenderMode] = useState<'loading' | 'webgl' | 'fallback'>('loading')
  const [briefingOpen, setBriefingOpen] = useState(false)
  const paused = prefersReduced
  const controller = useExperienceController(paused, tabVisible, renderMode !== 'loading')
  const { phase, missionId, signals, titleVisible, bootStep, enterMission, returnToLobby } = controller
  const onSlowHardware = useCallback(() => setLightQuality(true), [])
  const onReady = useCallback(() => setRenderMode('webgl'), [])
  const onFallback = useCallback(() => setRenderMode('fallback'), [])
  const mission = missions.find(item => item.id === missionId) ?? missions[0]
  const traveling = phase === 'entering' || phase === 'returning'
  const lobby = phase === 'lobby' || phase === 'boot'
  const openMission = useCallback((id: number) => enterMission(id > 1 && !wallet.identity ? 1 : id === 3 && !wallet.proof ? 2 : id), [enterMission, wallet.identity, wallet.proof])
  useEffect(() => {
    if (!wallet.identity && missionId > 1) enterMission(1)
    else if (!wallet.proof && missionId === 3) enterMission(2)
  }, [wallet.identity, wallet.proof, missionId, enterMission])
  const mainRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!traveling) return
    const frame = requestAnimationFrame(() => {
      document.querySelector<HTMLButtonElement>('.travel-actions button')?.focus({ preventScroll: true })
    })
    return () => cancelAnimationFrame(frame)
  }, [traveling, missionId])

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !event.defaultPrevented && !briefingOpen && !lobby) returnToLobby()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [briefingOpen, lobby, returnToLobby])

  return <MotionConfig reducedMotion={paused ? 'always' : 'never'}>
    <div className={`experience-shell ${paused ? 'motion-paused' : ''} phase-${phase}`} data-phase={phase}>
      <Vault proofState={proofVisualState} identityComplete={wallet.identity} animated={!paused && tabVisible} signals={signals} missionId={missionId} lightQuality={lightQuality} onReady={onReady} onFallback={onFallback} onSlowHardware={onSlowHardware} />
      <div className="world-vignette" aria-hidden="true" />
      <div className="film-grain" aria-hidden="true" />
      <a className="skip-link" href="#experience-main">Saltar al contenido</a>
      <header className="world-header">
        <button className="brand" onClick={returnToLobby} aria-label="Stellar Heist, regresar al inicio"><span className="brand-symbol"><Orbit size={27} strokeWidth={1.1} aria-hidden="true" /></span><span>STELLAR <strong>HEIST</strong><small>THE GENESIS VAULT</small></span></button>
        <div className="header-location"><span className="status-dot" /><span>GÉNESIS <i>/</i> 07</span></div>
        <div className="header-actions">
          <button className="utility-button help-button" onClick={() => setBriefingOpen(true)} aria-label="Leer informe de la operación"><CircleHelp size={16} aria-hidden="true" /></button>
        </div>
      </header>

      <main ref={mainRef} id="experience-main" className="experience-main" tabIndex={-1}>
        <AnimatePresence mode="wait" initial={false}>
          {lobby && titleVisible && <motion.section key="lobby" className="lobby-copy" aria-labelledby="page-heading"
            initial={{ opacity: 0, y: paused ? 0 : 50, filter: paused ? 'none' : 'blur(12px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} exit={{ opacity: 0, y: paused ? 0 : -30, filter: paused ? 'none' : 'blur(9px)' }}
            transition={{ duration: paused ? 0 : 0.85, ease: [0.16, 1, 0.3, 1] }} onAnimationComplete={() => { if (phase === 'lobby') document.getElementById('page-heading')?.focus({ preventScroll: true }) }}>
            <p className="eyebrow"><span className="small-rule" /> Una experiencia en Stellar</p>
            <h1 id="page-heading" tabIndex={-1}>STELLAR <span>HEIST</span></h1>
            <p className="hero-subtitle">THE GENESIS VAULT</p>
            <p className="hero-description">Tres sellos. Tu identidad es la llave.</p>
            <MagneticButton paused={paused} className="primary-button" onClick={() => enterMission(1)}><Fingerprint size={20} aria-hidden="true" /><span>Iniciar infiltración</span><ArrowRight size={19} aria-hidden="true" /></MagneticButton>

          </motion.section>}
          {phase === 'mission' && <MissionHUD key={`mission-${missionId}`} mission={mission} paused={paused} wallet={wallet} onReturn={returnToLobby} onNext={() => openMission(missionId % 3 + 1)} />}
        </AnimatePresence>

        {phase === 'boot' && <section className={`boot-status ${titleVisible ? 'boot-compact' : ''}`} aria-label="Introducción cinematográfica"><div className="boot-orbit" aria-hidden="true"><Orbit size={32} strokeWidth={0.8} /></div><p className="boot-label" role="status">{bootLabels[bootStep]}</p><div className="boot-sequence" aria-hidden="true">{[0, 1, 2, 3].map(i => <i key={i} className={i <= bootStep ? 'lit' : ''} />)}</div></section>}

        {traveling && <section className="travel-hud" role="status" aria-label="Transición cinematográfica"><div className="travel-reticle" aria-hidden="true"><Crosshair size={70} strokeWidth={0.6} /></div><p className="eyebrow">{phase === 'entering' ? `Sello 0${missionId}` : 'De regreso'}</p><h2>{phase === 'entering' ? mission.title : 'Génesis te espera.'}</h2><div className="travel-actions"><button className="text-button" onClick={returnToLobby}>Volver a la bóveda</button></div></section>}


      </main>

      <section className="protocol-dock" aria-labelledby="protocol-heading">
        <div className="dock-heading"><span id="protocol-heading">Tres sellos. Una bóveda.</span><span role="progressbar" aria-label="Protocolos verificados" aria-valuenow={completedCount} aria-valuemin={0} aria-valuemax={3}>{completedCount} <i>de 3</i></span></div>
        <nav aria-label="Seleccionar misión">{missions.map(item => {
          const Icon = item.icon
          const locked = item.id === 2 ? !wallet.identity : item.id === 3 && !wallet.proof
          const completed = item.id === 1 ? wallet.identity : item.id === 2 && wallet.proof
          return <button key={item.id} className={`protocol-button ${!lobby && missionId === item.id ? 'selected' : ''}`} onClick={() => openMission(item.id)} disabled={locked} aria-disabled={locked} aria-current={!lobby && missionId === item.id ? 'step' : undefined} aria-label={`Explorar misión ${item.id}: ${item.title}. ${completed ? 'Completada.' : locked ? 'Bloqueada. Completa el sello anterior.' : 'Pendiente.'}`}><span className="protocol-index">0{item.id}</span><Icon size={19} strokeWidth={1.2} aria-hidden="true" /><span className="protocol-text"><strong>{item.navTitle}{completed ? ' ✓' : ''}</strong></span><ChevronRight size={14} className="dock-chevron" aria-hidden="true" /></button>
        })}</nav>
      </section>

      <footer className="world-footer"><span><span className="status-dot muted-dot" /> {wallet.identity ? 'Wallet conectada · Testnet' : 'Wallet sin conectar'}</span><span className="footer-preview">{wallet.proof ? 'Dos sellos completados' : wallet.identity ? 'Primer sello completado' : 'Conecta tu wallet para comenzar'}</span><span>Testnet · Sin dinero real</span></footer>
      {renderMode === 'fallback' && <p className="fallback-notice" role="status">WebGL no está disponible. El recorrido continúa en modo compatible.</p>}

      <Dialog open={briefingOpen} paused={paused} onClose={() => setBriefingOpen(false)} labelId="briefing-heading">
        <div className="dialog-topline"><span className="eyebrow">Tu misión</span><button className="utility-button" onClick={() => setBriefingOpen(false)} aria-label="Cerrar informe"><X size={19} /></button></div>
        <h2 id="briefing-heading">Tres pasos para entrar.</h2>
        <div className="briefing-steps">{introduction.map((step, i) => <div key={step.title}><span>0{i + 1}</span><div><h3>{step.title}</h3><p>{step.description}</p></div></div>)}</div>
        <p className="briefing-notice"><ShieldCheck size={17} aria-hidden="true" />Conecta tu wallet y demuestra el control de tu clave. La operación de prueba llegará próximamente.</p>
        <button className="primary-button" onClick={() => { setBriefingOpen(false); enterMission(1) }}>Explorar los sellos <ArrowRight size={16} aria-hidden="true" /></button>
      </Dialog>
    </div>
  </MotionConfig>
}
export default App
