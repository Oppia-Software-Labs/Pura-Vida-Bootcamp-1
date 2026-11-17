import { useEffect } from 'react'
import type { RefObject } from 'react'
import { gsap } from 'gsap'
import type { SceneSignals, TrustedVaultCompletion } from '../../experience/types'

/** Prepared sequence only. No preview trigger and no client-side success setter. */
export function VaultOpening({ evidence, signals, paused }: {
  evidence: TrustedVaultCompletion | null
  signals: RefObject<SceneSignals>
  paused: boolean
}) {
  useEffect(() => {
    if (!evidence) return
    // Shape checks are defensive; the future adapter must verify evidence server-side.
    if (evidence.network !== 'TESTNET' || !/^[a-f0-9]{64}$/i.test(evidence.transactionHash) || !evidence.verifiedMissions.every(Boolean)) return
    const timeline = gsap.timeline()
      .to(signals.current, { unlock: 1, duration: paused ? 0 : 2, ease: 'power2.inOut' })
      .to(signals.current, { door: 1, duration: paused ? 0 : 3.2, ease: 'power3.inOut' })
      .to(signals.current, { reveal: 1, duration: paused ? 0 : 2.8, ease: 'power2.out' }, '-=1')
    return () => { timeline.kill() }
  }, [evidence, signals, paused])
  return null
}
