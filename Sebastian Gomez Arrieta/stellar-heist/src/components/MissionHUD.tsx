import { motion } from 'motion/react'
import { ArrowLeft, ArrowRight, LockKeyhole } from 'lucide-react'
import { WalletIdentity } from './WalletIdentity'
import type { WalletConnection } from '../hooks/useWallet'
import type { Mission } from '../data/missions'

export function MissionHUD({ mission, paused, wallet, onReturn, onNext }: {
  mission: Mission; paused: boolean; wallet: WalletConnection; onReturn: () => void; onNext: () => void
}) {
  const completed = mission.id === 1 && wallet.identity
  const accessible = mission.id === 1 || wallet.identity
  return <motion.section className={`mission-interface protocol-${mission.id}`} aria-labelledby="mission-heading"
    initial={{ opacity: 0, x: paused ? 0 : -45, rotateY: paused ? 0 : 8 }}
    animate={{ opacity: 1, x: 0, rotateY: 0 }} exit={{ opacity: 0, x: paused ? 0 : -25 }}
    transition={{ duration: paused ? 0 : 0.65, ease: [0.16, 1, 0.3, 1] }}
    onAnimationComplete={definition => {
      if (typeof definition === 'object' && 'opacity' in definition && definition.opacity === 1)
        document.getElementById('mission-heading')?.focus({ preventScroll: true })
    }}
  >
    <button className="back-button" onClick={onReturn}><ArrowLeft size={16} aria-hidden="true" /> Volver a la bóveda</button>
    <p className="eyebrow">Sello 0{mission.id}</p>
    <h1 id="mission-heading" tabIndex={-1}>{mission.title}</h1>
    <p className="mission-description">{mission.description}</p>
    <span className={`mission-status ${completed ? 'is-complete' : ''}`}><span aria-hidden="true" /> {completed ? 'Identidad conectada' : !accessible ? 'Conecta tu wallet primero' : 'Pendiente'}</span>
    {mission.id === 1 ? <WalletIdentity key={wallet.address ?? 'disconnected'} wallet={wallet} /> : <>
      <button className="primary-button unavailable-action" disabled aria-describedby="mission-availability"><LockKeyhole size={17} aria-hidden="true" />{mission.action}</button>
      <p id="mission-availability" className="mission-availability">{accessible ? 'Disponible próximamente.' : 'Completa el primer sello para continuar.'}</p>
    </>}
    <p className="security-note">{mission.notice}</p>
    <button className="next-mission" onClick={onNext} disabled={!wallet.identity}>{mission.id === 1 ? 'Continuar al segundo sello' : 'Explorar otro sello'} <ArrowRight size={16} aria-hidden="true" /></button>
  </motion.section>
}
