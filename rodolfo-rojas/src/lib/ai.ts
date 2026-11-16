import Anthropic from '@anthropic-ai/sdk'

export type ProviderId = 'groq' | 'claude'

export type AiSettings = {
  provider: ProviderId
  apiKey: string
}

export const PROVIDERS: Record<ProviderId, { name: string; keyUrl: string; keyHint: string }> = {
  groq: { name: 'Groq (gratis)', keyUrl: 'https://console.groq.com/keys', keyHint: 'gsk_…' },
  claude: { name: 'Claude', keyUrl: 'https://console.anthropic.com/settings/keys', keyHint: 'sk-ant-…' },
}

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'
const GROQ_MODEL = 'llama-3.3-70b-versatile'
const CLAUDE_MODEL = 'claude-opus-5-5'

export async function askAi(settings: AiSettings, system: string, userMessage: string): Promise<string> {
  if (!settings.apiKey.trim()) throw new Error('Primero pegá tu API key.')
  if (settings.provider === 'claude') return askClaude(settings.apiKey, system, userMessage)
  return askGroq(settings.apiKey, system, userMessage)
}

async function askClaude(apiKey: string, system: string, userMessage: string): Promise<string> {
  // The key belongs to the person using the app and never leaves their browser except to Anthropic.
  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true })
  try {
    const response = await client.beta.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 16000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: { effort: 'low' },
      system,
      messages: [{ role: 'user', content: userMessage }],
    })
    if (response.stop_reason === 'refusal') throw new Error('Claude prefirió no responder esa pregunta.')
    return response.content.flatMap((block) => (block.type === 'text' ? [block.text] : [])).join('\n')
  } catch (error) {
    throw new Error(claudeErrorMessage(error))
  }
}

function claudeErrorMessage(error: unknown): string {
  if (error instanceof Anthropic.AuthenticationError) return 'Esa API key de Claude no funciona. Revisala.'
  if (error instanceof Anthropic.RateLimitError) return 'Claude está saturado. Esperá un momento y probá de nuevo.'
  if (error instanceof Anthropic.APIError) return `Claude respondió con un error (${error.status}).`
  if (error instanceof Error) return error.message
  return 'No pude hablar con Claude.'
}

async function askGroq(apiKey: string, system: string, userMessage: string): Promise<string> {
  const response = await fetch(GROQ_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: GROQ_MODEL,
      temperature: 0.6,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: userMessage },
      ],
    }),
  })
  if (response.status === 401) throw new Error('Esa API key de Groq no funciona. Revisala.')
  if (response.status === 429) throw new Error('Groq está saturado. Esperá un momento y probá de nuevo.')
  if (!response.ok) throw new Error(`Groq respondió con un error (${response.status}).`)
  const data = (await response.json()) as { choices: { message: { content: string } }[] }
  return data.choices[0]?.message.content ?? ''
}
