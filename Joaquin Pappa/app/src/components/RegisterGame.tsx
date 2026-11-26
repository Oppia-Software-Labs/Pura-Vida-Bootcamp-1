import { useState } from 'react'
import { PgnEditor, type PgnMeta } from './PgnEditor'

// Header Result del PGN → índice de RESULTS.
const PGN_RESULT: Record<string, number> = { '1-0': 0, '0-1': 1, '1/2-1/2': 2 }
import { hashPgn, toHex } from '../lib/pgn'
import { registerGame, friendlyError } from '../lib/contract'
import { RESULTS } from '../lib/config'

export function RegisterGame({ address }: { address?: string }) {
  const [pgn, setPgn] = useState('')
  const [white, setWhite] = useState('')
  const [black, setBlack] = useState('')
  const [result, setResult] = useState(0)
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)

  // El PGN manda: si trae headers, pisan lo cargado a mano.
  function fillFromPgn(m: PgnMeta) {
    if (m.white) setWhite(m.white)
    if (m.black) setBlack(m.black)
    const r = m.result ? PGN_RESULT[m.result] : undefined
    if (r !== undefined) setResult(r)
  }

  async function submit() {
    if (!address) return setMsg('Conectá tu wallet primero.')
    const w = white.trim(), b = black.trim()
    if (!w || !b) return setMsg('Completá blancas y negras.')
    setBusy(true); setMsg('')
    try {
      const h = await hashPgn(pgn)
      await registerGame(address, h, w, b, result)
      setMsg(`✅ Registrada. Hash: ${toHex(h)}`)
      setPgn('')
    } catch (e) { setMsg('❌ ' + friendlyError(e)) } finally { setBusy(false) }
  }

  return (
    <section className="narrow">
      <h2 className="title"><small>Registrá la</small>Partida</h2>
      <p className="lead">Pegá el PGN de una partida jugada fuera de la app. Se guarda su hash on-chain junto con jugadores y resultado.</p>
      <div className="form">
        <div className="row">
          <label><span className="label">Blancas</span><input placeholder="Nombre" value={white} onChange={(e) => setWhite(e.target.value)} /></label>
          <label><span className="label">Negras</span><input placeholder="Nombre" value={black} onChange={(e) => setBlack(e.target.value)} /></label>
          <label><span className="label">Resultado</span>
            <select value={result} onChange={(e) => setResult(Number(e.target.value))}>
              {RESULTS.map((r, i) => <option key={r} value={i}>{r}</option>)}
            </select>
          </label>
        </div>
        <PgnEditor value={pgn} onChange={setPgn} disabled={busy} onMeta={fillFromPgn} />
        <button className="btn-red" aria-busy={busy} disabled={busy || !pgn || !white.trim() || !black.trim()} onClick={submit}>{busy ? 'Firmando…' : 'Registrar'}</button>
        {msg && <p className="msg">{msg}</p>}
      </div>
    </section>
  )
}
