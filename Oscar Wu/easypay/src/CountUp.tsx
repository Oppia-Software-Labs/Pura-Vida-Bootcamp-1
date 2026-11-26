import { useEffect, useRef, useState } from 'react'

const reduced = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

interface Props {
  value: number
  decimals?: number
  duration?: number
  /** Si es true, espera a que el número entre en pantalla antes de contar (landing). */
  whenVisible?: boolean
}

/** Número que "carga": cuenta desde el valor anterior (o 0) hasta `value` con easing suave. */
export default function CountUp({ value, decimals = 0, duration = 1400, whenVisible = false }: Props) {
  const ref = useRef<HTMLSpanElement>(null)
  const from = useRef(0)
  const [shown, setShown] = useState(0)
  const [visible, setVisible] = useState(!whenVisible)

  useEffect(() => {
    if (!whenVisible || !ref.current) return
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setVisible(true)
          io.disconnect()
        }
      },
      { threshold: 0.4 },
    )
    io.observe(ref.current)
    return () => io.disconnect()
  }, [whenVisible])

  useEffect(() => {
    if (!visible) return
    if (reduced()) {
      from.current = value
      setShown(value)
      return
    }
    const start = from.current
    const t0 = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / duration)
      const eased = 1 - Math.pow(1 - p, 4) // easeOutQuart
      const v = start + (value - start) * eased
      from.current = v
      setShown(v)
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value, duration, visible])

  return (
    <span ref={ref} className="countup">
      {shown.toLocaleString('es-CR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}
    </span>
  )
}
