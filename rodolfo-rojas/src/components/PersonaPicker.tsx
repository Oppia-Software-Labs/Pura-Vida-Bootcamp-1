import { PERSONAS, type PersonaId } from '../content/personas'

type PersonaPickerProps = {
  selected: PersonaId
  onSelect: (id: PersonaId) => void
}

export function PersonaPicker({ selected, onSelect }: PersonaPickerProps) {
  return (
    <div role="radiogroup" aria-label="¿Quién te lo explica?" className="grid gap-3 sm:grid-cols-3">
      {PERSONAS.map((persona) => {
        const isSelected = persona.id === selected
        return (
          <button
            key={persona.id}
            role="radio"
            aria-checked={isSelected}
            onClick={() => onSelect(persona.id)}
            className={`rounded-2xl border-2 p-4 text-left transition ${
              isSelected ? 'border-terracota bg-terracota/10' : 'border-cafe/15 hover:border-cafe/40'
            }`}
          >
            <span className="text-3xl" aria-hidden>{persona.emoji}</span>
            <span className="mt-1 block font-bold">{persona.name}</span>
            <span className="block text-sm opacity-70">{persona.audience}</span>
          </button>
        )
      })}
    </div>
  )
}
