import { useCallback, useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import type { ExperiencePhase, SceneSignals } from './types'

// Cinematic durations follow wall time even on a slow software WebGL renderer.
gsap.ticker.lagSmoothing(0)

export function useExperienceController(paused: boolean, visible: boolean, ready: boolean) {
  const signals = useRef<SceneSignals>({ boot: 0, travel: 0, unlock: 0, door: 0, reveal: 0 })
  const [phase, setPhase] = useState<ExperiencePhase>('boot')
  const [bootStep, setBootStep] = useState(0)
  const [titleVisible, setTitleVisible] = useState(false)
  const [missionId, setMissionId] = useState(1)
  const bootTimeline = useRef<gsap.core.Timeline | null>(null)
  const travelTimeline = useRef<gsap.core.Timeline | null>(null)
  const initiallyPaused = useRef(paused)
  const bootFinished = useRef(false)
  const pausedRef = useRef(paused)
  useEffect(() => { pausedRef.current = paused }, [paused])

  const skipBoot = useCallback(() => {
    bootTimeline.current?.kill()
    bootFinished.current = true
    signals.current.boot = 1
    setBootStep(3)
    setTitleVisible(true)
    setPhase('lobby')
  }, [])

  useEffect(() => {
    if (!ready || bootFinished.current) return
    if (initiallyPaused.current) { skipBoot(); return }
    signals.current.boot = 0
    const timeline = gsap.timeline({ paused: !visible, onComplete: () => { bootFinished.current = true; setPhase('lobby') } })
    const deadline = window.setTimeout(() => { if (!bootFinished.current) skipBoot() }, 8000)
    bootTimeline.current = timeline
    timeline
      .to(signals.current, { boot: 0.16, duration: 0.8, ease: 'power1.in' })
      .call(() => setBootStep(1))
      .to(signals.current, { boot: 0.4, duration: 1.2, ease: 'power2.inOut' })
      .call(() => setBootStep(2))
      .to(signals.current, { boot: 0.72, duration: 1.3, ease: 'power2.out' })
      .call(() => { setTitleVisible(true); setBootStep(3) })
      .to(signals.current, { boot: 1, duration: 1.8, ease: 'power2.out' })
    return () => { window.clearTimeout(deadline); timeline.kill(); travelTimeline.current?.kill() }
  }, [skipBoot, ready])

  const enterMission = useCallback((id: number) => {
    if (![1, 2, 3].includes(id)) return
    bootFinished.current = true
    bootTimeline.current?.kill()
    travelTimeline.current?.kill()
    signals.current.boot = 1
    setTitleVisible(true)
    setMissionId(id)
    if (pausedRef.current) { signals.current.travel = 1; setPhase('mission'); return }
    setPhase('entering')
    const timeline = gsap.timeline({ onComplete: () => setPhase('mission') })
    travelTimeline.current = timeline
    if (signals.current.travel > 0.75) timeline.to(signals.current, { travel: 0.38, duration: 0.65, ease: 'power2.inOut' })
    timeline.to(signals.current, { travel: 1, duration: 2.7, ease: 'power2.inOut' })
  }, [])

  const returnToLobby = useCallback(() => {
    bootFinished.current = true
    bootTimeline.current?.kill()
    travelTimeline.current?.kill()
    signals.current.boot = 1
    setTitleVisible(true)
    if (pausedRef.current || signals.current.travel < 0.001) { signals.current.travel = 0; setPhase('lobby'); return }
    setPhase('returning')
    travelTimeline.current = gsap.timeline({ onComplete: () => setPhase('lobby') })
      .to(signals.current, { travel: 0, duration: Math.max(0.5, signals.current.travel * 2.5), ease: 'power2.inOut' })
  }, [])

  const skipCinematic = useCallback(() => {
    if (phase === 'boot') skipBoot()
    else travelTimeline.current?.progress(1)
  }, [phase, skipBoot])

  useEffect(() => {
    if (paused) {
      if (phase === 'boot') skipBoot()
      else travelTimeline.current?.progress(1)
    }
    bootTimeline.current?.paused(!visible)
    travelTimeline.current?.paused(!visible)
  }, [paused, visible, phase, skipBoot])

  return { phase, bootStep, titleVisible, missionId, signals, enterMission, returnToLobby, skipCinematic }
}
