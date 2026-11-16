import { useState } from 'react'
import { CONCEPTS, type Concept } from '../content/concepts'
import type { PersonaId } from '../content/personas'
import type { AiSettingsState } from '../hooks/useAiSettings'
import { useDonaRosa, type DonaRosa } from '../hooks/useDonaRosa'
import { usePulperia, type Pulperia } from '../hooks/usePulperia'
import type { Wallet } from '../hooks/useWallet'
import { PersonaPicker } from './PersonaPicker'
import { ExplainBack } from './ExplainBack'
import { Section } from './Section'
import { TryIt } from './TryIt'

type StoriesSectionProps = {
  wallet: Wallet
  ai: AiSettingsState
  persona: PersonaId
  onPersonaChange: (id: PersonaId) => void
}

export function StoriesSection({ wallet, ai, persona, onPersonaChange }: StoriesSectionProps) {
  const rosa = useDonaRosa(wallet)
  const pulperia = usePulperia(wallet)
  const [selectedId, setSelectedId] = useState(CONCEPTS[0].id)
  const concept = CONCEPTS.find((c) => c.id === selectedId) ?? CONCEPTS[0]

  return (
    <Section id="cuentos" emoji="📚" title="Los cuentos">
      <p className="mb-4">Primero escogé quién te lo explica. Después tocá un concepto.</p>
      <PersonaPicker selected={persona} onSelect={onPersonaChange} />
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {CONCEPTS.map((c) => (
          <ConceptTile key={c.id} concept={c} selected={c.id === selectedId} onSelect={setSelectedId} />
        ))}
      </div>
      <Story concept={concept} persona={persona} wallet={wallet} ai={ai} rosa={rosa} pulperia={pulperia} />
    </Section>
  )
}

type ConceptTileProps = {
  concept: Concept
  selected: boolean
  onSelect: (id: string) => void
}

function ConceptTile({ concept, selected, onSelect }: ConceptTileProps) {
  return (
    <button
      onClick={() => onSelect(concept.id)}
      aria-pressed={selected}
      className={`rounded-2xl p-3 text-left transition ${
        selected ? 'bg-cafe text-crema' : 'bg-crema ring-1 ring-cafe/15 hover:ring-cafe/40'
      }`}
    >
      <span className="text-2xl" aria-hidden>{concept.emoji}</span>
      <span className="block font-bold">{concept.title}</span>
      <span className="block text-xs opacity-75">{concept.analogy}</span>
    </button>
  )
}

type StoryProps = {
  concept: Concept
  persona: PersonaId
  wallet: Wallet
  ai: AiSettingsState
  rosa: DonaRosa
  pulperia: Pulperia
}

function Story({ concept, persona, wallet, ai, rosa, pulperia }: StoryProps) {
  return (
    <article className="mt-6 rounded-3xl bg-crema p-5 ring-1 ring-cafe/10 sm:p-7">
      <h3 className="font-display text-2xl font-bold">
        {concept.emoji} {concept.title}: <span className="font-normal italic">{concept.analogy}</span>
      </h3>
      <pre className="mt-4 overflow-x-auto rounded-2xl bg-cafe p-4 font-mono text-sm leading-snug text-mostaza">
        {concept.drawing.replace(/^\n/, '')}
      </pre>
      <p className="mt-4 whitespace-pre-line text-lg leading-relaxed">{concept.stories[persona]}</p>
      {persona === 'ingeniera' && concept.code && (
        <pre className="mt-4 overflow-x-auto rounded-2xl bg-cafe/90 p-4 font-mono text-sm text-crema">
          <code>{concept.code}</code>
        </pre>
      )}
      <a
        href={concept.docs.url}
        target="_blank"
        rel="noreferrer"
        className="mt-4 inline-block text-sm underline opacity-75 hover:opacity-100"
      >
        📖 Documentación oficial: {concept.docs.label}
      </a>
      <TryIt conceptId={concept.id} wallet={wallet} rosa={rosa} pulperia={pulperia} />
      <ExplainBack key={concept.id} concept={concept} persona={persona} ai={ai} />
    </article>
  )
}
