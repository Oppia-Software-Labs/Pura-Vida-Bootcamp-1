import type { PaymentVisualStage } from '../../experience/paymentCinema'
import { useEffect, useMemo, useRef } from 'react'
import type { RefObject } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import { Group, InstancedMesh, MathUtils, MeshBasicMaterial, MeshStandardMaterial, Object3D, Points, Mesh } from 'three'
import type { SceneSignals, VaultCompletion } from '../../experience/types'
import { MechanicalFace } from './MechanicalFace'
import { artifactAppearance } from '../../experience/artifact'

interface Props { paymentStage: PaymentVisualStage; transactionComplete: boolean; proofComplete: boolean; identityComplete: boolean; signals: RefObject<SceneSignals>; animated: boolean; mobile: boolean; missionId: number }
const CYAN = '#61e9ff'
const VIOLET = '#a68aff'

function Ring({ radius, z, tube = 0.07, color = '#5c7287' }: { radius: number; z: number; tube?: number; color?: string }) {
  return <mesh position={[0, 0, z]} castShadow><torusGeometry args={[radius, tube, 8, 96]} /><meshStandardMaterial color={color} metalness={0.94} roughness={0.24} /></mesh>
}

function HardwareInstances({ radius, count, kind }: { radius: number; count: number; kind: 'bolt' | 'segment' }) {
  const ref = useRef<InstancedMesh>(null)
  useEffect(() => {
    const item = new Object3D()
    for (let i = 0; i < count; i++) {
      const angle = i / count * Math.PI * 2
      item.position.set(Math.cos(angle) * radius, Math.sin(angle) * radius, 0.32)
      item.rotation.set(kind === 'bolt' ? Math.PI / 2 : 0, 0, angle)
      item.updateMatrix()
      ref.current?.setMatrixAt(i, item.matrix)
    }
    if (ref.current) ref.current.instanceMatrix.needsUpdate = true
  }, [radius, count, kind])
  return <instancedMesh ref={ref} args={[undefined, undefined, count]} castShadow>
    {kind === 'segment' ? <boxGeometry args={[0.21, 0.08, 0.13]} /> : <cylinderGeometry args={[0.045, 0.045, 0.055, 6]} />}
    <meshStandardMaterial color={kind === 'segment' ? '#456078' : '#b1c7d5'} metalness={0.95} roughness={0.26} />
  </instancedMesh>
}

export function VaultMechanism({ paymentStage, transactionComplete, proofComplete, identityComplete, signals, animated, mobile, missionId }: Props) {
  const identityProgress = useRef(0)
  const proofProgress = useRef(0)
  const shackles = useRef<(Mesh | null)[]>([])
  const root = useRef<Group>(null)
  const outerAngle = useRef(0)
  const innerAngle = useRef(0)
  const outer = useRef<Group>(null)
  const inner = useRef<Group>(null)
  const door = useRef<Group>(null)
  const bolts = useRef<(Group | null)[]>([])
  const energyPhase = useRef(0)
  const outerEnergy = useRef<(MeshStandardMaterial | null)[]>([])
  const lights = useRef<MeshStandardMaterial>(null)
  const lockLights = useRef<(MeshBasicMaterial | null)[]>([])
  useFrame((_, delta) => {
    const { unlock, door: opening, boot, travel } = signals.current
    if (root.current) root.current.visible = travel < 0.36 || signals.current.reveal > 0
    const dt = animated ? Math.min(delta, 0.05) * MathUtils.smoothstep(boot, 0.2, 0.7) : 0
    const energized = paymentStage === 'pending' || paymentStage === 'authorized'
    if (energized) energyPhase.current += dt * 0.18
    outerEnergy.current.forEach((material, i) => {
      if (!material) return
      const pulse = animated ? Math.pow((Math.sin(energyPhase.current * 12 - i * 2.1) + 1) * 0.5, 3) : 0.5
      material.emissiveIntensity = boot * (0.9 + (energized ? pulse * 3 : 0) + Math.sin(unlock * Math.PI) * 3)
    })
    if (!proofComplete) {
      outerAngle.current += dt * (0.045 + unlock * 0.4)
      innerAngle.current -= dt * (0.075 + unlock * 0.5)
    }
    if (outer.current) outer.current.rotation.z = unlock > 0
      ? Math.PI * 2 + unlock * 0.18
      : proofComplete ? animated ? MathUtils.damp(outer.current.rotation.z, Math.PI * 2 + energyPhase.current, 3, dt) : Math.PI * 2 : outerAngle.current
    if (inner.current) inner.current.rotation.z = unlock > 0
      ? -Math.PI * 2 - unlock * 0.25
      : proofComplete ? animated ? MathUtils.damp(inner.current.rotation.z, -Math.PI * 2 - energyPhase.current * 0.65, 3, dt) : -Math.PI * 2 : innerAngle.current
    if (door.current) {
      door.current.rotation.y = -opening * Math.PI * 0.62
      door.current.position.x = -2.06 - opening * 0.5
      door.current.position.z = Math.min(opening * 6, 1) * 0.18
    }
    bolts.current.forEach((bolt, i) => { if (bolt) bolt.position.x = (i ? 1 : -1) * (2.2 + unlock * 0.6) })
    if (lights.current) lights.current.emissiveIntensity = boot * 1.5
    identityProgress.current = animated ? MathUtils.damp(identityProgress.current, identityComplete ? 1 : 0, 4, Math.min(delta, 0.05)) : identityComplete ? 1 : 0
    if (!identityComplete) identityProgress.current = 0
    proofProgress.current = !proofComplete ? 0 : animated ? MathUtils.damp(proofProgress.current, 1, 4, Math.min(delta, 0.05)) : 1
    shackles.current.forEach((shackle, i) => {
      const progress = i === 0 ? identityProgress.current : i === 1 ? proofProgress.current : transactionComplete ? unlock : 0
      if (shackle) { shackle.position.y = 0.04 + progress * 0.12; shackle.rotation.z = progress * -0.4 }
    })
    lockLights.current.forEach((material, i) => material?.color.set((i === 0 && identityComplete || i === 1 && proofComplete || i === 2 && transactionComplete) ? '#9ff4d9' : unlock > 0.5 ? '#ffda90' : missionId === i + 1 ? CYAN : VIOLET))
  })
  return <group ref={root} position={[mobile ? 0 : 1.8, 0, 0]}>
    <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -0.3]} castShadow receiveShadow><cylinderGeometry args={[2.7, 2.76, 0.8, 96]} /><meshStandardMaterial color="#152335" metalness={0.95} roughness={0.28} /></mesh>
    {[-1.05, 1.05].map(y => <group key={y} position={[-2.13, y, 0.28]}>
      <mesh><boxGeometry args={[0.52, 0.62, 0.45]} /><meshStandardMaterial color="#304752" metalness={0.88} roughness={0.42} /></mesh>
      <mesh><cylinderGeometry args={[0.17, 0.17, 0.8, 24]} /><meshStandardMaterial color="#667f88" metalness={0.94} roughness={0.32} /></mesh>
    </group>)}
    <Ring radius={2.7} z={-0.05} tube={0.06} />
    <Ring radius={2.58} z={0.11} tube={0.18} color="#3f5863" />
    <Ring radius={2.37} z={0.13} tube={0.08} color="#152236" />
    <Ring radius={2.23} z={0.21} tube={0.09} />
    <HardwareInstances radius={2.23} count={24} kind="bolt" />
    <group ref={outer}>
      <HardwareInstances radius={2.53} count={36} kind="segment" />
      {[0, 2.1, 4.2].map((angle, i) => <mesh key={angle} rotation={[0, 0, angle]} position={[0, 0, 0.31]}><torusGeometry args={[2.39, 0.018, 6, 56, 0.85]} /><meshStandardMaterial ref={material => { outerEnergy.current[i] = material }} color={CYAN} emissive={CYAN} emissiveIntensity={1.5} toneMapped={false} /></mesh>)}
    </group>
    <group ref={door} position={[-2.06, 0, 0]}>
      <group position={[2.06, 0, 0]}>
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.06]} castShadow receiveShadow><cylinderGeometry args={[2.09, 2.09, 0.68, 80]} /><meshStandardMaterial color="#22343d" metalness={0.86} roughness={0.48} /></mesh>
        <Ring radius={2.02} z={0.31} tube={0.04} />
        <mesh position={[0, 0, 0.28]}><boxGeometry args={[0.018, 4.1, 0.01]} /><meshStandardMaterial color="#050b13" /></mesh>
        <group ref={inner}>
          {[0, 2.1, 4.2].map(angle => <mesh key={angle} rotation={[0, 0, angle]} position={[0, 0, 0.34]}><torusGeometry args={[1.94, 0.012, 6, 64, 1.25]} /><meshStandardMaterial ref={angle === 0 ? lights : undefined} color={CYAN} emissive={CYAN} emissiveIntensity={1.1} toneMapped={false} /></mesh>)}
        </group>
        {Array.from({ length: 6 }, (_, i) => <group key={i} rotation={[0, 0, i * Math.PI / 3]}>
          <mesh position={[0, 1.13, 0.3]}><boxGeometry args={[0.025, 0.5, 0.035]} /><meshStandardMaterial color="#61758b" metalness={0.9} roughness={0.3} /></mesh>
        </group>)}
        <MechanicalFace paymentStage={paymentStage} signals={signals} animated={animated} />
        {[Math.PI / 2, Math.PI * 7 / 6, Math.PI * 11 / 6].map((angle, i) => <group key={i} position={[Math.cos(angle) * 1.53, Math.sin(angle) * 1.53, 0.4]} rotation={[0, 0, angle - Math.PI / 2]}>
          <RoundedBox args={[0.39, 0.56, 0.17]} radius={0.035} smoothness={2}><meshStandardMaterial color="#53667c" metalness={0.95} roughness={0.3} /></RoundedBox>
          <mesh position={[0, 0, 0.11]}><boxGeometry args={[0.26, 0.34, 0.06]} /><meshStandardMaterial color="#080f20" /></mesh>
          <mesh position={[0, -0.1, 0.15]}><boxGeometry args={[0.18, 0.025, 0.01]} /><meshBasicMaterial ref={material => { lockLights.current[i] = material }} color={VIOLET} toneMapped={false} /></mesh>
          <mesh ref={node => { shackles.current[i] = node }} position={[0, 0.04, 0.15]}><torusGeometry args={[0.055, 0.009, 5, 14, Math.PI]} /><meshBasicMaterial color="#c2d1e4" /></mesh>
          <mesh position={[0, 0, 0.15]}><boxGeometry args={[0.12, 0.06, 0.01]} /><meshStandardMaterial color="#8c9eb1" metalness={0.9} /></mesh>
        </group>)}
      </group>
    </group>
    {[-1, 1].map((side, i) => <group key={side} ref={node => { bolts.current[i] = node }} position={[side * 2.2, 0, 0.45]}>
      <RoundedBox args={[1, 0.47, 0.3]} radius={0.04} smoothness={2} castShadow><meshStandardMaterial color="#56697c" metalness={0.95} roughness={0.25} /></RoundedBox>
      <mesh position={[0, 0, 0.17]}><boxGeometry args={[0.72, 0.11, 0.06]} /><meshStandardMaterial color="#080d18" /></mesh>
      <mesh position={[0, 0, 0.21]}><boxGeometry args={[0.6, 0.02, 0.01]} /><meshBasicMaterial color={CYAN} toneMapped={false} /></mesh>
    </group>)}
  </group>
}

export function ArtifactReveal({ evidence, signals, animated }: {
  evidence: VaultCompletion | null; signals: RefObject<SceneSignals>; animated: boolean
}) {
  const mobile = useThree(state => state.size.width < 760)
  const ref = useRef<Group>(null)
  const appearance = useMemo(() => {
    if (!evidence || !/^[a-f0-9]{64}$/i.test(evidence.transactionHash)) return null
    return artifactAppearance(evidence.transactionHash)
  }, [evidence])
  useFrame((_, delta) => {
    if (!ref.current || !appearance) return
    ref.current.visible = signals.current.reveal > 0
    ref.current.scale.setScalar(Math.max(0.001, signals.current.reveal * 1.3))
    ref.current.position.set(mobile ? 0 : 1.8, -0.8 + signals.current.reveal * 1.5, 0.9)
    if (animated) ref.current.rotation.y += Math.min(delta, 0.05) * 0.25
  })
  if (!appearance) return null
  return <group ref={ref} visible={false} rotation={[0.3, appearance.rotation, 0.2]}>
    <mesh><icosahedronGeometry args={[0.7, appearance.detail]} /><meshStandardMaterial color={`hsl(${appearance.hue}, 65%, 65%)`} metalness={0.8} roughness={0.22} emissive={`hsl(${appearance.hue}, 65%, 45%)`} emissiveIntensity={0.45} /></mesh>
    <mesh scale={1.25}><icosahedronGeometry args={[0.7]} /><meshBasicMaterial color="#ffe2a1" wireframe /></mesh>
    <pointLight color="#ffda87" intensity={15} distance={8} />
    <CompletionWave hash={appearance.hash} signals={signals} />
  </group>
}

function CompletionWave({ hash, signals }: { hash: string; signals: RefObject<SceneSignals> }) {
  const root = useRef<Group>(null)
  const wave = useRef<Mesh>(null)
  const waveMaterial = useRef<MeshBasicMaterial>(null)
  const burst = useRef<Points>(null)
  const directions = useMemo(() => {
    const data = new Float32Array(72 * 3)
    for (let i = 0; i < 72; i++) {
      const seed = parseInt(hash.slice((i % 32) * 2, (i % 32) * 2 + 2), 16)
      const angle = i * 2.39996 + seed / 255
      const z = i / 36 - 1
      const r = Math.sqrt(Math.max(0, 1 - z * z))
      data.set([Math.cos(angle) * r, Math.sin(angle) * r, z], i * 3)
    }
    return data
  }, [hash])
  useFrame(() => {
    const progress = signals.current.reveal
    if (root.current) root.current.visible = progress > 0 && progress < 0.99
    wave.current?.scale.setScalar(1 + progress * 6)
    burst.current?.scale.setScalar(1 + progress * 4)
    if (waveMaterial.current) waveMaterial.current.opacity = Math.max(0, 0.6 - progress)
  })
  return <group ref={root} visible={false}>
    <mesh ref={wave}><torusGeometry args={[1, 0.018, 4, 80]} /><meshBasicMaterial ref={waveMaterial} color="#ffe5ae" transparent opacity={0.6} depthWrite={false} /></mesh>
    <points ref={burst}><bufferGeometry><bufferAttribute attach="attributes-position" args={[directions, 3]} /></bufferGeometry><pointsMaterial color="#ffe8ba" size={0.025} transparent opacity={0.5} depthWrite={false} /></points>
  </group>
}
