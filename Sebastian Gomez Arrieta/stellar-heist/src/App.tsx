import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, MotionConfig, motion } from 'motion/react'
import { ArrowRight, ChevronRight, CircleHelp, Crosshair, Fingerprint, LockKeyhole, Orbit, Pause, Play, Radio, ShieldCheck, SkipForward, X } from 'lucide-react'
import { Vault } from './components/Vault'
import { Dialog } from './components/Dialog'
import { MagneticButton } from './components/MagneticButton'
import { MissionHUD } from './components/MissionHUD'
import { useExperienceController } from './experience/useExperienceController'
import { useDocumentVisibility } from './hooks/useDocumentVisibility'
import { useMotionPreference } from './hooks/useMotionPreference'
import { introduction, missions } from './data/missions'
import './App.css'

const bootLabels = ['Esperando la cámara', 'Encendiendo iluminación', 'Sincronizando mecanismos', 'Cámara Génesis preparada']

function App() {
  const prefersReduced = useMotionPreference()
  const tabVisible = useDocumentVisibility()
  const [userPaused, setUserPaused] = useState(false)
  const [lightQuality, setLightQuality] = useState(false)
  const [renderMode, setRenderMode] = useState<'loading' | 'webgl' | 'fallback'>('loading')
  const [briefingOpen, setBriefingOpen] = useState(false)
  const paused = prefersReduced || userPaused
  const controller = useExperienceController(paused, tabVisible, renderMode !== 'loading')
  const { phase, missionId, signals, titleVisible, bootStep, enterMission, returnToLobby, skipCinematic } = controller
  const onSlowHardware = useCallback(() => setLightQuality(true), [])
  const onReady = useCallback(() => setRenderMode('webgl'), [])
  const onFallback = useCallback(() => setRenderMode('fallback'), [])
  const mission = missions.find(item => item.id === missionId) ?? missions[0]
  const traveling = phase === 'entering' || phase === 'returning'
  const lobby = phase === 'lobby' || phase === 'boot'
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
      <Vault animated={!paused && tabVisible} signals={signals} missionId={missionId} lightQuality={lightQuality} onReady={onReady} onFallback={onFallback} onSlowHardware={onSlowHardware} />
      <div className="world-vignette" aria-hidden="true" />
      <div className="film-grain" aria-hidden="true" />
      <a className="skip-link" href="#experience-main">Saltar al contenido</a>
      <header className="world-header">
        <button className="brand" onClick={returnToLobby} aria-label="Stellar Heist, regresar al inicio"><span className="brand-symbol"><Orbit size={27} strokeWidth={1.1} aria-hidden="true" /></span><span>STELLAR <strong>HEIST</strong><small>THE GENESIS VAULT</small></span></button>
        <div className="header-location"><span className="status-dot" /><span>SECTOR 07 <i>/</i> CÁMARA GÉNESIS</span></div>
        <div className="header-actions">
          <button className="utility-button quality-button" onClick={() => setLightQuality(!lightQuality)} aria-label={lightQuality ? 'Activar calidad cinematográfica' : 'Activar calidad ligera'}><Crosshair size={14} aria-hidden="true" /><span>{lightQuality ? 'LIGERA' : 'CINE'}</span></button>
          <button className="utility-button" onClick={() => setUserPaused(!userPaused)} disabled={prefersReduced} aria-pressed={userPaused} aria-label={prefersReduced ? 'Movimiento reducido según tu sistema' : userPaused ? 'Reanudar movimiento' : 'Pausar movimiento'}>{paused ? <Play size={14} aria-hidden="true" /> : <Pause size={14} aria-hidden="true" />}<span>{prefersReduced ? 'REDUCIDO' : userPaused ? 'REANUDAR' : 'PAUSAR'}</span></button>
          <button className="utility-button help-button" onClick={() => setBriefingOpen(true)} aria-label="Leer informe de la operación"><CircleHelp size={16} aria-hidden="true" /></button>
        </div>
      </header>

      <main ref={mainRef} id="experience-main" className="experience-main" tabIndex={-1}>
        <AnimatePresence mode="wait" initial={false}>
          {lobby && titleVisible && <motion.section key="lobby" className="lobby-copy" aria-labelledby="page-heading"
            initial={{ opacity: 0, y: paused ? 0 : 50, filter: paused ? 'none' : 'blur(12px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }} exit={{ opacity: 0, y: paused ? 0 : -30, filter: paused ? 'none' : 'blur(9px)' }}
            transition={{ duration: paused ? 0 : 0.85, ease: [0.16, 1, 0.3, 1] }} onAnimationComplete={() => { if (phase === 'lobby') document.getElementById('page-heading')?.focus({ preventScroll: true }) }}>
            <p className="eyebrow"><span className="small-rule" /> OPERACIÓN GÉNESIS <span>// 001</span></p>
            <h1 id="page-heading" tabIndex={-1}>STELLAR <span>HEIST</span></h1>
            <p className="hero-subtitle">THE GENESIS VAULT</p>
            <p className="hero-description">No todas las bóvedas se abren con una llave.<br />Esta necesita una prueba de quién eres.</p>
            <MagneticButton paused={paused} className="primary-button" onClick={() => enterMission(1)}><Fingerprint size={20} aria-hidden="true" /><span>INICIAR INFILTRACIÓN</span><ArrowRight size={19} aria-hidden="true" /></MagneticButton>
            <p className="lobby-disclaimer"><LockKeyhole size={12} aria-hidden="true" /> 3 protocolos. Un artefacto. Ningún atajo.</p>
          </motion.section>}
          {phase === 'mission' && <MissionHUD key={`mission-${missionId}`} mission={mission} paused={paused} onReturn={returnToLobby} onNext={() => enterMission(missionId % 3 + 1)} />}
        </AnimatePresence>

        {phase === 'boot' && <section className={`boot-status ${titleVisible ? 'boot-compact' : ''}`} aria-label="Introducción cinematográfica"><div className="boot-orbit" aria-hidden="true"><Orbit size={32} strokeWidth={0.8} /></div><p className="eyebrow">INICIALIZACIÓN VISUAL</p><p className="boot-label" role="status">{bootLabels[bootStep]}</p><div className="boot-sequence" aria-hidden="true">{[0, 1, 2, 3].map(i => <i key={i} className={i <= bootStep ? 'lit' : ''} />)}</div><button className="text-button" onClick={skipCinematic}>Saltar introducción <SkipForward size={13} aria-hidden="true" /></button></section>}

        {traveling && <section className="travel-hud" role="status" aria-label="Transición cinematográfica"><div className="travel-reticle" aria-hidden="true"><Crosshair size={70} strokeWidth={0.6} /></div><p className="eyebrow">{phase === 'entering' ? `PROYECCIÓN 0${missionId}` : 'REGRESO A LA CÁMARA'}</p><h2>{phase === 'entering' ? mission.title : 'Génesis te espera.'}</h2><p>Entorno holográfico · La bóveda sigue sellada</p><div className="travel-actions"><button className="text-button" onClick={skipCinematic}>Omitir transición <SkipForward size={13} aria-hidden="true" /></button>{phase === 'entering' && <button className="text-button" onClick={returnToLobby}>Cancelar entrada</button>}</div></section>}

        {lobby && <aside className="security-readout" aria-label="Estado de seguridad"><div className="reticle-corner" /><p className="eyebrow">NÚCLEO DE SEGURIDAD</p><strong>GÉNESIS</strong><span className="sealed-label"><LockKeyhole size={12} aria-hidden="true" /> BÓVEDA SELLADA</span><div className="lock-readout">{missions.map(item => <span key={item.id}><LockKeyhole size={11} aria-hidden="true" />0{item.id}</span>)}</div><p>Integridad: tres cierres activos<br />Verificación: sin iniciar</p><div className="signal-wave" aria-hidden="true">{Array.from({ length: 23 }, (_, i) => <i key={i} style={{ height: `${4 + i * 7 % 17}px`, animationDelay: `${i * -0.1}s` }} />)}</div></aside>}
      </main>

      <section className="protocol-dock" aria-labelledby="protocol-heading">
        <div className="dock-heading"><span id="protocol-heading">PROTOCOLOS DE ACCESO</span><span role="progressbar" aria-label="Protocolos verificados" aria-valuenow={0} aria-valuemin={0} aria-valuemax={3}>00 <i>/ 03 VERIFICADOS</i></span></div>
        <nav aria-label="Seleccionar misión">{missions.map(item => {
          const Icon = item.icon
          return <button key={item.id} className={`protocol-button ${!lobby && missionId === item.id ? 'selected' : ''}`} onClick={() => enterMission(item.id)} aria-current={!lobby && missionId === item.id ? 'step' : undefined} aria-label={`Explorar misión ${item.id}: ${item.title}. Pendiente de integración.`}><span className="protocol-index">0{item.id}</span><Icon size={19} strokeWidth={1.2} aria-hidden="true" /><span className="protocol-text"><strong>{item.title}</strong><small>PENDIENTE</small></span><ChevronRight size={14} className="dock-chevron" aria-hidden="true" /></button>
        })}</nav>
      </section>

      <footer className="world-footer"><span><Radio size={11} aria-hidden="true" /> {renderMode === 'loading' ? 'CARGANDO ESCENA' : renderMode === 'fallback' ? 'MODO COMPATIBLE' : 'MOTOR VISUAL ACTIVO'}</span><span><span className="status-dot muted-dot" /> WALLET SIN CONECTAR</span><span className="footer-preview">VISTA PREVIA · STELLAR TESTNET</span><span className="bootcamp-credit">PURA VIDA BOOTCAMP / 2026</span></footer>
      {renderMode === 'fallback' && <p className="fallback-notice" role="status">WebGL no está disponible. El recorrido continúa en modo compatible.</p>}

      <Dialog open={briefingOpen} paused={paused} onClose={() => setBriefingOpen(false)} labelId="briefing-heading">
        <div className="dialog-topline"><span className="eyebrow">INFORME / OPERACIÓN GÉNESIS</span><button className="utility-button" onClick={() => setBriefingOpen(false)} aria-label="Cerrar informe"><X size={19} /></button></div>
        <h2 id="briefing-heading">La confianza se demuestra.</h2>
        <div className="briefing-steps">{introduction.map((step, i) => <div key={step.title}><span>0{i + 1}</span><div><h3>{step.title}</h3><p>{step.description}</p></div></div>)}</div>
        <p className="briefing-notice"><ShieldCheck size={17} aria-hidden="true" />Este recorrido es visual. No conecta wallets, no solicita firmas y no envía pagos. La apertura final necesita verificaciones reales que aún están pendientes.</p>
        <button className="primary-button" onClick={() => { setBriefingOpen(false); enterMission(1) }}>EXPLORAR LOS PROTOCOLOS <ArrowRight size={16} aria-hidden="true" /></button>
      </Dialog>
    </div>
  </MotionConfig>
}
export default App
