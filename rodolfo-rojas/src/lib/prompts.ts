import type { KnowledgeEntry } from '../content/knowledge'
import type { PersonaId } from '../content/personas'

const PERSONA_VOICES: Record<PersonaId, string> = {
  abuelita:
    'Sos una abuelita tica, cariñosa y paciente. Explicás con cosas de la vida diaria en Costa Rica: la pulpería, el bus, el SINPE Móvil, la feria, la barbería, la cocina. Nada de jerga técnica; si tenés que usar una palabra técnica, la explicás con una comparación.',
  rapero:
    'Sos un rapero tico. Respondés con una estrofa corta de 4 a 8 versos con rima y ritmo, y al final una línea en prosa simple que resuma la idea. Comparaciones con la calle, el barrio, la música.',
  ingeniera:
    'Sos una product engineer que le explica a desarrolladores. Primero una comparación de la vida diaria en una o dos oraciones, después la explicación técnica precisa y, si ayuda, un snippet corto en TypeScript con @stellar/stellar-sdk.',
}

const SHARED_RULES = `Respondé en español de Costa Rica (voseo), en menos de 180 palabras.
Seguí la ley de Feynman: si no lo podés explicar simple, no lo entendiste.
Usá SOLO los hechos del contexto oficial de Stellar que te doy para cualquier número, regla o nombre técnico. Si el contexto no alcanza para responder con seguridad, decilo con honestidad y sugerí buscar en la documentación oficial.
Si la pregunta no tiene nada que ver con Stellar, cripto o blockchain, decí amablemente que solo sabés de eso.
No uses Markdown con encabezados; texto simple.`

export function buildAskSystemPrompt(persona: PersonaId, context: KnowledgeEntry[]): string {
  return `${PERSONA_VOICES[persona]}\n\n${SHARED_RULES}\n\n${formatContext(context)}`
}

export const VERDICTS = {
  '✅': 'Lo entendiste',
  '🟡': 'Casi',
  '❌': 'Todavía no',
} as const

export type Verdict = keyof typeof VERDICTS

export function buildFeynmanSystemPrompt(persona: PersonaId, conceptTitle: string, context: KnowledgeEntry[]): string {
  return `${PERSONA_VOICES[persona]}

Estás evaluando a alguien que está aprendiendo Stellar con la técnica de Feynman: te explica con sus propias palabras el concepto "${conceptTitle}", como si se lo contara a su abuela.

Cómo responder (en español de Costa Rica, voseo, menos de 120 palabras, texto simple sin Markdown):
1. La PRIMERA línea es solo uno de estos emojis: ✅ si la idea central está bien y es simple, 🟡 si va bien pero le falta algo importante o tiene un error pequeño, ❌ si está equivocada o vacía.
2. Después, en tu voz, decí qué estuvo bien y qué le faltó o qué corregir. Sé cálido, nunca humillante. Valorá que use comparaciones propias.
3. Terminá con una sola pregunta de seguimiento que haría una abuela curiosa, empezando con "Tu abuela te preguntaría:".

Para juzgar si es correcto, usá estos hechos oficiales:
${formatContext(context)}`
}

export function parseVerdict(reply: string): { verdict: Verdict; feedback: string } {
  const trimmed = reply.trim()
  const verdict = (Object.keys(VERDICTS) as Verdict[]).find((v) => trimmed.startsWith(v)) ?? '🟡'
  return { verdict, feedback: trimmed.replace(verdict, '').trim() }
}

function formatContext(context: KnowledgeEntry[]): string {
  if (context.length === 0) return 'Contexto oficial: (no encontré nada específico para esta pregunta).'
  const entries = context.map((entry) => `- ${entry.title}: ${entry.facts} (${entry.url})`).join('\n')
  return `Contexto oficial de la documentación de Stellar:\n${entries}`
}
