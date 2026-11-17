import { motion } from 'motion/react'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { WalletIdentity } from './WalletIdentity'
import { WalletProof } from './WalletProof'
import { WalletPayment } from './WalletPayment'
import type { WalletConnection } from '../hooks/useWallet'
import type { Mission } from '../data/missions'

export function MissionHUD({ mission, paused, wallet, onReturn, onNext }: {
  mission: Mission; paused: boolean; wallet: WalletConnection; onReturn: () => void; onNext: () => void
}) {
  const completed = mission.id === 1 ? wallet.identity : mission.id === 2 ? wallet.proof : !!wallet.payment.receipt
  const accessible = mission.id === 1 || (mission.id === 2 ? wallet.identity : wallet.proof)
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
    <span role="status" className={`mission-status ${completed ? 'is-complete' : ''}`}><span aria-hidden="true" /> {completed ? mission.id === 1 ? 'Identidad conectada' : mission.id === 2 ? 'Segundo sello abierto' : 'Operación confirmada' : !accessible ? 'Completa el sello anterior' : 'Pendiente'}</span>
    {mission.id === 1 ? <WalletIdentity key={wallet.address ?? 'disconnected'} wallet={wallet} /> : mission.id === 2 ? <WalletProof wallet={wallet} /> : <WalletPayment wallet={wallet} onReveal={onReturn} />}
    <p className="security-note">{mission.notice}</p>
    <button className="next-mission" onClick={onNext} disabled={mission.id === 1 ? !wallet.identity : mission.id === 2 ? !wallet.proof : false}>{mission.id === 1 ? 'Continuar al segundo sello' : mission.id === 2 ? 'Continuar al último sello' : 'Volver a Identidad'} <ArrowRight size={16} aria-hidden="true" /></button>
  </motion.section>
}
