import Anthropic from '@anthropic-ai/sdk'

const CLAUDE_MODEL = 'claude-opus-5-5'

export async function askClaude(apiKey: string, system: string, userMessage: string): Promise<string> {
  if (!apiKey.trim()) throw new Error('Primero pegá tu llave de Claude.')
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
  if (error instanceof Anthropic.AuthenticationError) return 'Esa llave de Claude no funciona. Revisala.'
  if (error instanceof Anthropic.RateLimitError) return 'Claude está saturado. Esperá un momento y probá de nuevo.'
  if (error instanceof Anthropic.APIError) return `Claude respondió con un error (${error.status}).`
  if (error instanceof Error) return error.message
  return 'No pude hablar con Claude.'
}
