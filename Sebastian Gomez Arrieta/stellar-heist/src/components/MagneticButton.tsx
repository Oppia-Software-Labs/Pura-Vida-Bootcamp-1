import { motion, useMotionValue, useSpring } from 'motion/react'
import type { HTMLMotionProps } from 'motion/react'

type Props = HTMLMotionProps<'button'> & { paused: boolean }
export function MagneticButton({ children, paused, className = '', ...props }: Props) {
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const springX = useSpring(x, { stiffness: 190, damping: 20 })
  const springY = useSpring(y, { stiffness: 190, damping: 20 })
  return <motion.button {...props} className={`magnetic-button ${className}`}
    style={{ x: paused ? 0 : springX, y: paused ? 0 : springY }}
    onPointerMove={event => {
      if (paused || event.pointerType === 'touch') return
      const bounds = event.currentTarget.getBoundingClientRect()
      x.set((event.clientX - bounds.left - bounds.width / 2) * 0.1)
      y.set((event.clientY - bounds.top - bounds.height / 2) * 0.18)
    }} onPointerLeave={() => { x.set(0); y.set(0) }}
  >{children}</motion.button>
}
