import { useEffect, useState } from 'react'
import { Check, Copy, ExternalLink, LogOut, RefreshCw } from 'lucide-react'
import type { WalletConnection } from '../hooks/useWallet'
import { walletMessages } from '../stellar/walletSession'

export function WalletIdentity({ wallet }: { wallet: WalletConnection }) {
  const [copied, setCopied] = useState(false)
  const [copyError, setCopyError] = useState(false)
  useEffect(() => {
    if (!copied) return
    const timer = setTimeout(() => setCopied(false), 1800)
    return () => clearTimeout(timer)
  }, [copied])
  async function copy() {
    if (!wallet.address) return
    try { await navigator.clipboard.writeText(wallet.address); setCopied(true); setCopyError(false) }
    catch { setCopyError(true) }
  }
  return <div className="wallet-identity">
    {!wallet.identity && <button className="primary-button" onClick={() => void wallet.connect()} disabled={wallet.status === 'connecting'}>{wallet.status === 'connecting' ? 'Autoriza en Varial…' : 'Conectar wallet'}</button>}
    {wallet.issue && <p className="wallet-message" role="alert">{walletMessages[wallet.issue]}</p>}
    {wallet.issue === 'missing' && <a className="wallet-link" href="https://varialwallet.com" target="_blank" rel="noopener noreferrer">Instalar Varial <ExternalLink size={14} aria-hidden="true" /></a>}
    {wallet.identity && wallet.address && <>
      <div className="wallet-account"><button className="wallet-address" onClick={() => void copy()} aria-label="Copiar dirección pública" title={wallet.address}><span>{wallet.address.slice(0, 7)}…{wallet.address.slice(-7)}</span>{copied ? <Check size={15} aria-hidden="true" /> : <Copy size={15} aria-hidden="true" />}</button><span className="wallet-network">Testnet</span></div>
      <p className="wallet-balance" aria-live="polite">{wallet.balanceStatus === 'loading' ? 'Consultando saldo…' : wallet.balanceStatus === 'inactive' ? 'Cuenta aún no activada en Testnet.' : wallet.balanceStatus === 'error' ? 'No pudimos consultar el saldo.' : wallet.balance !== null ? `${wallet.balance} XLM${wallet.balanceStatus === 'empty' ? ' · Sin saldo' : ''}` : ''}</p>
      {(wallet.balanceStatus === 'inactive' || wallet.balanceStatus === 'empty') && <a className="wallet-link" href="https://lab.stellar.org/account/fund" target="_blank" rel="noopener noreferrer">Obtener XLM de prueba en Stellar Lab <ExternalLink size={14} aria-hidden="true" /></a>}
      <div className="wallet-actions"><button onClick={() => void wallet.refreshBalance()} disabled={wallet.balanceStatus === 'loading'}><RefreshCw size={14} aria-hidden="true" /> Actualizar saldo</button><button onClick={wallet.disconnect}><LogOut size={14} aria-hidden="true" /> Desconectar</button></div>
    </>}
    {wallet.status === 'connecting' && <button className="text-button" onClick={wallet.disconnect}>Cancelar conexión local</button>}
    <p className="wallet-copy-feedback" role="status">{copyError ? 'No se pudo copiar. Selecciona la dirección para copiarla.' : copied ? 'Dirección copiada.' : ''}</p>
    {wallet.address && <details className="wallet-full-address"><summary>Ver dirección completa</summary><p>{wallet.address}</p></details>}
  </div>
}
