import { useEffect, useRef } from 'react'
import type { RefObject } from 'react'
import { gsap } from 'gsap'
import { useThree } from '@react-three/fiber'
import type { SceneSignals, VaultCompletion } from '../../experience/types'

/** Receipt is verified by the payment service; animation cannot manufacture completion. */
export function VaultOpening({ evidence, signals, active, reducedMotion, onOpening, onOpened }: {
  evidence: VaultCompletion | null; signals: RefObject<SceneSignals>; active: boolean; reducedMotion: boolean; onOpening: () => void; onOpened: () => void
}) {
  const sequence = useRef<gsap.core.Timeline | null>(null)
  const invalidate = useThree(state => state.invalidate)
  useEffect(() => {
    const channels = signals.current
    Object.assign(channels, { unlock: 0, door: 0, reveal: 0 })
    invalidate()
    if (!evidence) return
    const timeline = gsap.timeline({ paused: true, onComplete: onOpened })
      .to(channels, { unlock: 1, duration: 2, ease: 'power2.inOut' })
      .call(onOpening)
      .to(channels, { door: 1, duration: 3.2, ease: 'power3.inOut' })
      .to(channels, { reveal: 1, duration: 2.8, ease: 'power2.out' }, '-=1')
    sequence.current = timeline
    return () => {
      timeline.kill(); sequence.current = null
      Object.assign(channels, { unlock: 0, door: 0, reveal: 0 })
    }
  }, [evidence, signals, onOpening, onOpened, invalidate])
  useEffect(() => {
    if (!active) sequence.current?.pause()
    else if (reducedMotion) sequence.current?.progress(1)
    else sequence.current?.play()
    invalidate()
  }, [active, reducedMotion, evidence, onOpened, invalidate])
  return null
}
