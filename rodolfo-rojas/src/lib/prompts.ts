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

function formatContext(context: KnowledgeEntry[]): string {
  if (context.length === 0) return 'Contexto oficial: (no encontré nada específico para esta pregunta).'
  const entries = context.map((entry) => `- ${entry.title}: ${entry.facts} (${entry.url})`).join('\n')
  return `Contexto oficial de la documentación de Stellar:\n${entries}`
}
