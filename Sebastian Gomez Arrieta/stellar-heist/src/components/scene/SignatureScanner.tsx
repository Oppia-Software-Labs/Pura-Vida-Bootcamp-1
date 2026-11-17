import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Group, MathUtils, Mesh, MeshBasicMaterial } from 'three'
import type { ProofVisualState } from '../../experience/types'

/** Neutral scan while requesting; alignment, pulse and open shackle require verified proof. */
export function SignatureScanner({ state, animated }: { state: ProofVisualState; animated: boolean }) {
  const rings = useRef<(Mesh | null)[]>([])
  const beam = useRef<Mesh>(null)
  const core = useRef<Group>(null)
  const shackle = useRef<Mesh>(null)
  const pulse = useRef<Mesh>(null)
  const pulseMaterial = useRef<MeshBasicMaterial>(null)
  const time = useRef(0)
  const previous = useRef(state)
  const elapsed = useRef(0)
  const verified = state === 'verified'
  const color = verified ? '#a4f2db' : '#b39aff'
  useFrame((_, delta) => {
    const dt = animated ? Math.min(delta, 0.05) : 0
    if (previous.current !== state) { elapsed.current = 0; previous.current = state }
    time.current += dt * (state === 'scanning' ? 2 : 0.6)
    elapsed.current += dt
    rings.current.forEach((ring, i) => {
      if (!ring) return
      const x = verified ? 0 : Math.sin(time.current * 0.5 + i) * 0.7
      const y = verified ? 0 : Math.cos(time.current * 0.4 + i) * 0.65
      ring.rotation.x = animated ? MathUtils.damp(ring.rotation.x, x, 4, dt) : x
      ring.rotation.y = animated ? MathUtils.damp(ring.rotation.y, y, 4, dt) : y
      ring.rotation.z = verified ? MathUtils.damp(ring.rotation.z, 0, 4, animated ? dt : 1) : time.current * (i % 2 ? -0.3 : 0.3)
    })
    if (beam.current) { beam.current.position.y = verified ? 0 : Math.sin(time.current * 1.3) * 0.85; beam.current.visible = !verified }
    if (core.current) core.current.scale.setScalar(verified ? 1.12 : 1 + Math.sin(time.current * 2) * 0.04)
    if (shackle.current) {
      shackle.current.position.y = animated ? MathUtils.damp(shackle.current.position.y, verified ? 0.5 : 0.19, 5, dt) : verified ? 0.5 : 0.19
      shackle.current.rotation.z = animated ? MathUtils.damp(shackle.current.rotation.z, verified ? -0.6 : 0, 5, dt) : verified ? -0.6 : 0
    }
    if (pulse.current) { pulse.current.visible = verified && animated && elapsed.current < 2; pulse.current.scale.setScalar(1 + elapsed.current * 1.5) }
    if (pulseMaterial.current) pulseMaterial.current.opacity = Math.max(0, 0.75 * (1 - elapsed.current / 2))
  })
  return <group>
    {[1.05, 1.35, 1.65].map((radius, i) => <mesh key={radius} ref={node => { rings.current[i] = node }}>
      <torusGeometry args={[radius, 0.014, 6, 72]} /><meshBasicMaterial color={color} transparent opacity={0.75 - i * 0.15} toneMapped={false} />
    </mesh>)}
    <mesh ref={beam}><boxGeometry args={[1.9, 0.014, 0.045]} /><meshBasicMaterial color="#b7acff" transparent opacity={0.75} toneMapped={false} /></mesh>
    <group ref={core}>
      <mesh><icosahedronGeometry args={[0.7, 1]} /><meshBasicMaterial color={color} wireframe transparent opacity={0.45} /></mesh>
      <group position={[0, 0, 0.8]}>
        <mesh ref={shackle} position={[0, 0.19, 0]}><torusGeometry args={[0.22, 0.025, 8, 32, Math.PI]} /><meshBasicMaterial color={color} toneMapped={false} /></mesh>
        <mesh><boxGeometry args={[0.48, 0.32, 0.06]} /><meshStandardMaterial color="#25354e" metalness={0.85} roughness={0.24} /></mesh>
        <mesh position={[0, 0, 0.04]}><boxGeometry args={[0.2, 0.025, 0.01]} /><meshBasicMaterial color={color} toneMapped={false} /></mesh>
      </group>
    </group>
    <mesh ref={pulse} visible={false}><torusGeometry args={[0.85, 0.025, 6, 80]} /><meshBasicMaterial ref={pulseMaterial} color="#a4f2db" transparent opacity={0} depthWrite={false} toneMapped={false} /></mesh>
  </group>
}
