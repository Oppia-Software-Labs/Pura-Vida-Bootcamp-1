import { useEffect } from 'react'
import { Check, ScanLine } from 'lucide-react'
import type { WalletConnection } from '../hooks/useWallet'
import type { ProofIssue } from '../stellar/messageProof'
import { walletMessages } from '../stellar/walletSession'
import type { WalletIssue } from '../stellar/walletSession'

const messages: Record<ProofIssue | WalletIssue, string> = {
  ...walletMessages,
  rejected: 'No autorizaste la firma. Puedes reintentarlo.',
  invalid: 'La firma no es válida. Vuelve a intentarlo.',
  account: 'La firma corresponde a otra cuenta.',
  expired: 'El mensaje venció. Solicita una nueva firma.',
  replayed: 'Este mensaje ya se utilizó. Solicita uno nuevo.',
  challenge: 'El mensaje no corresponde a este intento.',
  origin: 'El mensaje no corresponde a este sitio.',
  cancelled: 'Firma cancelada aquí. Puedes volver a intentarlo.',
}
export function WalletProof({ wallet }: { wallet: WalletConnection }) {
  const { cancelProof } = wallet
  useEffect(() => () => cancelProof(), [cancelProof])
  const busy = wallet.proofStatus === 'requesting' || wallet.proofStatus === 'verifying'
  return <div className="wallet-proof">
    <button className="primary-button" disabled={!wallet.identity || busy || wallet.proof} onClick={() => void wallet.signProof(window.location.origin)}>
      {wallet.proof ? <Check size={18} aria-hidden="true" /> : <ScanLine size={18} aria-hidden="true" />}
      {wallet.proof ? 'Firma verificada' : wallet.proofStatus === 'requesting' ? 'Confirma en Varial…' : wallet.proofStatus === 'verifying' ? 'Verificando firma…' : 'Firmar mensaje'}
    </button>
    {busy && <button className="text-button proof-cancel" onClick={cancelProof}>Cancelar firma</button>}
    {wallet.proofIssue && <p className="wallet-message" role="alert">{messages[wallet.proofIssue]}</p>}
    <p className="proof-local-note">Prueba local en este navegador.</p>
  </div>
}
