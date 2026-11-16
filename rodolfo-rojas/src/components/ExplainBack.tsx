import { useState, type FormEvent } from 'react'
import type { Concept } from '../content/concepts'
import { getKnowledge } from '../content/knowledge'
import type { PersonaId } from '../content/personas'
import type { AiSettingsState } from '../hooks/useAiSettings'
import { askAi } from '../lib/ai'
import { VERDICTS, buildFeynmanSystemPrompt, parseVerdict, type Verdict } from '../lib/prompts'

type ExplainBackProps = {
  concept: Concept
  persona: PersonaId
  ai: AiSettingsState
}

type Review = { verdict: Verdict; feedback: string }

const VERDICT_STYLES: Record<Verdict, string> = {
  '✅': 'bg-cafeto/10 ring-cafeto/40',
  '🟡': 'bg-mostaza/20 ring-mostaza/60',
  '❌': 'bg-terracota/10 ring-terracota/40',
}

const MIN_WORDS = 8

export function ExplainBack({ concept, persona, ai }: ExplainBackProps) {
  const [explanation, setExplanation] = useState('')
  const [review, setReview] = useState<Review | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const wordCount = explanation.trim().split(/\s+/).filter(Boolean).length

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const system = buildFeynmanSystemPrompt(persona, concept.title, getKnowledge(concept.knowledgeIds))
      setReview(parseVerdict(await askAi(ai.settings, system, explanation)))
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 rounded-2xl border-2 border-dashed border-terracota/40 bg-terracota/5 p-4">
      <p className="font-display text-xl font-bold text-terracota">🧠 Ahora explicámelo vos</p>
      <p className="mt-1 text-sm">
        Contá qué es <strong>{concept.title}</strong> con tus palabras, como si se lo explicaras a tu abuela. Si podés
        explicarlo simple, es que lo entendiste.
      </p>
      <textarea
        value={explanation}
        onChange={(e) => setExplanation(e.target.value)}
        rows={3}
        placeholder="Es como cuando…"
        className="mt-3 w-full rounded-xl border border-cafe/20 bg-white p-3"
      />
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={busy || wordCount < MIN_WORDS}
          className="rounded-full bg-terracota px-5 py-2 font-bold text-crema hover:opacity-90 disabled:opacity-50"
        >
          {busy ? 'Revisando…' : '¿Lo entendí?'}
        </button>
        {wordCount < MIN_WORDS && <span className="text-xs opacity-60">Escribí al menos {MIN_WORDS} palabras.</span>}
        {!ai.settings.apiKey && (
          <a href="#preguntar" className="text-xs underline opacity-75">
            Necesitás una API key (abajo, en “Preguntale a la abuelita”)
          </a>
        )}
      </div>
      {error && <p className="mt-3 rounded-xl bg-terracota/10 p-3 text-terracota">{error}</p>}
      {review && (
        <div className={`mt-4 rounded-xl p-4 ring-1 ${VERDICT_STYLES[review.verdict]}`}>
          <p className="font-bold">
            {review.verdict} {VERDICTS[review.verdict]}
          </p>
          <p className="mt-1 whitespace-pre-line">{review.feedback}</p>
        </div>
      )}
    </form>
  )
}
