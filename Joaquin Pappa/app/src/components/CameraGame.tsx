import { useEffect, useMemo, useState } from 'react'
import { Chess } from 'chess.js'
import { Board } from './Board'
import { canonicalMoves, hashPgn, toHex } from '../lib/pgn'
import { registerGame, friendlyError } from '../lib/contract'
import { RESULTS } from '../lib/config'
import { useVisionBridge, VISION_BRIDGE_URL, type Corners } from '../lib/visionBridge'
import { LiveCamera } from './LiveCamera'

const PGN_RESULT = ['1-0', '0-1', '1/2-1/2']

function boardFrom(moves: string[]): Chess {
  const c = new Chess()
  for (const m of moves) {
    try { c.move(m) } catch { break } // no debería pasar: el bridge ya valida
  }
  return c
}

type Review = { canonical?: string; hash?: string; error?: string }

export function CameraGame({ address }: { address?: string }) {
  const bridge = useVisionBridge()
  const [white, setWhite] = useState('')
  const [black, setBlack] = useState('')
  const [corners, setCorners] = useState<Corners | null>(null) // null = auto-detectar
  const [flipped, setFlipped] = useState(false)

  // Revisión humana antes de firmar: el registro es de escritura única.
  const [pgn, setPgn] = useState('')
  const [result, setResult] = useState<number>()
  const [hashed, setReview] = useState<Review>({})
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)

  const chess = useMemo(() => boardFrom(bridge.moves), [bridge.moves])
  const names = { w: white.trim(), b: black.trim() }

  // Cuando llega el PGN final, precargar la revisión (ajuste en render, sin effect).
  const [seenEnd, setSeenEnd] = useState(bridge.end)
  if (bridge.end !== seenEnd) {
    setSeenEnd(bridge.end)
    if (bridge.end?.pgn) {
      setPgn(bridge.end.pgn)
      const i = PGN_RESULT.indexOf(bridge.end.result ?? '*')
      setResult(i >= 0 ? i : undefined) // '*': la cámara no detecta abandono ni tablas acordadas
      setMsg(''); setDone(false)
    }
  }

  // Recalcular hash al editar el PGN.
  useEffect(() => {
    if (!pgn) return
    let alive = true
    hashPgn(pgn)
      .then((h) => alive && setReview({ canonical: canonicalMoves(pgn), hash: toHex(h) }))
      .catch((e: Error) => alive && setReview({ error: e.message }))
    return () => { alive = false }
  }, [pgn])

  const review: Review = pgn ? hashed : {}
  const edited = review.hash && bridge.end?.hash && review.hash !== bridge.end.hash

  function start() {
    setPgn(''); setResult(undefined); setMsg(''); setDone(false)
    bridge.start({ white: names.w, black: names.b, corners })
  }

  function changeCorners(c: Corners | null) {
    setCorners(c)
    if (bridge.running) bridge.setCorners(c)
  }

  function discard() {
    bridge.reset(); setPgn(''); setResult(undefined); setMsg(''); setDone(false)
  }

  async function register() {
    if (!address) return setMsg('Conectá tu wallet primero.')
    if (!names.w || !names.b) return setMsg('Completá blancas y negras.')
    if (result === undefined) return setMsg('Elegí el resultado.')
    setBusy(true); setMsg('Firmá la transacción en Freighter…')
    try {
      const h = await hashPgn(pgn)
      await registerGame(address, h, names.w, names.b, result)
      setMsg(`✅ Registrada on-chain. Hash: ${toHex(h)}`); setDone(true)
    } catch (e) { setMsg('❌ ' + friendlyError(e)) } finally { setBusy(false) }
  }

  const reviewing = !!bridge.end
  const lastLines = bridge.log.slice(-6)

  return (
    <section className="play">
      <h2 className="title"><small>Grabá en vivo con la</small>Cámara</h2>
      <p className="lead">
        Tu navegador abre la cámara y el modelo chess-vision (corriendo en tu PC con Docker) lee el tablero jugada a jugada. Al terminar revisás el PGN y lo registrás on-chain.
      </p>
      <div className="play-layout">
        <div className="cam-split">
          <LiveCamera running={bridge.running && bridge.mode === 'browser'} frame={bridge.frame}
            sendFrame={bridge.sendFrame} busy={bridge.busy} onCorners={changeCorners} />
          <div className="board-wrap">
            <Board chess={chess} flipped={flipped} over={reviewing} />
          </div>
        </div>

        <aside className="panel">
          <p className={`cam-conn${bridge.connected ? ' is-on' : ''}`}>
            {bridge.connected
              ? `Modelo local conectado${bridge.mode === 'replay' ? ' (replay)' : ''}`
              : `Modelo local desconectado · ${VISION_BRIDGE_URL}`}
          </p>
          {!bridge.connected && (
            <p className="cam-help">
              Levantalo en tu PC: <code>docker compose -f vision-bridge/docker-compose.yml up -d</code> (ver README).
            </p>
          )}

          <div className="play-names">
            <label><span className="label">Blancas</span>
              <input placeholder="Nombre" value={white} disabled={bridge.running || done} onChange={(e) => setWhite(e.target.value)} />
            </label>
            <label><span className="label">Negras</span>
              <input placeholder="Nombre" value={black} disabled={bridge.running || done} onChange={(e) => setBlack(e.target.value)} />
            </label>
          </div>

          <p className={`play-status${reviewing ? ' is-over' : ''}`}>
            {bridge.running ? `Grabando · ${bridge.moves.length} jugadas` : reviewing ? 'Revisar y registrar' : 'Listo para grabar'}
          </p>

          <div className="play-actions">
            <button onClick={() => setFlipped((v) => !v)}>Girar</button>
            {bridge.running
              ? <button className="btn-red" onClick={bridge.stop}>Terminar</button>
              : <button className="btn-red" disabled={!bridge.connected || !names.w || !names.b || busy} onClick={start}>
                  {reviewing ? 'Nueva' : 'Iniciar'}
                </button>}
          </div>

          {bridge.error && <p className="msg">❌ {bridge.error}</p>}

          {bridge.moves.length > 0 && (
            <ol className="play-moves">
              {bridge.moves.filter((_, i) => i % 2 === 0).map((m, i) => (
                <li key={i}>{m} {bridge.moves[i * 2 + 1] ?? ''}</li>
              ))}
            </ol>
          )}

          {lastLines.length > 0 && (
            <details>
              <summary>Log del modelo</summary>
              <pre className="cam-log">{lastLines.join('\n')}</pre>
            </details>
          )}

          {bridge.end && !bridge.end.pgn && <p className="msg">{bridge.end.reason}</p>}

          {bridge.end?.pgn && (
            <div className="form">
              <p className="cam-warn">
                La visión puede equivocarse. Revisá las jugadas antes de firmar: el registro no se puede corregir.
              </p>
              <label><span className="label">PGN</span>
                <textarea rows={7} value={pgn} disabled={busy || done} onChange={(e) => setPgn(e.target.value)} />
              </label>
              <label><span className="label">Resultado</span>
                <select value={result ?? ''} disabled={busy || done} onChange={(e) => setResult(Number(e.target.value))}>
                  <option value="" disabled>Elegir…</option>
                  {RESULTS.map((r, i) => <option key={r} value={i}>{r}</option>)}
                </select>
              </label>
              {review.error
                ? <p className="msg">❌ {review.error}</p>
                : review.hash && <p className="cam-hash">Hash {edited ? '(editado a mano)' : '(cámara)'}: <code>{review.hash}</code></p>}
              <div className="play-actions">
                <button disabled={busy} onClick={discard}>Descartar</button>
                <button className="btn-red" aria-busy={busy} disabled={busy || done || !!review.error || !review.hash || result === undefined} onClick={() => void register()}>
                  {busy ? 'Firmando…' : 'Registrar'}
                </button>
              </div>
            </div>
          )}

          {msg && <p className="msg">{msg}</p>}
        </aside>
      </div>
    </section>
  )
}
