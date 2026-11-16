import AccountPanel from './components/AccountPanel.tsx'
import ConnectButton from './components/ConnectButton.tsx'
import { useLobstrWallet } from './hooks/useLobstrWallet.ts'
import './App.css'

function App() {
  const wallet = useLobstrWallet()

  return (
    <section id="center">
      <h1>Pura Vida</h1>
      {wallet.publicKey ? (
        <AccountPanel
          publicKey={wallet.publicKey}
          funds={wallet.funds}
          error={wallet.error}
          needsFunding={wallet.needsFunding}
          onFund={wallet.fund}
        />
      ) : (
        <>
          <p>Conecta tu wallet de Lobstr. El balance se lee en testnet.</p>
          <ConnectButton onConnect={wallet.connect} />
          {wallet.error && <p>{wallet.error}</p>}
        </>
      )}
    </section>
  )
}

export default App
