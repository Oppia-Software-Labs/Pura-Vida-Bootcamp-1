import { useMemo, useRef } from 'react'
import type { RefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import { AdditiveBlending, BufferAttribute, Group, Points } from 'three'
import type { SceneSignals } from '../../experience/types'

export function ParticleField({ signals, animated, compact }: {
  signals: RefObject<SceneSignals>; animated: boolean; compact: boolean
}) {
  const points = useRef<Points>(null)
  const positions = useMemo(() => {
    const count = compact ? 90 : 280
    const values = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      values[i * 3] = Math.sin(i * 127.1) * 9
      values[i * 3 + 1] = Math.cos(i * 311.7) * 5
      values[i * 3 + 2] = Math.sin(i * 74.7) * 23 - 12
    }
    return values
  }, [compact])
  useFrame((_, delta) => {
    if (!animated || !points.current) return
    const attribute = points.current.geometry.getAttribute('position') as BufferAttribute
    const dt = Math.min(delta, 0.05)
    const speed = 0.12 + Math.sin(signals.current.travel * Math.PI) * 8
    for (let i = 0; i < attribute.count; i++) {
      attribute.array[i * 3 + 2] += dt * speed
      if (attribute.array[i * 3 + 2] > 9) attribute.array[i * 3 + 2] = -34
    }
    attribute.needsUpdate = true
    points.current.rotation.z += dt * 0.003
  })
  return <points ref={points}>
    <bufferGeometry><bufferAttribute attach="attributes-position" args={[positions, 3]} /></bufferGeometry>
    <pointsMaterial color="#9aceda" size={compact ? 0.022 : 0.018} transparent opacity={0.55} depthWrite={false} blending={AdditiveBlending} />
  </points>
}

export function MissionInstrument({ missionId, animated, signals, compact }: {
  missionId: number; animated: boolean; signals: RefObject<SceneSignals>; compact: boolean
}) {
  const ref = useRef<Group>(null)
  const time = useRef(0)
  useFrame((_, delta) => {
    if (animated) time.current += Math.min(delta, 0.05)
    if (ref.current) {
      ref.current.visible = signals.current.travel > 0.8
      ref.current.rotation.y = Math.sin(time.current * 0.2) * 0.23
      ref.current.rotation.z = missionId === 1 ? 0 : time.current * 0.1
    }
  })
  const color = missionId === 2 ? '#b39aff' : '#81f2ff'
  return <group ref={ref} position={[compact ? 0 : 1.9, compact ? 1 : 0, -17]} visible={false}>
    {[1.1, 1.4, 1.7].map((r, i) => <mesh key={r} rotation={[i * 0.3, i * 0.25, i * Math.PI / 4]}>
      <torusGeometry args={[r, 0.012, 4, missionId === 2 ? 6 : 80]} /><meshBasicMaterial color={color} transparent opacity={0.65 - i * 0.15} />
    </mesh>)}
    {missionId === 1 ? <>
      {Array.from({ length: 10 }, (_, i) => <mesh key={i} scale={[0.65, 1, 1]} rotation={[0, 0, -0.3]}>
        <torusGeometry args={[0.2 + i * 0.065, 0.009, 4, 60, Math.PI * (1.4 + i * 0.04)]} /><meshBasicMaterial color={color} transparent opacity={0.8} />
      </mesh>)}
    </> : missionId === 2 ? <mesh><icosahedronGeometry args={[0.75, 1]} /><meshBasicMaterial color={color} wireframe transparent opacity={0.85} /></mesh> : <>
      <mesh><icosahedronGeometry args={[0.7]} /><meshStandardMaterial color="#5d94a9" metalness={0.8} roughness={0.2} emissive="#1c889f" emissiveIntensity={0.7} /></mesh>
      <mesh scale={1.3}><icosahedronGeometry args={[0.7]} /><meshBasicMaterial color={color} wireframe /></mesh>
    </>}
  </group>
}
