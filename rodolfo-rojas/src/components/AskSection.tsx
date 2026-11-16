import { useState, type FormEvent } from 'react'
import { findRelevantKnowledge, type KnowledgeEntry } from '../content/knowledge'
import { personaById, type PersonaId } from '../content/personas'
import type { ClaudeKey } from '../hooks/useClaudeKey'
import { askClaude } from '../lib/ai'
import { buildAskSystemPrompt } from '../lib/prompts'
import { SpeechBubble } from './SpeechBubble'
import { Button, ExternalLink, Notice, Panel } from './ui'

const SUGGESTIONS = [
  '¿Qué es un anchor y cómo cambio colones a algo en Stellar?',
  '¿Por qué necesito tener al menos 1 XLM?',
  '¿Stellar se mina como Bitcoin?',
  '¿Qué es una liquidity pool?',
]

type Exchange = {
  question: string
  answer: string
  sources: KnowledgeEntry[]
}

type AskSectionProps = {
  claude: ClaudeKey
  persona: PersonaId
}

export function AskSection({ claude, persona }: AskSectionProps) {
  const [question, setQuestion] = useState('')
  const [thread, setThread] = useState<Exchange[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const ask = async (text: string) => {
    if (!text.trim()) return
    setBusy(true)
    setError(null)
    try {
      const sources = findRelevantKnowledge(text)
      const answer = await askClaude(claude.apiKey, buildAskSystemPrompt(persona, sources), text)
      setThread((previous) => [...previous, { question: text, answer, sources }])
      setQuestion('')
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
    <section
      id="preguntas"
      aria-labelledby="preguntas-titulo"
      className="mx-auto max-w-3xl border-t-2 border-navy px-4 py-24 sm:px-6"
    >
      <div className="flex flex-col items-center gap-3 text-center">
        <p className="eyebrow text-verde">Tutorial completo</p>
        <h2 id="preguntas-titulo" className="font-pixel text-4xl leading-tight sm:text-5xl">
          ¿Tenés más preguntas?
        </h2>
        <p className="max-w-xl text-tinta">
          Preguntale a {personaById(persona).name.toLowerCase()} lo que sea de Stellar. Responde con datos de la
          documentación oficial. Si cambiás de rol, la conversación empieza de cero.
        </p>
      </div>

      <ClaudeKeyField claude={claude} />

      {thread.length > 0 && (
        <ol className="mt-10 flex max-w-3xl flex-col gap-8" aria-live="polite">
          {thread.map((exchange, index) => (
            <li key={index} className="flex flex-col gap-4">
              <p className="self-end border-2 border-navy bg-azul px-4 py-3 text-white">{exchange.question}</p>
              <SpeechBubble persona={persona}>
                <span className="whitespace-pre-line">{exchange.answer}</span>
                {exchange.sources.length > 0 && <Sources sources={exchange.sources} />}
              </SpeechBubble>
            </li>
          ))}
        </ol>
      )}

      <form onSubmit={onSubmit} className="mt-8 flex max-w-3xl flex-col gap-3 sm:flex-row">
        <label htmlFor="pregunta" className="sr-only">
          Tu pregunta
        </label>
        <input
          id="pregunta"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ej: ¿qué es SEP-24?"
          className="min-h-11 flex-1 border-2 border-navy bg-white px-4"
        />
        <Button type="submit" disabled={busy || !claude.apiKey || !question.trim()}>
          {busy ? 'Pensando…' : 'Preguntar'}
        </Button>
      </form>
      <div className="mt-4 flex max-w-3xl flex-wrap gap-2">
        {SUGGESTIONS.map((suggestion) => (
          <button
            key={suggestion}
            onClick={() => ask(suggestion)}
            disabled={busy || !claude.apiKey}
            className="min-h-11 border border-borde bg-white px-3 py-2 text-left text-sm hover:border-azul disabled:opacity-50"
          >
            {suggestion}
          </button>
        ))}
      </div>
      {error && (
        <div className="mt-6 max-w-3xl">
          <Notice tone="error">{error}</Notice>
        </div>
      )}
    </section>
  )
}

function ClaudeKeyField({ claude }: { claude: ClaudeKey }) {
  return (
    <Panel className="mt-8 max-w-3xl p-5">
      <label htmlFor="claude-key" className="eyebrow text-navy">
        Tu llave de Claude
      </label>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <input
          id="claude-key"
          type="password"
          value={claude.apiKey}
          onChange={(e) => claude.setApiKey(e.target.value)}
          placeholder="sk-ant-…"
          autoComplete="off"
          spellCheck={false}
          className="min-h-11 min-w-0 flex-1 basis-64 border-2 border-navy bg-papel px-3 font-mono text-sm"
        />
        {claude.apiKey && (
          <Button variant="ghost" onClick={claude.forget}>
            Olvidar
          </Button>
        )}
      </div>
      <p className="mt-3 text-xs text-tinta">
        Conseguí una en <ExternalLink href="https://console.anthropic.com/settings/keys">console.anthropic.com</ExternalLink>.
        Se guarda solo en este navegador y va directo a Anthropic.
      </p>
    </Panel>
  )
}

function Sources({ sources }: { sources: KnowledgeEntry[] }) {
  return (
    <span className="mt-4 block border-t border-borde pt-3 text-sm">
      <span className="eyebrow block text-tinta">Fuentes oficiales</span>
      {sources.map((source) => (
        <span key={source.id} className="mt-1 block">
          <ExternalLink href={source.url}>{source.title}</ExternalLink>
        </span>
      ))}
    </span>
  )
}
