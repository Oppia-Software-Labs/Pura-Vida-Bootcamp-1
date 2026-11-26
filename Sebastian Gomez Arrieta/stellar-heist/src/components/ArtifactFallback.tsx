import { artifactAppearance } from '../experience/artifact'

export function ArtifactFallback({ hash }: { hash: string }) {
  const appearance = artifactAppearance(hash)
  const count = appearance.detail ? 8 : 6
  const points = Array.from({ length: count }, (_, i) => {
    const angle = i / count * Math.PI * 2 + appearance.rotation
    return [350 + Math.cos(angle) * 145, 300 + Math.sin(angle) * 145] as const
  })
  return <div className="vault-art" role="img" aria-label="Artefacto Génesis derivado de una transacción confirmada en Stellar Testnet. Tres sellos completados.">
    <svg className="vault-svg" viewBox="0 0 700 640" fill="none" aria-hidden="true">
      <circle cx="350" cy="300" r="235" stroke="#466579" strokeWidth="2" />
      <circle cx="350" cy="300" r="205" stroke="#a4e6cd" strokeOpacity=".5" />
      <g stroke={`hsl(${appearance.hue},65%,70%)`} strokeWidth="2">
        <polygon points={points.map(point => point.join(',')).join(' ')} />
        {points.map(([x, y], i) => <path key={i} d={`M${x} ${y}L350 200L${points[(i + 2) % points.length].join(' ')}L350 400Z`} />)}
      </g>
      <text x="350" y="580" textAnchor="middle" fill="#a4e6cd" fontFamily="sans-serif" fontSize="16">Génesis · 3 de 3 · Testnet</text>
    </svg>
  </div>
}
