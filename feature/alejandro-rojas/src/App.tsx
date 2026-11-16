import AccountPanel from './components/AccountPanel.tsx'
import ConnectButton from './components/ConnectButton.tsx'
import { useLobstrWallet } from './hooks/useLobstrWallet.ts'
import './App.css'

function App() {
  const wallet = useLobstrWallet()

  return (
    <>
      <nav className="navbar">
        <span className="logo">Pura Vida</span>
        <span className="nav-note">TESTNET</span>
      </nav>
      <header className="header">
        <div className="header-content">
          <p className="above-heading">STELLAR WALLET</p>
          <h1>Tu cuenta en testnet</h1>
          {wallet.publicKey ? (
            <p className="p-large">Lobstr está conectado. Estos datos salen de Horizon.</p>
          ) : (
            <>
              <p className="p-large">Conecta tu wallet de Lobstr. El balance se lee en testnet.</p>
              <ConnectButton onConnect={wallet.connect} />
              {wallet.error && <p className="form-error">{wallet.error}</p>}
            </>
          )}
        </div>
        <svg className="header-frame" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" viewBox="0 0 1920 310">
          <path fill="#5f4dee" d="M0,283.054c22.75,12.98,53.1,15.2,70.635,14.808,92.115-2.077,238.3-79.9,354.895-79.938,59.97-.019,106.17,18.059,141.58,34,47.778,21.511,47.778,21.511,90,38.938,28.418,11.731,85.344,26.169,152.992,17.971,68.127-8.255,115.933-34.963,166.492-67.393,37.467-24.032,148.6-112.008,171.753-127.963,27.951-19.26,87.771-81.155,180.71-89.341,72.016-6.343,105.479,12.388,157.434,35.467,69.73,30.976,168.93,92.28,256.514,89.405,100.992-3.315,140.276-41.7,177-64.9V0.24H0V283.054Z" />
        </svg>
      </header>
      {wallet.publicKey && (
        <main className="account">
          <AccountPanel
            publicKey={wallet.publicKey}
            funds={wallet.funds}
            entries={wallet.entries}
            error={wallet.error}
            needsFunding={wallet.needsFunding}
            saving={wallet.saving}
            hasMessage={wallet.hasMessage}
            onFund={wallet.fund}
            onSaveMessage={wallet.saveMessage}
            onLogout={wallet.logout}
          />
        </main>
      )}
    </>
  )
}

export default App
