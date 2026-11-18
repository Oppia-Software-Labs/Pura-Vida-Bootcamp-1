import { useState } from 'react'
import { connectVarialWallet } from '../stellar/varial'

type WalletSectionProps = {
  address: string | null
  onConnected: (address: string) => void
}

const connectionMessages = {
  'extension-missing':
    'Instalá o habilitá Varial en este navegador y volvé a intentar.',
  'detection-error':
    'No se pudo comprobar si Varial está disponible. Volvé a intentar.',
  'access-error':
    'No se pudo obtener acceso a tu cuenta. Abrí Varial y volvé a intentar.',
}

function WalletIcon() {
  return (
    <svg
      aria-hidden="true"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 8V6a2 2 0 0 0-2-2H6a3 3 0 0 0 0 6h14a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H6a3 3 0 0 1-3-3V7" />
      <path d="M22 13h-5a2 2 0 0 0 0 4h5" />
    </svg>
  )
}

export function WalletSection({ address, onConnected }: WalletSectionProps) {
  const [isConnecting, setIsConnecting] = useState(false)
  const [message, setMessage] = useState('')

  async function handleConnect() {
    setIsConnecting(true)
    setMessage('')

    try {
      const result = await connectVarialWallet()

      if (result.status === 'connected') {
        onConnected(result.address)
        setMessage('Tu dirección pública ya aparece en la tarjeta.')
      } else {
        setMessage(connectionMessages[result.status])
      }
    } finally {
      setIsConnecting(false)
    }
  }

  let buttonLabel = 'Conectar wallet'

  if (isConnecting) {
    buttonLabel = 'Conectando…'
  } else if (address) {
    buttonLabel = 'Wallet conectada'
  }

  return (
    <section className="wallet" aria-labelledby="wallet-title">
      <h3 id="wallet-title">Wallet de Stellar</h3>
      <p>Conectá Varial para agregar tu dirección pública a la tarjeta.</p>

      <button
        className="wallet-button"
        type="button"
        onClick={handleConnect}
        disabled={isConnecting || address !== null}
      >
        <WalletIcon />
        {buttonLabel}
      </button>

      <p className="wallet-note" role="status">
        {message}
      </p>
    </section>
  )
}