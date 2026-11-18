type Props = {
  className?: string
}

/** Ilustración decorativa: un mate con bombilla y vapor. */
export function MateIllustration({ className }: Props) {
  return (
    <svg
      viewBox="0 0 240 270"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <g
        className="steam"
        fill="none"
        stroke="var(--muted-foreground)"
        strokeWidth="5"
        strokeLinecap="round"
      >
        <path d="M78 92c-10-12 10-20 0-34s8-20 2-30" />
        <path d="M108 86c-10-12 10-20 0-34s8-20 2-30" />
        <path d="M136 94c-8-10 8-17 0-28s6-17 2-25" />
      </g>

      {/* Sombra en el piso */}
      <ellipse cx="120" cy="250" rx="72" ry="10" fill="var(--foreground)" opacity="0.1" />

      {/* Bombilla */}
      <path
        d="M148 132 196 34"
        stroke="var(--steel)"
        strokeWidth="9"
        strokeLinecap="round"
      />
      <path
        d="M192 42 206 14"
        stroke="var(--steel)"
        strokeWidth="13"
        strokeLinecap="round"
      />

      {/* Calabaza */}
      <path
        d="M56 128c-6 70 18 120 64 120s70-50 64-120z"
        fill="var(--wood)"
      />
      <path
        d="M70 190c8 30 26 48 50 48s42-18 50-48c-12 20-30 30-50 30s-38-10-50-30z"
        fill="var(--foreground)"
        opacity="0.14"
      />
      <path
        d="M74 150c0 26 6 48 16 62"
        fill="none"
        stroke="var(--card)"
        strokeWidth="6"
        strokeLinecap="round"
        opacity="0.3"
      />

      {/* Virola y yerba */}
      <ellipse cx="120" cy="128" rx="66" ry="19" fill="var(--steel)" />
      <ellipse cx="120" cy="127" rx="56" ry="13" fill="var(--yerba)" />
      <g fill="var(--card)" opacity="0.5">
        <circle cx="92" cy="126" r="2.2" />
        <circle cx="110" cy="132" r="1.8" />
        <circle cx="128" cy="123" r="2" />
        <circle cx="104" cy="121" r="1.6" />
        <circle cx="134" cy="133" r="1.6" />
      </g>
    </svg>
  )
}
