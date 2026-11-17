import { useEffect, useMemo, useRef } from 'react'
import type { RefObject } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { AdaptiveDpr, Environment, Lightformer, PerformanceMonitor } from '@react-three/drei'
import { AmbientLight, Color, DirectionalLight, Group, Path, PointLight, Shape, Vector2 } from 'three'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'
import { CinematicCamera } from './scene/CinematicCamera'
import { ArtifactReveal, VaultMechanism } from './scene/VaultMechanism'
import { MissionTransition } from './scene/MissionTransition'
import { MissionInstrument, ParticleField } from './scene/ParticleField'
import { VaultOpening } from './scene/VaultOpening'
import { verifiedCompletion } from '../experience/types'
import type { SceneSignals } from '../experience/types'

export interface VaultSceneProps {
  identityComplete: boolean
  animated: boolean
  missionId: number
  signals: RefObject<SceneSignals>
  lightQuality: boolean
  onContextLost: () => void
  onReady: () => void
  onSlowHardware: () => void
}

function Chamber({ compact, signals }: { compact: boolean; signals: RefObject<SceneSignals> }) {
  const room = useRef<Group>(null)
  useFrame(() => { if (room.current) room.current.visible = signals.current.travel < 0.36 || signals.current.reveal > 0 })
  const wall = useMemo(() => {
    const shape = new Shape()
    shape.moveTo(-8, -3.1); shape.lineTo(8, -3.1); shape.lineTo(8, 6); shape.lineTo(-8, 6); shape.closePath()
    const hole = new Path()
    hole.absarc(0, 0, 2.72, 0, Math.PI * 2, true)
    shape.holes.push(hole)
    return shape
  }, [])
  const x = compact ? 0 : 1.8
  return <group ref={room}>
    <mesh position={[x, 0, -0.82]} receiveShadow><extrudeGeometry args={[wall, { depth: 0.22, bevelEnabled: false }]} /><meshStandardMaterial color="#283447" metalness={0.87} roughness={0.4} /></mesh>
    <mesh position={[0, -3.05, -10]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow><planeGeometry args={[70, 100]} /><meshStandardMaterial color="#0b1722" metalness={0.88} roughness={0.23} /></mesh>
    <gridHelper args={[70, 70, '#2d6877', '#182b3b']} position={[0, -3.04, -12]} />
    {[-1, 1].map(side => <group key={side} position={[x + side * 3.6, 0, -0.3]}>
      <mesh castShadow><boxGeometry args={[0.35, 9, 0.7]} /><meshStandardMaterial color="#374459" metalness={0.9} roughness={0.28} /></mesh>
      <mesh position={[-side * 0.19, 0, 0.36]}><boxGeometry args={[0.035, 7, 0.025]} /><meshBasicMaterial color={side < 0 ? '#a893ef' : '#68cdda'} toneMapped={false} /></mesh>
      {[-2.5, -1.5, 1.5, 2.5].map(y => <mesh key={y} position={[0, y, 0.4]}><boxGeometry args={[0.55, 0.07, 0.2]} /><meshStandardMaterial color="#536074" metalness={0.9} roughness={0.35} /></mesh>)}
    </group>)}
    {[-1, 1].map(side => <mesh key={side} position={[x + side * 4.9, 0, -0.4]}><boxGeometry args={[0.08, 8, 0.2]} /><meshStandardMaterial color="#2b4655" metalness={0.9} /></mesh>)}
    {[0, 1, 2].map(i => <mesh key={i} position={[x, -2.9 - i * 0.09, 0.5 + i * 0.45]} receiveShadow><boxGeometry args={[7.2 + i * 0.4, 0.12, 0.55]} /><meshStandardMaterial color="#354250" metalness={0.8} roughness={0.32} /></mesh>)}
    {[0, 1, 2, 3].map(i => <group key={i} position={[0, 0, 6 - i * 5]}>
      <mesh position={[0, 4.2, 0]}><boxGeometry args={[16, 0.3, 0.4]} /><meshStandardMaterial color="#263647" metalness={0.9} /></mesh>
      <mesh position={[0, 4.03, 0]}><boxGeometry args={[8, 0.025, 0.06]} /><meshBasicMaterial color="#6a8c9e" /></mesh>
    </group>)}
  </group>
}

function Lighting({ signals, animated, shadows }: { signals: RefObject<SceneSignals>; animated: boolean; shadows: boolean }) {
  const ambient = useRef<AmbientLight>(null)
  const key = useRef<DirectionalLight>(null)
  const violet = useRef<PointLight>(null)
  const cyan = useRef<PointLight>(null)
  const time = useRef(0)
  useFrame(({ scene, gl }, delta) => {
    if (animated) time.current += Math.min(delta, 0.05)
    const { boot, travel, reveal } = signals.current
    if (ambient.current) ambient.current.intensity = 0.03 + boot * 0.35
    if (key.current) key.current.intensity = boot * 2.7
    if (violet.current) violet.current.intensity = boot * (17 + Math.sin(time.current * 0.7) * 2 + Math.sin(travel * Math.PI) * 18)
    if (cyan.current) { cyan.current.intensity = boot * (22 + Math.sin(time.current * 0.43) * 3); cyan.current.color.set(reveal > 0 ? '#ffd58c' : '#71e4f7') }
    scene.environmentIntensity = boot * 0.6
    gl.toneMappingExposure = 0.65 + boot * 0.35
  })
  return <>
    <ambientLight ref={ambient} intensity={0.03} color="#a3afc6" />
    <directionalLight ref={key} position={[-3, 6, 7]} intensity={0} color="#dceaff" castShadow={shadows} shadow-mapSize={[1024, 1024]} shadow-camera-left={-8} shadow-camera-right={8} shadow-camera-top={7} shadow-camera-bottom={-7} shadow-bias={-0.001} />
    <pointLight ref={cyan} position={[5, 1, 4]} intensity={0} color="#71e4f7" distance={16} />
    <pointLight ref={violet} position={[-2, -1, 3]} intensity={0} color="#b094f4" distance={13} />
    <pointLight position={[0, 1, -15]} intensity={12} color="#7b87ef" distance={13} />
  </>
}

function PostProcessing() {
  const { gl, scene, camera, size, invalidate } = useThree()
  const pipeline = useRef<EffectComposer | null>(null)
  useEffect(() => {
    const composer = new EffectComposer(gl)
    const render = new RenderPass(scene, camera)
    const bloom = new UnrealBloomPass(new Vector2(size.width / 2, size.height / 2), 0.45, 0.5, 1)
    const output = new OutputPass()
    composer.addPass(render); composer.addPass(bloom); composer.addPass(output)
    composer.setSize(size.width, size.height)
    pipeline.current = composer
    invalidate()
    return () => { pipeline.current = null; bloom.dispose(); output.dispose(); render.dispose(); composer.dispose() }
  }, [gl, scene, camera, size.width, size.height, invalidate])
  useFrame(() => pipeline.current?.render(), 1)
  return null
}

function SceneContent(props: VaultSceneProps) {
  const mobile = useThree(state => state.size.width < 760)
  const compact = mobile || props.lightQuality
  const gl = useThree(state => state.gl)
  const invalidate = useThree(state => state.invalidate)
  const regress = useThree(state => state.performance.regress)
  useEffect(() => {
    const canvas = gl.domElement
    const lost = (event: Event) => { event.preventDefault(); props.onContextLost() }
    canvas.addEventListener('webglcontextlost', lost)
    return () => canvas.removeEventListener('webglcontextlost', lost)
  }, [gl, props.onContextLost])
  useEffect(() => { invalidate(); regress() }, [props.missionId, props.animated, props.identityComplete, invalidate, regress])
  return <>
    <fog attach="fog" args={['#080c17', 11, 45]} />
    <Environment resolution={64} frames={1}>
      <Lightformer intensity={3} color="#d0e1fa" position={[0, 5, 2]} rotation={[Math.PI / 2, 0, 0]} scale={[12, 3, 1]} />
      <Lightformer intensity={2} color="#8faaff" position={[-5, 1, 3]} rotation={[0, Math.PI / 2, 0]} scale={[5, 8, 1]} />
      <Lightformer intensity={2} color="#a2d8ea" position={[5, 0, 2]} rotation={[0, -Math.PI / 2, 0]} scale={[4, 7, 1]} />
    </Environment>
    <Lighting signals={props.signals} animated={props.animated} shadows={!compact} />
    <Chamber compact={mobile} signals={props.signals} />
    <VaultMechanism identityComplete={props.identityComplete} signals={props.signals} animated={props.animated} mobile={mobile} missionId={props.missionId} />
    <MissionTransition signals={props.signals} animated={props.animated} mobile={mobile} missionId={props.missionId} />
    <ParticleField signals={props.signals} animated={props.animated} compact={compact} />
    <MissionInstrument signals={props.signals} animated={props.animated} missionId={props.missionId} compact={mobile} />
    <ArtifactReveal evidence={verifiedCompletion} signals={props.signals} animated={props.animated} />
    <VaultOpening evidence={verifiedCompletion} signals={props.signals} paused={!props.animated} />
    <CinematicCamera signals={props.signals} animated={props.animated} missionId={props.missionId} />
    <AdaptiveDpr />
    {!props.lightQuality && <PerformanceMonitor ms={500} iterations={4} bounds={() => [28, 55]} flipflops={1} onDecline={props.onSlowHardware} onFallback={props.onSlowHardware} />}
    {!compact && <PostProcessing />}
  </>
}

export default function VaultScene(props: VaultSceneProps) {
  return <Canvas
    camera={{ position: [0, 0.7, 15], fov: 43, near: 0.08, far: 100 }}
    dpr={props.lightQuality ? 1 : [1, 1.35]}
    performance={{ min: 0.65, max: 1, debounce: 700 }}
    shadows={props.lightQuality ? false : 'percentage'}
    frameloop={props.animated ? 'always' : 'demand'}
    gl={{ antialias: !props.lightQuality, alpha: false, powerPreference: 'high-performance' }}
    onCreated={({ gl }) => { gl.setClearColor(new Color('#080c17'), 1); props.onReady() }}
  ><SceneContent {...props} /></Canvas>
}
