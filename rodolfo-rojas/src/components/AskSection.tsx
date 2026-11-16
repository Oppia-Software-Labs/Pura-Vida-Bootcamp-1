import { useState, type FormEvent } from 'react'
import { findRelevantKnowledge, type KnowledgeEntry } from '../content/knowledge'
import { PERSONAS, type PersonaId } from '../content/personas'
import type { AiSettingsState } from '../hooks/useAiSettings'
import { askAi } from '../lib/ai'
import { buildAskSystemPrompt } from '../lib/prompts'
import { AiSettingsPanel } from './AiSettingsPanel'
import { Section } from './Section'

const SUGGESTIONS = [
  '¿Qué es un anchor y cómo cambio colones a algo en Stellar?',
  '¿Por qué necesito tener al menos 1 XLM?',
  '¿Qué diferencia hay entre Stellar y Bitcoin con eso de minar?',
  '¿Qué es una liquidity pool?',
]

type Answer = {
  question: string
  text: string
  sources: KnowledgeEntry[]
}

type AskSectionProps = {
  ai: AiSettingsState
  persona: PersonaId
}

export function AskSection({ ai, persona }: AskSectionProps) {
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState<Answer | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const speaker = PERSONAS.find((p) => p.id === persona)!

  const ask = async (text: string) => {
    if (!text.trim()) return
    setBusy(true)
    setError(null)
    try {
      const sources = findRelevantKnowledge(text)
      const reply = await askAi(ai.settings, buildAskSystemPrompt(persona, sources), text)
      setAnswer({ question: text, text: reply, sources })
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const onSubmit = (event: FormEvent) => {
    event.preventDefault()
    ask(question)
  }

  return (
    <Section id="preguntar" emoji="💬" title="Preguntale a la abuelita">
      <p className="mb-4">
        ¿Te quedó una duda que no está en los cuentos? Preguntá lo que sea de Stellar. Te responde{' '}
        <strong>
          {speaker.emoji} {speaker.name.toLowerCase()}
        </strong>{' '}
        (lo cambiás arriba, en los cuentos), con datos de la documentación oficial.
      </p>
      <AiSettingsPanel ai={ai} />
      <form onSubmit={onSubmit} className="mt-4 flex flex-col gap-3 sm:flex-row">
        <input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ej: ¿qué es SEP-24?"
          className="flex-1 rounded-xl border border-cafe/20 bg-white px-4 py-3"
        />
        <button
          type="submit"
          disabled={busy}
          className="rounded-full bg-terracota px-6 py-3 font-bold text-crema hover:opacity-90 disabled:opacity-50"
        >
          {busy ? 'Pensando…' : 'Preguntar'}
        </button>
      </form>
      <div className="mt-3 flex flex-wrap gap-2">
        {SUGGESTIONS.map((suggestion) => (
          <button
            key={suggestion}
            onClick={() => {
              setQuestion(suggestion)
              ask(suggestion)
            }}
            disabled={busy}
            className="rounded-full bg-mostaza/20 px-3 py-1 text-sm hover:bg-mostaza/40"
          >
            {suggestion}
          </button>
        ))}
      </div>
      {error && <p className="mt-4 rounded-xl bg-terracota/10 p-3 text-terracota">{error}</p>}
      {answer && <AnswerCard answer={answer} speakerEmoji={speaker.emoji} />}
    </Section>
  )
}

function AnswerCard({ answer, speakerEmoji }: { answer: Answer; speakerEmoji: string }) {
  return (
    <article className="mt-6 rounded-3xl bg-crema p-5 ring-1 ring-cafe/10">
      <p className="text-sm italic opacity-70">“{answer.question}”</p>
      <p className="mt-3 whitespace-pre-line text-lg leading-relaxed">
        <span aria-hidden>{speakerEmoji} </span>
        {answer.text}
      </p>
      {answer.sources.length > 0 && (
        <div className="mt-4 text-sm">
          <p className="font-bold opacity-75">📖 Basado en la documentación oficial:</p>
          <ul className="mt-1 list-inside list-disc">
            {answer.sources.map((source) => (
              <li key={source.id}>
                <a className="underline" href={source.url} target="_blank" rel="noreferrer">
                  {source.title}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </article>
  )
}
