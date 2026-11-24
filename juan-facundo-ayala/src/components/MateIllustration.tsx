import { useId } from 'react'

type Props = {
  className?: string
}

/** Estrella de cuatro puntas, un guiño a Stellar. */
const STAR = 'M0-9C1-3 3-1 9 0 3 1 1 3 0 9-1 3-3 1-9 0-3-1-1-3 0-9Z'

/** Ilustración decorativa: un mate sobre su posamate, con vapor y estrellas. */
export function MateIllustration({ className }: Props) {
  // Los degradados necesitan ids únicos por si la ilustración se repite.
  const id = useId()
  const ref = (name: string) => `url(#${id}-${name})`

  return (
    <svg
      viewBox="0 0 260 310"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <linearGradient id={`${id}-gourd`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--wood-light)" />
          <stop offset="0.55" stopColor="var(--wood)" />
          <stop offset="1" stopColor="var(--wood-dark)" />
        </linearGradient>
        <linearGradient id={`${id}-metal`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="var(--steel-dark)" />
          <stop offset="0.35" stopColor="var(--steel-light)" />
          <stop offset="0.65" stopColor="var(--steel)" />
          <stop offset="1" stopColor="var(--steel-dark)" />
        </linearGradient>
        <radialGradient id={`${id}-yerba`} cx="0.4" cy="0.35" r="0.8">
          <stop offset="0" stopColor="var(--yerba-light)" />
          <stop offset="1" stopColor="var(--yerba)" />
        </radialGradient>
        <radialGradient id={`${id}-glow`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0" stopColor="var(--highlight)" stopOpacity="0.55" />
          <stop offset="1" stopColor="var(--highlight)" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`${id}-board`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="var(--board-dark)" />
          <stop offset="0.5" stopColor="var(--board)" />
          <stop offset="1" stopColor="var(--board-dark)" />
        </linearGradient>
        <filter id={`${id}-blur`} x="-50%" y="-100%" width="200%" height="300%">
          <feGaussianBlur stdDeviation="5" />
        </filter>
        <filter id={`${id}-soft`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.2" />
        </filter>
      </defs>

      {/* Resplandor de fondo */}
      <circle cx="130" cy="170" r="120" fill={ref('glow')} />

      {/* Estrellas */}
      <g fill="var(--primary)" className="mate-stars">
        <path d={STAR} transform="translate(38 96) scale(0.9)" />
        <path d={STAR} transform="translate(226 150) scale(0.7)" />
        <path d={STAR} transform="translate(52 214) scale(0.5)" />
      </g>

      {/* Posamate de madera, visto en perspectiva */}
      <ellipse cx="130" cy="279" rx="104" ry="23" fill="var(--board-edge)" />
      <ellipse cx="130" cy="272" rx="104" ry="23" fill={ref('board')} />
      <ellipse
        cx="130"
        cy="272"
        rx="88"
        ry="18"
        fill="none"
        stroke="var(--board-edge)"
        strokeWidth="1.5"
        opacity="0.45"
      />
      <ellipse
        cx="130"
        cy="271"
        rx="103"
        ry="22"
        fill="none"
        stroke="var(--wood-light)"
        strokeWidth="1"
        opacity="0.5"
      />
      {/* Sombra de apoyo del mate sobre el posamate */}
      <ellipse
        cx="134"
        cy="272"
        rx="62"
        ry="9"
        fill="var(--board-edge)"
        opacity="0.75"
        filter={ref('blur')}
      />

      <g>
        {/* Vapor */}
        <g
          className="mate-steam"
          fill="none"
          stroke="var(--steam)"
          strokeWidth="7"
          strokeLinecap="round"
          filter={ref('soft')}
        >
          <path d="M92 112c-12-14 12-22 0-38s10-22 2-34" />
          <path d="M122 106c-12-14 12-24 0-40s10-24 2-36" />
          <path d="M150 114c-10-12 10-19 0-32s8-19 2-28" />
        </g>

        {/* Bombilla */}
        <path
          d="M160 150 210 48"
          stroke={ref('metal')}
          strokeWidth="9"
          strokeLinecap="round"
        />
        <path
          d="M205 58 221 26"
          stroke={ref('metal')}
          strokeWidth="14"
          strokeLinecap="round"
        />
        <path
          d="M166 136 206 54"
          stroke="var(--steel-light)"
          strokeWidth="2"
          strokeLinecap="round"
          opacity="0.8"
        />

        {/* Calabaza */}
        <path
          d="M62 148c-8 78 20 126 68 126s76-48 68-126z"
          fill={ref('gourd')}
        />
        {/* Sombra interna y brillo */}
        <path
          d="M78 214c8 32 28 50 52 50s44-18 52-50c-12 22-32 32-52 32s-40-10-52-32z"
          fill="var(--wood-dark)"
          opacity="0.45"
        />
        <path
          d="M82 172c0 28 6 52 18 68"
          fill="none"
          stroke="var(--wood-light)"
          strokeWidth="7"
          strokeLinecap="round"
          opacity="0.7"
        />
        {/* Costura del cuero */}
        <path
          d="M70 184c40 14 80 14 120 0"
          fill="none"
          stroke="var(--wood-dark)"
          strokeWidth="2"
          strokeDasharray="5 6"
          strokeLinecap="round"
          opacity="0.6"
        />

        {/* Virola y yerba */}
        <ellipse cx="130" cy="148" rx="72" ry="21" fill={ref('metal')} />
        <ellipse
          cx="130"
          cy="146"
          rx="72"
          ry="21"
          fill="none"
          stroke="var(--steel-light)"
          strokeWidth="1.5"
          opacity="0.7"
        />
        <ellipse cx="130" cy="147" rx="60" ry="14" fill={ref('yerba')} />
        <g fill="var(--yerba-light)">
          <circle cx="100" cy="146" r="2.4" />
          <circle cx="118" cy="152" r="2" />
          <circle cx="138" cy="143" r="2.2" />
          <circle cx="112" cy="141" r="1.7" />
          <circle cx="146" cy="153" r="1.8" />
          <circle cx="160" cy="146" r="1.6" />
        </g>
      </g>
    </svg>
  )
}
