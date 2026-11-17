import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import type { RefObject } from 'react'
import { AdditiveBlending, Color, DoubleSide, Group, MathUtils, MeshBasicMaterial, ShaderMaterial } from 'three'
import type { SceneSignals } from '../../experience/types'

const vertex = `varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`
const fragment = `
  varying vec2 vUv; uniform float uTime; uniform float uOpacity; uniform vec3 uColor;
  void main(){
    vec2 p=(vUv-.5)*2.;float r=length(p);float a=atan(p.y,p.x);
    float spiral=.5+.5*sin(a*8.+r*20.-uTime*3.);
    float corona=exp(-abs(r-.63)*12.);
    float rays=pow(.5+.5*sin(a*24.+uTime),8.)*r;
    float mask=1.-smoothstep(.65,1.,r);
    gl_FragColor=vec4(uColor*(.6+spiral*.6+corona+rays),mask*uOpacity);
  }
`

export function MissionTransition({ signals, animated, mobile, missionId }: {
  signals: RefObject<SceneSignals>; animated: boolean; mobile: boolean; missionId: number
}) {
  const tunnel = useRef<Group>(null)
  const material = useRef<MeshBasicMaterial>(null)
  const portal = useRef<ShaderMaterial>(null)
  const time = useRef(0)
  const uniforms = useMemo(() => ({ uTime: { value: 0 }, uOpacity: { value: 0 }, uColor: { value: new Color('#7357ce') } }), [])
  useFrame((_, delta) => {
    if (animated) time.current += Math.min(delta, 0.05)
    const { travel } = signals.current
    if (tunnel.current) {
      tunnel.current.visible = travel > 0.005
      tunnel.current.rotation.z = Math.sin(time.current * 0.12) * 0.12
    }
    if (material.current) {
      material.current.opacity = MathUtils.smoothstep(travel, 0.03, 0.8) * 0.5
      material.current.color.set(missionId === 2 ? '#9b79f7' : '#4bd6ef')
    }
    if (portal.current) {
      portal.current.uniforms.uTime.value = time.current
      portal.current.uniforms.uOpacity.value = Math.sin(Math.PI * travel) * 0.98
    }
  })
  return <>
    <group ref={tunnel} visible={false}>
      {Array.from({ length: mobile ? 14 : 24 }, (_, i) => <mesh key={i} position={[MathUtils.lerp(mobile ? 0 : 1.8, 0, Math.min(i / 7, 1)), 0, -1 - i * 1.6]} rotation={[0, 0, i * 0.13]}>
        <torusGeometry args={[2.9, 0.016 + (i % 3) * 0.007, 4, 6]} />
        <meshBasicMaterial ref={i === 0 ? material : undefined} color={missionId === 2 ? '#9671f0' : '#54d8ed'} transparent opacity={0.22} blending={AdditiveBlending} depthWrite={false} />
      </mesh>)}
      {Array.from({ length: mobile ? 12 : 24 }, (_, i) => {
        const a = i / (mobile ? 12 : 24) * Math.PI * 2
        return <mesh key={i} position={[Math.cos(a) * 2.85, Math.sin(a) * 2.85, -18]}>
          <boxGeometry args={[0.008, 0.008, 36]} /><meshBasicMaterial color={i % 2 ? '#6984ce' : '#5eb8ce'} transparent opacity={0.22} blending={AdditiveBlending} />
        </mesh>
      })}
    </group>
    <mesh position={[mobile ? 0 : 1.8, 0, 1.01]}>
      <planeGeometry args={[7.4, 7.4]} />
      <shaderMaterial ref={portal} uniforms={uniforms} vertexShader={vertex} fragmentShader={fragment} transparent depthWrite={false} side={DoubleSide} />
    </mesh>
  </>
}
