import { useState } from 'react'
import { ActivitySection } from './components/ActivitySection'
import { BalanceCard } from './components/BalanceCard'
import { GoalsSection } from './components/GoalsSection'
import { LanguageSwitch } from './components/LanguageSwitch'
import { OrbitGraphic } from './components/OrbitMark'
import { Sidebar } from './components/Sidebar'
import { WalletControl } from './components/WalletControl'
import { useLanguage } from './i18n/useLanguage'
import { useNativeBalance } from './wallet/useBalance'
import { useVarial } from './wallet/useVarial'
import './App.css'

function App() {
  const { t } = useLanguage()
  const { wallet, connect, disconnect } = useVarial()
  const balance = useNativeBalance(wallet)
  const [active, setActive] = useState('overview')

  function navigate(id) {
    setActive(id)
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="app">
      <Sidebar active={active} onNavigate={navigate} />
      <div className="workspace">
        <header className="topbar">
          <p className="network">
            <span className="network__mark" aria-hidden="true" />
            {t.network}
          </p>
          <div className="topbar__actions">
            <LanguageSwitch />
            <WalletControl wallet={wallet} onConnect={connect} onDisconnect={disconnect} />
          </div>
        </header>
        <div className="stage">
          <section className="editorial" id="overview" aria-labelledby="headline">
            <h1 id="headline">
              {t.headlineLines.map((line) => (
                <span className="headline__line" key={line}>
                  {line}
                </span>
              ))}
              <span className="headline__line">
                <span className="headline__mark">
                  <span>{t.headlineMark}</span>
                </span>
              </span>
            </h1>
            <p className="lede">{t.lede}</p>
            <OrbitGraphic className="orbit" />
          </section>
          <div className="dossier">
            <BalanceCard wallet={wallet} balance={balance} />
            <GoalsSection />
          </div>
        </div>
        <ActivitySection />
      </div>
    </div>
  )
}

export default App
