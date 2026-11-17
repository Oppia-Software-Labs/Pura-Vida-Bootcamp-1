import { Check, Fingerprint, LockKeyhole, ScanLine, Send } from 'lucide-react'

export function VaultFallback({ identityComplete = false }: { identityComplete?: boolean }) {
  return (
    <div className="vault-art" role="img" aria-label={`Bóveda Génesis sellada. ${identityComplete ? 'Primer sello completado; dos pendientes.' : 'Tres cerraduras pendientes.'}`}>
      <svg className="vault-svg" viewBox="0 0 700 640" fill="none" aria-hidden="true">
        <defs>
          <radialGradient id="vault-halo"><stop stopColor="#157a9a" stopOpacity=".35" /><stop offset="1" stopColor="#07101b" stopOpacity="0" /></radialGradient>
          <linearGradient id="steel" x1="100" y1="80" x2="550" y2="560" gradientUnits="userSpaceOnUse"><stop stopColor="#42576c" /><stop offset=".22" stopColor="#192c3f" /><stop offset=".5" stopColor="#09121e" /><stop offset=".77" stopColor="#283c50" /><stop offset="1" stopColor="#101b2b" /></linearGradient>
          <linearGradient id="edge" x1="150" y1="80" x2="560" y2="570" gradientUnits="userSpaceOnUse"><stop stopColor="#8cacc3" /><stop offset=".3" stopColor="#263a4e" /><stop offset=".65" stopColor="#101a2b" /><stop offset="1" stopColor="#5e87a0" /></linearGradient>
          <radialGradient id="door"><stop stopColor="#17243a" /><stop offset=".7" stopColor="#101b2d" /><stop offset="1" stopColor="#070f1a" /></radialGradient>
          <linearGradient id="cyan-edge"><stop stopColor="#72f8f1" /><stop offset="1" stopColor="#489dc8" /></linearGradient>
          <linearGradient id="core-glass" x1="250" y1="200" x2="410" y2="420" gradientUnits="userSpaceOnUse"><stop stopColor="#35416c" /><stop offset=".5" stopColor="#111b30" /><stop offset="1" stopColor="#152a3d" /></linearGradient>
          <filter id="cyan-glow" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="5" /></filter>
          <filter id="vault-shadow" x="-30%" y="-30%" width="160%" height="170%"><feDropShadow dx="0" dy="22" stdDeviation="18" floodColor="#000" floodOpacity=".8" /></filter>
        </defs>
        <ellipse cx="350" cy="580" rx="235" ry="25" fill="#070811" />
        <circle cx="350" cy="315" r="310" fill="url(#vault-halo)" />
        <g stroke="#26374b" strokeWidth="1">
          <path d="M0 147h102l32 32M0 488h110l30-30M700 147H598l-32 32M700 488H590l-30-30" />
          <path d="M50 96v438M650 96v438M20 194h35M645 194h35M20 444h35M645 444h35" />
          <path d="M110 65h65M110 65v55M590 65h-65M590 65v55M110 574h65M110 574v-55M590 574h-65M590 574v-55" stroke="#507080" />
        </g>
        <g filter="url(#vault-shadow)">
          <circle cx="350" cy="315" r="258" fill="#0b111e" stroke="#2c3e52" strokeWidth="2" />
          <circle cx="350" cy="315" r="248" fill="url(#steel)" stroke="url(#edge)" strokeWidth="5" />
          <circle cx="350" cy="315" r="232" stroke="#070e19" strokeWidth="17" />
          <circle cx="350" cy="315" r="232" stroke="#526578" strokeWidth="1" />
          {Array.from({ length: 24 }, (_, i) => (
            <g key={i} transform={`rotate(${i * 15} 350 315)`}>
              <path d="M350 74v23" stroke="#070e19" strokeWidth="3" />
              <circle cx="350" cy="103" r="5" fill="#08121e" stroke="#52677b" strokeWidth="1.5" />
              <path d="M348 101h4" stroke="#91a9b9" strokeOpacity=".5" />
            </g>
          ))}
          <circle cx="350" cy="315" r="209" fill="#060c15" stroke="#58748c" strokeWidth="2" />
          <circle cx="350" cy="315" r="204" stroke="#244b60" strokeWidth="7" />
          <circle className="vault-light-ring" cx="350" cy="315" r="204" stroke="#67efec" strokeWidth="3" strokeDasharray="180 247" transform="rotate(-77 350 315)" filter="url(#cyan-glow)" />
          <circle cx="350" cy="315" r="204" stroke="url(#cyan-edge)" strokeWidth="2" strokeDasharray="180 247" transform="rotate(-77 350 315)" />
          <circle cx="350" cy="315" r="192" fill="url(#door)" stroke="url(#edge)" strokeWidth="8" />
          <circle cx="350" cy="315" r="178" stroke="#2a3b50" strokeWidth="1" />
          <path d="M350 127v376" stroke="#030810" strokeWidth="4" /><path d="M354 128v374" stroke="#446077" strokeOpacity=".4" />
          {[0, 90, 180, 270].map((angle) => <g key={angle} transform={`rotate(${angle} 350 315)`}><rect x="331" y="133" width="38" height="55" rx="3" fill="url(#steel)" stroke="#4a657a" /><path d="M339 145h22M339 151h22M339 169h22" stroke="#0a1422" strokeWidth="3" /><rect x="340" y="180" width="20" height="4" fill="#62cfdd" /></g>)}
          <path d="M282 224 350 185l68 39v80l-68 39-68-39z" fill="url(#core-glass)" stroke="#576b90" />
          <path d="M293 231 350 198l57 33v66l-57 33-57-33z" stroke="#8d83e8" strokeOpacity=".6" />
          <path d="m350 213 42 24v49l-42 24-42-24v-49z" fill="#11192b" stroke="#a391ff" strokeWidth="1.5" />
          <path d="m350 228 28 16v33l-28 16-28-16v-33z" stroke="#8b82de" strokeOpacity=".45" />
          <path d="m335 261 10 6 21-13M335 272l10 6 21-13" stroke="#d1c8ff" strokeWidth="2" strokeLinecap="round" />
          <text x="350" y="367" textAnchor="middle" fill="#d6e4f0" fontFamily="monospace" fontSize="13" letterSpacing="6">GENESIS</text>
          <text x="350" y="386" textAnchor="middle" fill="#6d8299" fontFamily="monospace" fontSize="8" letterSpacing="2">PROTOCOLO DE ACCESO</text>
          <path d="M281 404h138" stroke="#30445b" />
          <text x="350" y="430" textAnchor="middle" fill="#9aaec3" fontFamily="monospace" fontSize="10" letterSpacing="3">{identityComplete ? '01' : '00'} / 03</text>
          <g fill="url(#steel)" stroke="#4a637b"><rect x="80" y="282" width="88" height="62" rx="5" /><rect x="532" y="282" width="88" height="62" rx="5" /></g>
          <g stroke="#08111d" strokeWidth="7"><path d="M94 299h64M94 327h64M542 299h64M542 327h64" /></g>
          <g fill="#8299ac"><circle cx="94" cy="313" r="3" /><circle cx="606" cy="313" r="3" /></g>
        </g>
        <g stroke="#9b86eb" strokeOpacity=".5"><path d="M350 34v18M350 578v18M70 315H52M648 315h-18" /></g>
      </svg>
      <div className={`vault-lock vault-lock-one ${identityComplete ? 'is-complete' : ''}`}><Fingerprint size={18} /><span>01</span>{identityComplete ? <Check size={10} /> : <LockKeyhole size={10} />}</div>
      <div className="vault-lock vault-lock-two"><ScanLine size={18} /><span>02</span><LockKeyhole size={10} /></div>
      <div className="vault-lock vault-lock-three"><Send size={17} /><span>03</span><LockKeyhole size={10} /></div>
    </div>
  )
}
