import { motion } from 'motion/react'
import { ArrowLeft, ArrowRight, Fingerprint, LockKeyhole, ScanLine, Send, ShieldCheck } from 'lucide-react'
import type { Mission } from '../data/missions'

export function MissionHUD({ mission, paused, onReturn, onNext }: {
  mission: Mission; paused: boolean; onReturn: () => void; onNext: () => void
}) {
  const Icon = mission.icon
  return <motion.section className={`mission-interface protocol-${mission.id}`} aria-labelledby="mission-heading"
    initial={{ opacity: 0, x: paused ? 0 : -45, rotateY: paused ? 0 : 8 }}
    animate={{ opacity: 1, x: 0, rotateY: 0 }} exit={{ opacity: 0, x: paused ? 0 : -25 }}
    transition={{ duration: paused ? 0 : 0.65, ease: [0.16, 1, 0.3, 1] }}
    onAnimationComplete={() => document.getElementById('mission-heading')?.focus({ preventScroll: true })}
  >
    <button className="back-button" onClick={onReturn}><ArrowLeft size={15} aria-hidden="true" /> Regresar a la cámara</button>
    <p className="eyebrow">ENTORNO HOLOGRÁFICO / PROTOCOLO 0{mission.id}</p>
    <div className="mission-heading-row"><Icon size={31} strokeWidth={1.1} aria-hidden="true" /><h1 id="mission-heading" tabIndex={-1}>{mission.title}</h1></div>
    <span className="pending-pill"><LockKeyhole size={10} aria-hidden="true" /> PENDIENTE DE INTEGRACIÓN</span>
    <p className="mission-description">{mission.description}</p>
    <div className="instrument-panel">
      <div className="instrument-label"><span>CONSOLA 0{mission.id}</span><span>SIN INICIAR</span></div>
      {mission.id === 1 ? <div className="biometric-instrument"><div className="fingerprint-target"><Fingerprint size={90} strokeWidth={0.7} aria-hidden="true" /><span className="biometric-scan" /></div><div><strong>Identidad sin vincular</strong><span>Wallet: sin conectar</span><span>Red requerida: Stellar Testnet</span><span>Cuenta: sin verificar</span></div></div>
        : mission.id === 2 ? <div className="crypto-console"><ScanLine size={22} aria-hidden="true" /><code>RETO <span>SIN GENERAR</span><br />NONCE <span>PENDIENTE</span><br />FIRMA <span>NO SOLICITADA</span><br />VERIFICACIÓN <span>NO INICIADA</span><i className="console-cursor" /></code></div>
        : <div className="transaction-instrument"><Send size={26} aria-hidden="true" /><p>Flujo previsto de la transacción</p><ol><li>Autorización</li><li>Envío</li><li>Pendiente</li><li>Confirmación</li></ol><span>No hay una transacción en curso.</span></div>}
    </div>
    <div className="mission-objective"><span className="eyebrow">OBJETIVO</span><p>{mission.objective}</p></div>
    <button className="unavailable-action" disabled><LockKeyhole size={14} aria-hidden="true" />{mission.action}</button>
    <p className="security-note"><ShieldCheck size={14} aria-hidden="true" />{mission.notice}</p>
    <div className="mission-bottom"><span>0 / 3 PROTOCOLOS VERIFICADOS</span><button onClick={onNext}>Explorar otro protocolo <ArrowRight size={14} aria-hidden="true" /></button></div>
  </motion.section>
}
