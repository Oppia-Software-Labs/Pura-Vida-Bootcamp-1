import { useState } from 'react'
import { Hero } from './components/Hero'
import { Section } from './components/Section'
import { StoriesSection } from './components/StoriesSection'
import { WalletSection } from './components/WalletSection'
import type { PersonaId } from './content/personas'
import { useWallet } from './hooks/useWallet'

function App() {
  const wallet = useWallet()
  const [persona, setPersona] = useState<PersonaId>('abuelita')
  return (
    <main className="mx-auto max-w-5xl px-4 pb-24">
      <Hero />
      <WalletSection wallet={wallet} />
      <StoriesSection wallet={wallet} persona={persona} onPersonaChange={setPersona} />
      <Section id="preguntar" emoji="💬" title="Preguntale a la abuelita">
        Pronto: hacé cualquier pregunta y te la explican en palabras simples.
      </Section>
    </main>
  )
}

export default App
