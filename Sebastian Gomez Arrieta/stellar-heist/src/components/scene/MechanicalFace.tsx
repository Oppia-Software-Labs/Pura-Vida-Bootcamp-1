import type { PaymentVisualStage } from '../../experience/paymentCinema'
import { useEffect, useMemo, useRef } from 'react'
import type { RefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import { DataTexture, Group, InstancedMesh, Object3D, MeshStandardMaterial, MathUtils, RGBAFormat, LinearFilter, RepeatWrapping, UnsignedByteType } from 'three'
import type { SceneSignals } from '../../experience/types'

/** Machined surface and radial hardware; reads existing verified animation channels only. */
export function MechanicalFace({ signals, animated, paymentStage }: { paymentStage: PaymentVisualStage; signals: RefObject<SceneSignals>; animated: boolean }) {
  const fasteners = useRef<InstancedMesh>(null)
  const markings = useRef<InstancedMesh>(null)
  const spindle = useRef<Group>(null)
  const latches = useRef<(Group | null)[]>([])
  const time = useRef(0)
  const angle = useRef(0)
  const activation = useRef(0)
  const energy = useRef<(MeshStandardMaterial | null)[]>([])
  const lockEnergy = useRef<(MeshStandardMaterial | null)[]>([])
  const metal = useMemo(() => {
    const size = 128
    const pixels = new Uint8Array(size * size * 4)
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      const grain = Math.sin(y * 73.17 + x * 3.11) * 0.5 + 0.5
      const value = 105 + Math.floor(grain * 22 + Math.sin(y * 0.8) * 9)
      pixels.set([value, value, value, 255], (y * size + x) * 4)
    }
    const texture = new DataTexture(pixels, size, size, RGBAFormat, UnsignedByteType)
    texture.minFilter = texture.magFilter = LinearFilter
    texture.wrapS = texture.wrapT = RepeatWrapping; texture.repeat.set(3, 3); texture.needsUpdate = true
    const material = new MeshStandardMaterial({ color: '#263e49', metalness: 0.86, roughness: 0.62, roughnessMap: texture })
    return { texture, material }
  }, [])
  useEffect(() => () => { metal.material.dispose(); metal.texture.dispose() }, [metal])
  useEffect(() => {
    const item = new Object3D()
    for (let i = 0; i < 24; i++) {
      const angle = i * Math.PI / 12
      item.position.set(Math.sin(angle) * 1.98, Math.cos(angle) * 1.98, 0.43)
      item.rotation.set(Math.PI / 2, 0, angle); item.scale.set(1, 1, 1); item.updateMatrix()
      fasteners.current?.setMatrixAt(i, item.matrix)
      item.position.set(Math.sin(angle) * 1.76, Math.cos(angle) * 1.76, 0.39)
      item.rotation.set(0, 0, -angle); item.scale.set(i % 3 === 0 ? 0.035 : 0.012, i % 3 === 0 ? 0.1 : 0.045, 0.005); item.updateMatrix()
      markings.current?.setMatrixAt(i, item.matrix)
    }
    if (fasteners.current) fasteners.current.instanceMatrix.needsUpdate = true
    if (markings.current) markings.current.instanceMatrix.needsUpdate = true
  }, [])
  useFrame((_, delta) => {
    if (animated) time.current += Math.min(delta, 0.05)
    const release = signals.current.unlock
    const active = paymentStage === 'authorized' || paymentStage === 'pending'
    const dt = Math.min(delta, 0.05)
    activation.current = animated ? MathUtils.damp(activation.current, active ? 1 : paymentStage === 'uncertain' ? 0.25 : 0, 2.5, dt) : active ? 1 : 0
    if (animated) angle.current += dt * (0.025 + activation.current * (paymentStage === 'pending' ? 0.2 : 0.09))
    const surge = Math.sin(release * Math.PI) * 2.8
    energy.current.forEach((material, i) => {
      if (!material) return
      const pulse = animated ? Math.pow((Math.sin(time.current * 2.8 - i * 1.8) + 1) * 0.5, 4) : 0.5
      const verified = release > i * 0.18 ? Math.min(1, (release - i * 0.18) * 4) : 0
      material.emissiveIntensity = 0.8 + activation.current * pulse * 2.8 + surge + verified
    })
    lockEnergy.current.forEach((material, i) => {
      if (!material) return
      const pulse = animated && paymentStage === 'pending' ? Math.pow(Math.max(0, Math.cos(time.current * 2 - i * Math.PI / 2)), 10) : 0
      material.emissiveIntensity = 0.65 + activation.current * pulse * 3 + surge
    })
    if (spindle.current) {
      spindle.current.rotation.z = angle.current + release * Math.PI / 3
      spindle.current.position.z = 0.72 + release * 0.12
    }
    latches.current.forEach(latch => { if (latch) latch.position.y = 1.65 - release * 0.22 })
  })
  return <group>
    <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.32]} material={metal.material}><cylinderGeometry args={[2.04, 2.04, 0.09, 96]} /></mesh>
    {[1.02, 1.27, 1.84, 2.06].map((radius, i) => <mesh key={radius} position={[0, 0, 0.4]}>
      <torusGeometry args={[radius, i === 0 ? 0.055 : 0.016, 6, 96]} /><meshStandardMaterial color={i === 0 ? '#78949e' : '#111f28'} metalness={0.88} roughness={0.4} />
    </mesh>)}
    {[0.94, 1.89].map((radius, i) => <mesh key={radius} position={[0, 0, 0.43]}><torusGeometry args={[radius, 0.012, 6, 96]} /><meshStandardMaterial ref={material => { energy.current[i] = material }} color="#65dce3" emissive="#36cad9" emissiveIntensity={1.3} toneMapped={false} /></mesh>)}
    <instancedMesh ref={fasteners} args={[undefined, undefined, 24]}><cylinderGeometry args={[0.026, 0.026, 0.025, 6]} /><meshStandardMaterial color="#7c929a" metalness={0.9} roughness={0.4} /></instancedMesh>
    <instancedMesh ref={markings} args={[undefined, undefined, 24]}><boxGeometry args={[1, 1, 1]} /><meshStandardMaterial color="#81989d" roughness={0.7} metalness={0.6} /></instancedMesh>
    {[Math.PI / 4, Math.PI * 3 / 4, Math.PI * 5 / 4, Math.PI * 7 / 4].map((angle, i) => <group key={angle} rotation={[0, 0, angle]}>
      <group ref={node => { latches.current[i] = node }} position={[0, 1.65, 0.47]}>
        <mesh material={metal.material}><boxGeometry args={[0.2, 0.47, 0.14]} /></mesh>
        <mesh position={[0, 0, 0.08]}><boxGeometry args={[0.1, 0.36, 0.025]} /><meshStandardMaterial color="#0c1820" metalness={0.8} roughness={0.4} /></mesh>
        <mesh position={[0, -0.18, 0.1]}><boxGeometry args={[0.12, 0.018, 0.01]} /><meshStandardMaterial ref={material => { lockEnergy.current[i] = material }} color="#57d5df" emissive="#36cad9" emissiveIntensity={0.65} toneMapped={false} /></mesh>
      </group>
    </group>)}
    <group ref={spindle} position={[0, 0, 0.72]}>
      <mesh rotation={[Math.PI / 2, 0, 0]} material={metal.material}><cylinderGeometry args={[0.83, 0.88, 0.38, 64]} /></mesh>
      <mesh position={[0, 0, 0.21]}><torusGeometry args={[0.73, 0.028, 8, 64]} /><meshStandardMaterial color="#91a7ad" metalness={0.94} roughness={0.32} /></mesh>
      {Array.from({ length: 10 }, (_, i) => <group key={i} rotation={[0, 0, i * Math.PI / 5]}>
        <mesh position={[0, 0.52, 0.23]}><boxGeometry args={[0.075, 0.22, 0.07]} /><meshStandardMaterial color="#647f88" metalness={0.9} roughness={0.35} /></mesh>
      </group>)}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.25]}><cylinderGeometry args={[0.37, 0.42, 0.15, 48]} /><meshStandardMaterial color="#102632" metalness={0.85} roughness={0.3} /></mesh>
      <mesh position={[0, 0, 0.34]}><torusGeometry args={[0.36, 0.018, 6, 64]} /><meshStandardMaterial ref={material => { energy.current[2] = material }} color="#69e3eb" emissive="#39c7d8" emissiveIntensity={1.7} toneMapped={false} /></mesh>
      <mesh position={[0, 0, 0.34]}><circleGeometry args={[0.29, 48]} /><meshStandardMaterial color="#345864" metalness={0.85} roughness={0.5} /></mesh>
    </group>
  </group>
}
