import { useState } from 'react'
import { getPublicKey, isConnected } from '@lobstrco/signer-extension-api'
import './App.css'

function App() {
  const [publicKey, setPublicKey] = useState('')
  const [error, setError] = useState('')

  async function connectWallet() {
    setError('')

    try {
      const installed = await isConnected()
      if (!installed) {
        setError('Instala la extensión LOBSTR signer en Chrome y vuelve a intentar.')
        return
      }

      const key = await getPublicKey()
      setPublicKey(key)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo conectar la wallet.')
    }
  }

  return (
    <section id="center">
      <h1>Pura Vida</h1>
      <p>Conecta tu wallet de Lobstr.</p>
      <button type="button" className="counter" onClick={connectWallet}>
        Conectar wallet
      </button>
      {publicKey && <p>Dirección: {publicKey}</p>}
      {error && <p>{error}</p>}
    </section>
  )
}

export default App