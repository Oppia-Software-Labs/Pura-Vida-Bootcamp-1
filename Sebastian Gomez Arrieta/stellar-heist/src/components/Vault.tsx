import { Component, Suspense, lazy, memo, useCallback, useEffect, useState } from 'react'
import type { ReactNode, RefObject } from 'react'
import type { SceneSignals } from '../experience/types'
import { VaultFallback } from './VaultFallback'
const VaultScene = lazy(() => import('./VaultScene'))

class SceneBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() { return this.state.failed ? this.props.fallback : this.props.children }
}

function CompatibleView({ onReady, identityComplete }: { onReady: () => void; identityComplete: boolean }) {
  useEffect(onReady, [onReady])
  return <div className="compatible-world"><VaultFallback identityComplete={identityComplete} /><p>Modo compatible · WebGL no disponible</p></div>
}

export const Vault = memo(function Vault({ identityComplete, animated, signals, missionId, lightQuality, onReady, onFallback, onSlowHardware }: {
  identityComplete: boolean; animated: boolean; signals: RefObject<SceneSignals>; missionId: number; lightQuality: boolean; onReady: () => void; onFallback: () => void; onSlowHardware: () => void
}) {
  const [contextLost, setContextLost] = useState(false)
  const [availability, setAvailability] = useState<'checking' | 'available' | 'unavailable'>('checking')
  useEffect(() => {
    try {
      const probe = document.createElement('canvas').getContext('webgl2')
      setAvailability(probe ? 'available' : 'unavailable')
      probe?.getExtension('WEBGL_lose_context')?.loseContext()
    } catch { setAvailability('unavailable') }
  }, [])
  const handleContextLost = useCallback(() => setContextLost(true), [])
  const fallback = <CompatibleView onReady={onFallback} identityComplete={identityComplete} />
  const loading = <div className="world-loading" role="status"><span className="loading-orbit" /><span>Preparando la cámara Génesis…</span></div>
  return <div className="world-view" role="img" aria-label={`Cámara Génesis tridimensional. ${identityComplete ? 'Primer sello completado; dos pendientes.' : 'Tres cerraduras pendientes.'} La bóveda permanece sellada.`}>
    <SceneBoundary fallback={fallback}>
      {contextLost || availability === 'unavailable' ? fallback : availability === 'checking' ? loading : <Suspense fallback={loading}>
        <VaultScene identityComplete={identityComplete} animated={animated} signals={signals} missionId={missionId} lightQuality={lightQuality} onContextLost={handleContextLost} onReady={onReady} onSlowHardware={onSlowHardware} />
      </Suspense>}
    </SceneBoundary>
  </div>
})
