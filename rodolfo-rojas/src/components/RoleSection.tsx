import { PERSONAS, type PersonaId } from '../content/personas'
import { AVATAR_GRIDS } from '../content/scenes'
import { PixelArt } from './PixelArt'

type RoleSectionProps = {
  selected: PersonaId | null
  onSelect: (id: PersonaId) => void
}

export function RoleSection({ selected, onSelect }: RoleSectionProps) {
  return (
    <section id="rol" className="mx-auto flex min-h-dvh max-w-5xl flex-col items-center justify-center gap-5 px-4 py-20 text-center sm:px-6">
      <p className="eyebrow text-tinta">Abuelita Stellar · Pura Vida Bootcamp</p>
      <h1 className="font-pixel text-5xl leading-none text-azul sm:text-7xl lg:text-8xl">What does it really mean?</h1>
      <p className="max-w-xl text-lg text-tinta">
        Wallets, trustlines, burn, smart contracts. Escogé quién te lo explica y aprendé Stellar como si te lo contara
        alguien de la casa.
      </p>
      <h2 className="eyebrow mt-10">Select your role</h2>
      <ul className="grid w-full gap-7 text-left sm:grid-cols-3">
        {PERSONAS.map((persona) => {
          const isSelected = persona.id === selected
          return (
            <li key={persona.id}>
              <button
                onClick={() => onSelect(persona.id)}
                aria-pressed={isSelected}
                className={`flex h-full w-full flex-col gap-3.5 border-2 border-navy p-6 text-left shadow-hard transition-transform duration-100 hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-1 active:translate-y-1 active:shadow-none ${
                  isSelected ? 'bg-azul text-white' : 'bg-white text-navy'
                }`}
              >
                <PixelArt grid={AVATAR_GRIDS[persona.id]} size={128} label={persona.avatarAlt} className="border-2 border-navy" />
                <span className="font-pixel text-2xl leading-tight">{persona.name}</span>
                <span className="text-[15px] leading-relaxed opacity-85">{persona.blurb}</span>
                <span className="eyebrow mt-auto">{isSelected ? 'Tu rol' : 'Empezar ↓'}</span>
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
