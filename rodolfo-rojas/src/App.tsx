import { useState } from 'react'
import { AskSection } from './components/AskSection'
import { Hero } from './components/Hero'
import { StoriesSection } from './components/StoriesSection'
import { WalletSection } from './components/WalletSection'
import type { PersonaId } from './content/personas'
import { useAiSettings } from './hooks/useAiSettings'
import { useWallet } from './hooks/useWallet'

function App() {
  const wallet = useWallet()
  const ai = useAiSettings()
  const [persona, setPersona] = useState<PersonaId>('abuelita')
  return (
    <main className="mx-auto max-w-5xl px-4 pb-24">
      <Hero />
      <WalletSection wallet={wallet} />
      <StoriesSection wallet={wallet} ai={ai} persona={persona} onPersonaChange={setPersona} />
      <AskSection ai={ai} persona={persona} />
    </main>
  )
}

export default App
