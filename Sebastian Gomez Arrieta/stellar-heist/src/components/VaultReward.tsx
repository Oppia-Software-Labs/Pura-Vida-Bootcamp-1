import { useEffect, useRef, useState } from 'react'
import { motion } from 'motion/react'
import { Download, ExternalLink } from 'lucide-react'
import type { VerifiedPayment } from '../stellar/payment'
import { transactionUrl } from '../stellar/payment'

export function VaultReward({ receipt, opened }: { receipt: VerifiedPayment; opened: boolean }) {
  const [exporting, setExporting] = useState(false)
  const [failed, setFailed] = useState(false)
  const heading = useRef<HTMLHeadingElement>(null)
  useEffect(() => { if (opened) heading.current?.focus({ preventScroll: true }) }, [opened])
  async function download() {
    setExporting(true); setFailed(false)
    try { await (await import('../experience/rewardCard')).downloadRewardCard(receipt) }
    catch { setFailed(true) }
    finally { setExporting(false) }
  }
  return <motion.section className="mission-interface vault-reward" aria-labelledby="reward-heading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.6 }}>
    <p className="eyebrow">The Genesis Vault</p>
    <h1 ref={heading} id="reward-heading" tabIndex={-1}>{opened ? 'Génesis es tuyo.' : 'La bóveda responde.'}</h1>
    <p className="mission-description" role="status">{opened ? 'Tres sellos. Una huella en Stellar.' : 'Operación confirmada. Revelando tu artefacto…'}</p>
    <p className="mission-status is-complete"><span aria-hidden="true" />3 de 3 · Testnet</p>
    <button className="primary-button" disabled={!opened || exporting} onClick={() => void download()}><Download size={17} aria-hidden="true" />{exporting ? 'Creando tarjeta…' : 'Descargar logro'}</button>
    {failed && <p className="wallet-message" role="alert">No pudimos crear la tarjeta. Puedes reintentarlo.</p>}
    <a className="wallet-link" href={transactionUrl(receipt.transactionHash)} target="_blank" rel="noopener noreferrer">Ver transacción <ExternalLink size={14} aria-hidden="true" /></a>
    <details className="wallet-full-address"><summary>Ver hash</summary><p>{receipt.transactionHash}</p></details>
    <p className="proof-local-note">Artefacto derivado de tu transacción. Logro educativo sin valor monetario.</p>
  </motion.section>
}
