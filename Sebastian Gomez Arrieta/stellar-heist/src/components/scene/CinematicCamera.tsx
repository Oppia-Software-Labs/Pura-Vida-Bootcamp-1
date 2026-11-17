import { useFrame, useThree } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import type { RefObject } from 'react'
import { MathUtils, Vector3 } from 'three'
import type { SceneSignals } from '../../experience/types'

export function CinematicCamera({ signals, animated, missionId }: {
  signals: RefObject<SceneSignals>; animated: boolean; missionId: number
}) {
  const { size } = useThree()
  const target = useMemo(() => new Vector3(), [])
  const look = useMemo(() => new Vector3(), [])
  const time = useRef(0)
  useFrame(({ camera, pointer }, delta) => {
    const dt = Math.min(delta, 0.05)
    if (animated) time.current += dt
    const { boot, travel, reveal } = signals.current
    const mobile = size.width < 760
    const path = MathUtils.smoothstep(travel, 0, 1)
    const z = MathUtils.lerp(mobile ? 17.5 - boot * 2 : 15 - boot * 4.8, -10, path)
    const sway = animated ? Math.sin(time.current * 0.21) * 0.08 : 0
    const px = animated ? MathUtils.clamp(pointer.x, -1, 1) : 0
    const py = animated ? MathUtils.clamp(pointer.y, -1, 1) : 0
    const align = MathUtils.smoothstep(travel, 0, 0.45)
    const release = MathUtils.smoothstep(travel, 0.45, 0.8)
    const vaultX = mobile ? 0 : 1.8
    const cameraX = MathUtils.lerp(MathUtils.lerp(mobile ? 0 : 0.5, vaultX, align), (missionId - 2) * 0.25, release)
    target.set(
      cameraX + px * 0.25 + sway,
      MathUtils.lerp(mobile ? 1.3 : 0.65, 0.1, path) + py * 0.13,
      z,
    )
    look.set(MathUtils.lerp(MathUtils.lerp(mobile ? 0 : 0.1, vaultX, align), 0, release), mobile && travel < 0.1 ? 1.2 : 0.1, z - 12)
    if (reveal > 0) {
      const angle = reveal * Math.PI * 0.65
      target.set(Math.sin(angle) * 5.5, 0.8, Math.cos(angle) * 5.5)
      look.set(0, 0.5, 0)
    }
    if (animated) camera.position.lerp(target, 1 - Math.exp(-dt * (travel > 0 && travel < 1 ? 8 : 2.5)))
    else camera.position.copy(target)
    camera.lookAt(look)
  })
  return null
}
