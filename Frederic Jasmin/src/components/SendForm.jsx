import { useState } from 'react'
import { sendXlm, txExplorerUrl } from '../lib/stellar'
import { assertTestnet, shortAddress, signXdr } from '../lib/wallet'

export default function SendForm({ address, onSent }) {
  const [to, setTo] = useState('')
  const [amount, setAmount] = useState('')
  const [memo, setMemo] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [hash, setHash] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setSending(true)
    setError('')
    setHash('')
    try {
      await assertTestnet()
      const txHash = await sendXlm({
        from: address,
        to: to.trim(),
        amount,
        memo: memo.trim(),
        sign: (xdr) => signXdr(xdr, address),
      })
      setHash(txHash)
      setAmount('')
      setMemo('')
      onSent?.()
    } catch (err) {
      const msg = err?.message || ''
      setError(/reject|declin|denied|cancel/i.test(msg) ? 'Cancelaste la firma en tu wallet.' : msg || 'No se pudo enviar el pago.')
    } finally {
      setSending(false)
    }
  }

  return (
    <section className="card">
      <h2>Enviar XLM</h2>
      <form onSubmit={handleSubmit}>
        <label htmlFor="to">Dirección destino</label>
        <input id="to" value={to} onChange={(e) => setTo(e.target.value)} placeholder="G..." required />
        <label htmlFor="amount">Monto (XLM)</label>
        <input id="amount" type="number" min="0.0000001" step="0.0000001" value={amount}
          onChange={(e) => setAmount(e.target.value)} placeholder="10" required />
        <label htmlFor="memo">Memo (opcional)</label>
        <input id="memo" maxLength={28} value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="Pura vida" />
        {to.trim().length === 56 && Number(amount) > 0 && (
          <p className="muted">Vas a enviar {amount} XLM a {shortAddress(to.trim())}. Tu wallet te pedirá confirmar.</p>
        )}
        <button type="submit" disabled={sending}>{sending ? 'Esperando firma...' : 'Enviar'}</button>
      </form>
      {error && <p className="error">{error}</p>}
      {hash && (
        <p className="ok">
          Pago enviado. <a href={txExplorerUrl(hash)} target="_blank" rel="noreferrer">Ver en Stellar Expert</a>
        </p>
      )}
    </section>
  )
}
