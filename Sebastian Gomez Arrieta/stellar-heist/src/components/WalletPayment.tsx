import { useEffect, useState } from 'react'
import { ArrowRight, ExternalLink, Send } from 'lucide-react'
import type { WalletConnection } from '../hooks/useWallet'
import type { PaymentIssue } from '../stellar/payment'
import { transactionUrl } from '../stellar/payment'
import { stroopsToXlm } from '../stellar/walletSession'

const messages: Record<PaymentIssue, string> = {
  session: 'Vuelve a completar Identidad y Firma.', inactive: 'Activa tu cuenta en Testnet antes de continuar.',
  funds: 'Necesitas más XLM de prueba, además de la reserva de tu cuenta.', fee: 'La comisión de la red supera el límite. Inténtalo más tarde.',
  network: 'Cambia tu wallet a Testnet.', rpc: 'No pudimos consultar Testnet. Vuelve a intentarlo.',
  expired: 'La operación venció. Puedes preparar otra.', signature: 'La firma no corresponde a esta cuenta.', modified: 'Los datos de la operación no coinciden. No se verificó el sello.',
  failed: 'La red no confirmó una operación válida. Revisa su estado.', uncertain: 'Aún no hay confirmación. Consulta esta misma operación antes de repetirla.',
  storage: 'No pudimos guardar el seguimiento. Revisa el almacenamiento de esta pestaña.', history: 'La operación quedó fuera del historial disponible. Revísala en el explorador.',
  rejected: 'No autorizaste la operación. Puedes reintentarlo.', locked: 'Desbloquea Varial y vuelve a intentarlo.', timeout: 'La respuesta tardó demasiado. Revisa el estado antes de repetir.',
}
export function WalletPayment({ wallet, onReveal }: { wallet: WalletConnection; onReveal: () => void }) {
  const [approvedHash, setApprovedHash] = useState<string | null>(null)
  const { cancelPayment } = wallet
  useEffect(() => () => cancelPayment(), [cancelPayment])
  const { status, draft, hash, receipt, issue } = wallet.payment
  const busy = ['preparing', 'signing', 'submitting', 'confirming'].includes(status)
  return <div className="wallet-payment">
    {status === 'review' && draft && <>
      <p className="payment-amount">0,1 XLM <span>a tu propia cuenta</span></p>
      <details className="wallet-full-address"><summary>Ver destino</summary><p>{draft.destination}</p></details>
      <p className="payment-fee">Comisión máxima: {stroopsToXlm(BigInt(draft.fee))} XLM</p>
      <label className="payment-approval"><input type="checkbox" checked={approvedHash === draft.hash} onChange={event => setApprovedHash(event.target.checked ? draft.hash : null)} /><span>He revisado el destino y la comisión.</span></label>
      <button className="primary-button" disabled={approvedHash !== draft.hash || !wallet.proof} onClick={() => void wallet.submitPayment(draft.hash)}><Send size={17} aria-hidden="true" />Autorizar en Varial</button>
      <button className="text-button proof-cancel" onClick={cancelPayment}>Cancelar operación</button>
    </>}
    {busy && <p className="wallet-balance" role="status">{status === 'preparing' ? 'Preparando la operación…' : status === 'signing' ? 'Confirma en Varial…' : status === 'submitting' ? 'Enviando a Testnet…' : 'Esperando confirmación…'}</p>}
    {status === 'signing' && <button className="text-button" onClick={cancelPayment}>Cancelar antes del envío</button>}
    {status === 'uncertain' && <button className="primary-button" onClick={() => void wallet.checkPayment()}>Consultar estado</button>}
    {(status === 'idle' || status === 'failed') && <button className="primary-button" disabled={!wallet.proof} onClick={() => void wallet.preparePayment()}><Send size={17} aria-hidden="true" />Revisar operación</button>}
    {receipt && <button className="primary-button" onClick={onReveal}>Abrir la bóveda <ArrowRight size={17} aria-hidden="true" /></button>}
    {issue && <p className="wallet-message" role="alert">{messages[issue]}</p>}
    {issue === 'inactive' || issue === 'funds' ? <a className="wallet-link" href="https://lab.stellar.org/account/fund" target="_blank" rel="noopener noreferrer">Obtener XLM de prueba <ExternalLink size={14} aria-hidden="true" /></a> : null}
    {hash && <details className="wallet-full-address"><summary>{receipt ? 'Transacción confirmada' : 'Ver seguimiento'}</summary><p>{hash}</p><a className="wallet-link" href={transactionUrl(hash)} target="_blank" rel="noopener noreferrer">Ver en Stellar Expert <ExternalLink size={14} aria-hidden="true" /></a></details>}
    <p className="proof-local-note">{receipt ? `Comisión: ${stroopsToXlm(BigInt(receipt.fee))} XLM · Testnet` : 'Los 0,1 XLM vuelven a tu cuenta. Solo pagas la comisión de prueba.'}</p>
  </div>
}
