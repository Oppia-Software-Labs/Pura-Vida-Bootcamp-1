import { useEffect, useRef } from 'react'
import { ExternalLink, ShieldCheck } from 'lucide-react'
import type { WalletConnection } from '../hooks/useWallet'
import { paymentVisualStage } from '../experience/paymentCinema'
import { transactionUrl } from '../stellar/payment'

export function PaymentVerification({ wallet, opening, onReview }: { wallet: WalletConnection; opening: boolean; onReview: () => void }) {
  const heading = useRef<HTMLHeadingElement>(null)
  useEffect(() => { heading.current?.focus({ preventScroll: true }) }, [])
  const payment = wallet.payment
  const stage = paymentVisualStage(payment)
  const titles = { inactive: 'Preparando el sello.', authorized: 'Autorización recibida.', pending: 'Stellar tiene la llave.', uncertain: 'Buscando la confirmación.', failed: 'La bóveda sigue sellada.', verified: opening ? 'El umbral se abre.' : 'Stellar verificó tu operación.' }
  const descriptions = { inactive: '', authorized: 'Firma validada. Enviando a Testnet.', pending: 'Operación recibida por la red. Esperando el resultado.', uncertain: 'Aún no hay un resultado verificado. Conservamos la misma operación.', failed: 'La operación no se completó. Tus otros sellos se conservan.', verified: opening ? 'Tu artefacto emerge de la cámara Génesis.' : 'Tres sellos verificados. Liberando los cerrojos.' }
  return <section className={`verification-interface verification-${stage}`} aria-labelledby="verification-heading" data-verification-stage={opening ? 'opening' : stage}>
    <p className="eyebrow">Stellar Testnet</p>
    <div role="status" aria-live="polite" aria-atomic="true"><h1 ref={heading} id="verification-heading" tabIndex={-1}>{titles[stage]}</h1><p className="verification-description">{descriptions[stage]}</p></div>
    {payment.receipt && <p className="verification-ledger"><ShieldCheck size={17} aria-hidden="true" />Verificada · Ledger {payment.receipt.ledger.toLocaleString('es-CR')}</p>}
    {payment.hash && <div className="verification-proof"><span>Transacción</span><code>{payment.hash}</code><a className="wallet-link" href={transactionUrl(payment.hash)} target="_blank" rel="noopener noreferrer">Ver en Stellar Expert <ExternalLink size={14} aria-hidden="true" /></a></div>}
    {!payment.receipt && <p className="verification-telemetry">{payment.submissionStatus ? `Envío RPC: ${payment.submissionStatus}` : payment.authorized ? 'Envío sin respuesta RPC' : 'Consultando una operación anterior'}{payment.lookupStatus && ` · Consulta: ${payment.lookupStatus}`}</p>}
    {stage === 'uncertain' && payment.status === 'uncertain' && <button className="primary-button" onClick={() => void wallet.checkPayment()}>Consultar la misma operación</button>}
    {stage === 'failed' && <button className="primary-button" onClick={onReview}>Volver a la operación</button>}
    {payment.issue === 'history' && <p className="wallet-message" role="alert">Fuera del historial del RPC. Revisa el explorador antes de repetir.</p>}
    <p className="proof-local-note">{payment.receipt ? 'Confirmación comprobada en este navegador.' : 'La puerta permanece cerrada hasta verificar el resultado.'}</p>
  </section>
}
