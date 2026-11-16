import type { ReactNode } from 'react'

type SectionProps = {
  id: string
  emoji: string
  title: string
  children: ReactNode
}

export function Section({ id, emoji, title, children }: SectionProps) {
  return (
    <section id={id} className="mt-10 scroll-mt-8 rounded-3xl bg-white/70 p-6 shadow-sm ring-1 ring-cafe/10 sm:p-8">
      <h2 className="font-display text-3xl font-bold">
        <span aria-hidden>{emoji}</span> {title}
      </h2>
      <div className="mt-3">{children}</div>
    </section>
  )
}
