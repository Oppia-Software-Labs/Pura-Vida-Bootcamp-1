import { useState } from 'react'
import logoBuzon from './assets/logo-buzon.png'
import { TipJarEditor } from './components/TipJarEditor'
import { TipJarPreview } from './components/TipJarPreview'
import { useTipJarDraft } from './hooks/useTipJarDraft'
import './App.css'

function App() {
  const { draft, setDraft } = useTipJarDraft()
  const [address, setAddress] = useState<string | null>(null)

  return (
    <>
      <header className="site-header">
        <div className="site-header__inner">
          <img src={logoBuzon} alt="" width="44" height="44" />
          <span>Buzón de propinas Stellar</span>
        </div>
      </header>

      <main className="page">
        <div className="intro">
          <h1>Creá tu buzón de propinas</h1>
          <p>Personalizá una tarjeta para compartir tu dirección de Stellar.</p>
        </div>

        <div className="workspace">
          <TipJarEditor
            draft={draft}
            onDraftChange={setDraft}
            address={address}
            onWalletConnected={setAddress}
          />
          <TipJarPreview draft={draft} address={address} />
        </div>
      </main>
    </>
  )
}

export default App