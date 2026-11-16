import type { ReactNode } from 'react'
import { personaById, type PersonaId } from '../content/personas'
import { AVATAR_GRIDS } from '../content/scenes'
import { PixelArt } from './PixelArt'

export function SpeechBubble({ persona, children }: { persona: PersonaId; children: ReactNode }) {
  return (
    <figure className="flex w-full items-start gap-4 text-left">
      <PixelArt grid={AVATAR_GRIDS[persona]} size={64} className="border-2 border-navy" />
      <blockquote className="min-w-0 flex-1 border-2 border-navy bg-white px-5 py-4 shadow-hard-sm">
        <figcaption className="eyebrow mb-1.5 text-tinta">{personaById(persona).name}</figcaption>
        <div className="whitespace-pre-line text-lg leading-relaxed">{children}</div>
      </blockquote>
    </figure>
  )
}
