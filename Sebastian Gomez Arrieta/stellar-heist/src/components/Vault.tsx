import type { PaymentVisualStage } from '../experience/paymentCinema'
import { Component, Suspense, lazy, memo, useCallback, useEffect, useState } from 'react'
import type { ReactNode, RefObject } from 'react'
import type { ProofVisualState, SceneSignals, VaultCompletion } from '../experience/types'
import { VaultFallback } from './VaultFallback'
const VaultScene = lazy(() => import('./VaultScene'))

class SceneBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() { return this.state.failed ? this.props.fallback : this.props.children }
}

function CompatibleView({ onReady, identityComplete, proofComplete, completion, revealActive, onOpening, onOpened }: { onOpening: () => void; onReady: () => void; identityComplete: boolean; proofComplete: boolean; completion: VaultCompletion | null; revealActive: boolean; onOpened: () => void }) {
  useEffect(onReady, [onReady])
  useEffect(() => { if (completion && revealActive) { onOpening(); onOpened() } }, [completion, revealActive, onOpening, onOpened])
  return <div className="compatible-world"><VaultFallback completion={completion} proofComplete={proofComplete} identityComplete={identityComplete} /><p>Modo compatible · WebGL no disponible</p></div>
}

export const Vault = memo(function Vault({ paymentStage, onOpening, completion, revealActive, reducedMotion, onOpened, proofState, identityComplete, animated, signals, missionId, lightQuality, onReady, onFallback, onSlowHardware }: {
  paymentStage: PaymentVisualStage; onOpening: () => void; completion: VaultCompletion | null; revealActive: boolean; reducedMotion: boolean; onOpened: () => void; proofState: ProofVisualState; identityComplete: boolean; animated: boolean; signals: RefObject<SceneSignals>; missionId: number; lightQuality: boolean; onReady: () => void; onFallback: () => void; onSlowHardware: () => void
}) {
  const [contextLost, setContextLost] = useState(false)
  const [availability, setAvailability] = useState<'checking' | 'available' | 'unavailable'>('checking')
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      try {
        const probe = document.createElement('canvas').getContext('webgl2')
        setAvailability(probe ? 'available' : 'unavailable')
        probe?.getExtension('WEBGL_lose_context')?.loseContext()
      } catch { setAvailability('unavailable') }
    })
    return () => cancelAnimationFrame(frame)
  }, [])
  const handleContextLost = useCallback(() => setContextLost(true), [])
  const fallback = <CompatibleView onOpening={onOpening} completion={completion} revealActive={revealActive} onOpened={onOpened} proofComplete={proofState === 'verified'} onReady={onFallback} identityComplete={identityComplete} />
  const loading = <div className="world-loading" role="status"><span className="loading-orbit" /><span>Preparando la cámara Génesis…</span></div>
  return <div className="world-view" role="img" aria-label={`Cámara Génesis tridimensional. ${completion ? 'Tres sellos completados. Génesis verificado en Testnet.' : proofState === 'verified' ? 'Dos sellos completados; uno pendiente.' : identityComplete ? 'Primer sello completado; dos pendientes.' : 'Tres cerraduras pendientes.'} ${completion ? 'Apertura habilitada.' : 'La bóveda permanece sellada.'}`}>
    <SceneBoundary fallback={fallback}>
      {contextLost || availability === 'unavailable' ? fallback : availability === 'checking' ? loading : <Suspense fallback={loading}>
        <VaultScene paymentStage={paymentStage} onOpening={onOpening} completion={completion} revealActive={revealActive} reducedMotion={reducedMotion} onOpened={onOpened} proofState={proofState} identityComplete={identityComplete} animated={animated} signals={signals} missionId={missionId} lightQuality={lightQuality} onContextLost={handleContextLost} onReady={onReady} onSlowHardware={onSlowHardware} />
      </Suspense>}
    </SceneBoundary>
  </div>
})
