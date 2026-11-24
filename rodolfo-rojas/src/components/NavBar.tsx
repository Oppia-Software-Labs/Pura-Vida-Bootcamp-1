import { CONCEPTS } from '../content/concepts'
import { PERSONAS, type PersonaId } from '../content/personas'
import { AVATAR_GRIDS } from '../content/scenes'
import type { Wallet } from '../hooks/useWallet'
import { balanceLabel, shortAddress } from '../lib/stellar'
import { PixelArt } from './PixelArt'

type NavBarProps = {
  persona: PersonaId
  onPersonaChange: (id: PersonaId) => void
  wallet: Wallet
  activeConcept: number
}

export function NavBar({ persona, onPersonaChange, wallet, activeConcept }: NavBarProps) {
  return (
    <header className="sticky top-0 z-20 bg-azul text-white">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-2.5 px-4 py-2.5 sm:px-6">
        <a href="#conceptos" className="font-pixel text-xl">
          Abuelita Stellar
        </a>
        <nav aria-label="Cambiar de rol" className="flex gap-1">
          {PERSONAS.map((p) => (
            <button
              key={p.id}
              onClick={() => onPersonaChange(p.id)}
              aria-pressed={p.id === persona}
              className={`flex min-h-11 items-center gap-2 py-1 pr-2.5 pl-1.5 ${
                p.id === persona ? 'bg-white text-navy' : 'text-niebla hover:bg-white/10'
              }`}
            >
              <PixelArt grid={AVATAR_GRIDS[p.id]} size={32} />
              <span className="eyebrow hidden md:inline">{p.short}</span>
            </button>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-3">
          <span className="eyebrow border border-white/40 px-3 py-2" title={wallet.address ?? undefined}>
            {shortAddress(wallet.address!)} · {balanceLabel(wallet.account)}
          </span>
          <button onClick={wallet.disconnect} className="eyebrow min-h-11 text-niebla underline hover:text-white">
            Salir
          </button>
        </div>
      </div>
      <div
        role="progressbar"
        aria-label="Conceptos recorridos"
        aria-valuemin={0}
        aria-valuemax={CONCEPTS.length}
        aria-valuenow={Math.max(activeConcept + 1, 0)}
        className="mx-auto grid max-w-5xl grid-cols-8 gap-1 px-4 pb-2.5 sm:px-6"
      >
        {CONCEPTS.map((concept, index) => (
          <span key={concept.id} className={`h-1 ${index <= activeConcept ? 'bg-white' : 'bg-white/30'}`} />
        ))}
      </div>
    </header>
  )
}
