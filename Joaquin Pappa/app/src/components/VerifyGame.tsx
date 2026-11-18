import { useState } from 'react'
import { PgnEditor } from './PgnEditor'
import { hashPgn, toHex } from '../lib/pgn'
import { getGame, friendlyError } from '../lib/contract'
import { RESULTS } from '../lib/config'

export function VerifyGame({ address }: { address?: string }) {
  const [pgn, setPgn] = useState('')
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)

  async function verify() {
    setMsg(''); setBusy(true)
    try {
      const h = await hashPgn(pgn)
      const g = await getGame(h, address)
      if (!g) return setMsg(`❌ No registrada o alterada. Hash: ${toHex(h)}`)
      const date = new Date(Number(g.timestamp) * 1000).toLocaleString()
      setMsg(`✅ Auténtica: ${g.white} vs ${g.black}, ${RESULTS[g.result]} — registrada ${date} por ${g.registrar}`)
    } catch (e) { setMsg('❌ ' + friendlyError(e)) } finally { setBusy(false) }
  }

  return (
    <section className="narrow">
      <h2 className="title"><small>Verificá la</small>Partida</h2>
      <p className="lead">Pegá un PGN para comprobar si fue registrado on-chain y no fue alterado.</p>
      <div className="form">
        <PgnEditor value={pgn} onChange={setPgn} disabled={busy} />
        <button className="btn-red" aria-busy={busy} disabled={busy || !pgn} onClick={verify}>{busy ? 'Verificando…' : 'Verificar'}</button>
        {msg && <p className="msg">{msg}</p>}
      </div>
    </section>
  )
}
