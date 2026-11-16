import { CONCEPTS, type Concept } from '../content/concepts'
import type { PersonaId } from '../content/personas'
import { SCENES } from '../content/scenes'
import { PixelArt } from './PixelArt'
import { SpeechBubble } from './SpeechBubble'
import { ExternalLink, Eyebrow } from './ui'

export function ConceptsSection({ persona }: { persona: PersonaId }) {
  return (
    <>
      <section id="conceptos" className="mx-auto flex max-w-3xl flex-col items-center gap-3 px-4 pt-24 pb-8 text-center sm:px-6">
        <Eyebrow>Tu ruta</Eyebrow>
        <h2 className="font-pixel text-4xl leading-tight sm:text-5xl">8 cosas que deberías saber</h2>
      </section>
      {CONCEPTS.map((concept, index) => (
        <ConceptBlock key={concept.id} concept={concept} index={index} persona={persona} />
      ))}
    </>
  )
}

type ConceptBlockProps = {
  concept: Concept
  index: number
  persona: PersonaId
}

function ConceptBlock({ concept, index, persona }: ConceptBlockProps) {
  const next = CONCEPTS[index + 1]
  return (
    <article
      id={concept.id}
      aria-labelledby={`${concept.id}-titulo`}
      className="mx-auto flex max-w-3xl flex-col items-center gap-6 border-t-2 border-navy px-4 py-18 text-center sm:px-6"
    >
      <div className="flex flex-col items-center gap-1.5">
        <span aria-hidden className="font-pixel text-7xl leading-none text-azul">
          {String(index + 1).padStart(2, '0')}
        </span>
        <span className="eyebrow text-tinta">
          Concepto {index + 1} de {CONCEPTS.length}
        </span>
        <h3 id={`${concept.id}-titulo`} className="mt-1 font-pixel text-4xl leading-tight">
          {concept.title}
        </h3>
      </div>
      <PixelArt
        grid={SCENES[persona][concept.id]}
        size={288}
        label={concept.sceneAlt[persona]}
        className="border-2 border-navy shadow-hard"
      />
      <SpeechBubble persona={persona}>{concept.stories[persona]}</SpeechBubble>
      {persona === 'dev' && (
        <pre className="w-full overflow-x-auto bg-navy px-5 py-4 text-left font-mono text-sm leading-normal text-niebla">
          <code>{concept.code}</code>
        </pre>
      )}
      <p className="text-sm">
        <ExternalLink href={concept.docs.url}>Documentación oficial: {concept.docs.label}</ExternalLink>
      </p>
      <a href={next ? `#${next.id}` : '#practica'} className="eyebrow flex min-h-11 items-center text-tinta hover:text-azul">
        ↓ Siguiente: {next ? next.title : 'Práctica'}
      </a>
    </article>
  )
}
