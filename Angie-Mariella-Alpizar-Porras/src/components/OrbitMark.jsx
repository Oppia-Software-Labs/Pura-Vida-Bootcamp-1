export function StarMark({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M12 1.2 14.1 9.9 22.8 12 14.1 14.1 12 22.8 9.9 14.1 1.2 12 9.9 9.9 Z" fill="currentColor" />
    </svg>
  )
}

export function OrbitGraphic({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 220 120" aria-hidden="true" focusable="false">
      <ellipse cx="78" cy="60" rx="70" ry="24" fill="none" stroke="currentColor" />
      <ellipse cx="78" cy="60" rx="46" ry="14" fill="none" stroke="currentColor" />
      <circle cx="78" cy="60" r="2.2" fill="currentColor" />
      <circle cx="148" cy="60" r="2" fill="currentColor" />
      <path d="M176 28 179.2 38.2 189.4 41.4 179.2 44.6 176 54.8 172.8 44.6 162.6 41.4 172.8 38.2 Z" fill="currentColor" />
      <path d="M18 18 H42 M30 6 V30" fill="none" stroke="currentColor" />
    </svg>
  )
}

export function SpaceField({ className = '' }) {
  return (
    <svg className={className} viewBox="0 0 280 180" aria-hidden="true" focusable="false">
      <line x1="0" y1="90" x2="280" y2="90" stroke="currentColor" strokeWidth="0.6" />
      <line x1="140" y1="8" x2="140" y2="172" stroke="currentColor" strokeWidth="0.6" />
      <ellipse cx="140" cy="90" rx="92" ry="34" fill="none" stroke="currentColor" />
      <ellipse cx="140" cy="90" rx="58" ry="18" fill="none" stroke="currentColor" />
      <circle cx="140" cy="90" r="2.4" fill="currentColor" />
      <circle cx="232" cy="90" r="2.6" fill="currentColor" />
      <path d="M48 36 52.4 49.2 65.6 53.6 52.4 58 48 71.2 43.6 58 30.4 53.6 43.6 49.2 Z" fill="currentColor" />
      <rect x="196" y="28" width="18" height="18" fill="none" stroke="currentColor" />
    </svg>
  )
}
