import { useState } from 'react'
import { AskSection } from './components/AskSection'
import { ConceptsSection } from './components/ConceptsSection'
import { NavBar } from './components/NavBar'
import { PracticeSection } from './components/PracticeSection'
import { RoleSection } from './components/RoleSection'
import { WalletSection } from './components/WalletSection'
import { CONCEPTS } from './content/concepts'
import type { PersonaId } from './content/personas'
import { useActiveSection } from './hooks/useActiveSection'
import { useClaudeKey } from './hooks/useClaudeKey'
import { useFirstPayment } from './hooks/useFirstPayment'
import { useTokenLab } from './hooks/useTokenLab'
import { useWallet } from './hooks/useWallet'

const CONCEPT_IDS = CONCEPTS.map((concept) => concept.id)

function App() {
  const wallet = useWallet()
  const claude = useClaudeKey()
  const payment = useFirstPayment(wallet)
  const lab = useTokenLab(wallet)
  const [persona, setPersona] = useState<PersonaId | null>(null)
  const tutorialReady = Boolean(persona && wallet.address)
  const activeConcept = useActiveSection(CONCEPT_IDS, tutorialReady)

  const chooseFirstRole = (id: PersonaId) => {
    const isFirstChoice = persona === null
    setPersona(id)
    if (isFirstChoice) scrollToSoon('wallet')
  }

  const connect = async () => {
    await wallet.connect()
    scrollToSoon('conceptos')
  }

  return (
    <main className="bg-papel">
      <RoleSection selected={persona} onSelect={chooseFirstRole} />
      {persona && <WalletSection wallet={{ ...wallet, connect }} persona={persona} />}
      {persona && wallet.address && (
        <>
          <NavBar persona={persona} onPersonaChange={setPersona} wallet={wallet} activeConcept={activeConcept} />
          <ConceptsSection persona={persona} />
          <PracticeSection
            persona={persona}
            payment={payment}
            lab={lab}
            funded={wallet.account?.status === 'funded'}
          />
          <AskSection key={persona} claude={claude} persona={persona} />
          <footer className="eyebrow border-t-2 border-navy px-4 py-7 text-center text-tinta">
            Hecho por Rodolfo Rojas · Pura Vida Bootcamp · Testnet únicamente
          </footer>
        </>
      )}
    </main>
  )
}

function scrollToSoon(id: string) {
  requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ block: 'start' }))
}

export default App
