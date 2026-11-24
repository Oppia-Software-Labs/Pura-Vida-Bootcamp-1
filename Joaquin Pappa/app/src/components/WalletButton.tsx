import { useState } from 'react'
import { connectWallet } from '../lib/wallet'

export function WalletButton({ address, onConnect }: { address?: string; onConnect: (a: string) => void }) {
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  if (address) return <span className="wallet-chip">{address.slice(0, 4)}…{address.slice(-4)}</span>
  return (
    <div className="wallet">
      <button className="btn-red" aria-busy={busy} disabled={busy} onClick={async () => { setErr(''); setBusy(true); try { onConnect(await connectWallet()) } catch (e) { setErr(String((e as Error).message)) } finally { setBusy(false) } }}>
        {busy ? 'Conectando…' : 'Conectar wallet'}
      </button>
      {err && <small className="wallet-err">{err}</small>}
    </div>
  )
}
