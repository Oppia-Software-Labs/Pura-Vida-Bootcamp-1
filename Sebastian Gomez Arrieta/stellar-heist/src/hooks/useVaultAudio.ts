import { useCallback, useEffect, useRef, useState } from 'react'
import type { PaymentVisualStage } from '../experience/paymentCinema'

/** Explicit opt-in. Short synthesized mechanical cues; no assets, timers or payment side effects. */
export function useVaultAudio(stage: PaymentVisualStage | 'opening', hash: string | null, visible: boolean) {
  const [enabled, setEnabled] = useState(false)
  const context = useRef<AudioContext | null>(null)
  const heard = useRef('')
  const toggle = useCallback(async () => {
    if (context.current?.state === 'running') { await context.current.suspend(); setEnabled(false); return }
    try {
      context.current ??= new AudioContext()
      await context.current.resume()
      setEnabled(true)
    } catch { setEnabled(false) }
  }, [])
  useEffect(() => {
    const audio = context.current
    const key = `${hash}:${stage}`
    if (!enabled || !visible || !audio || heard.current === key) return
    heard.current = key
    if (!['authorized', 'pending', 'verified', 'opening', 'failed'].includes(stage)) return
    const now = audio.currentTime
    const low = stage === 'opening' ? 42 : stage === 'verified' ? 110 : stage === 'failed' ? 56 : 75
    for (let i = 0; i < (stage === 'verified' ? 3 : 1); i++) {
      const oscillator = audio.createOscillator()
      const gain = audio.createGain()
      const filter = audio.createBiquadFilter()
      oscillator.type = 'triangle'; oscillator.frequency.setValueAtTime(low + i * 24, now + i * 0.16)
      oscillator.frequency.exponentialRampToValueAtTime(low * 0.6, now + i * 0.16 + 0.45)
      filter.type = 'lowpass'; filter.frequency.value = 500
      gain.gain.setValueAtTime(0, now + i * 0.16)
      gain.gain.linearRampToValueAtTime(0.08, now + i * 0.16 + 0.025)
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.16 + 0.5)
      oscillator.connect(filter); filter.connect(gain); gain.connect(audio.destination)
      oscillator.start(now + i * 0.16); oscillator.stop(now + i * 0.16 + 0.55)
      oscillator.onended = () => { oscillator.disconnect(); filter.disconnect(); gain.disconnect() }
    }
  }, [stage, hash, enabled, visible])
  useEffect(() => { if (!visible) void context.current?.suspend(); else if (enabled) void context.current?.resume().catch(() => setEnabled(false)) }, [visible, enabled])
  useEffect(() => () => { void context.current?.close() }, [])
  return { enabled, toggle }
}
