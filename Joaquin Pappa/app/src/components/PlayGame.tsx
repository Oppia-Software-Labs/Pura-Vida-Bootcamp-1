import { useEffect, useMemo, useRef, useState } from 'react'
import { Chess, type Square } from 'chess.js'
import { hashPgn, toHex } from '../lib/pgn'
import { registerGame, friendlyError } from '../lib/contract'
import { RESULTS, TIME_CONTROLS } from '../lib/config'
import { Board } from './Board'

// índice de RESULTS: 0 = 1-0, 1 = 0-1, 2 = ½-½
type Outcome = { result: number; reason: string }

function naturalOutcome(chess: Chess): Outcome | undefined {
  if (chess.isCheckmate()) return { result: chess.turn() === 'w' ? 1 : 0, reason: 'Jaque mate' }
  if (chess.isStalemate()) return { result: 2, reason: 'Ahogado' }
  if (chess.isInsufficientMaterial()) return { result: 2, reason: 'Material insuficiente' }
  if (chess.isThreefoldRepetition()) return { result: 2, reason: 'Triple repetición' }
  if (chess.isDraw()) return { result: 2, reason: 'Regla de 50 movimientos' }
  return undefined
}

type Clock = { w: number; b: number } // ms restantes por color

function freshClock(tcIdx: number): Clock {
  const ms = TIME_CONTROLS[tcIdx].base * 60_000
  return { w: ms, b: ms }
}

// Display: m:ss, con décimas por debajo de 10 s.
function fmtClock(ms: number) {
  const t = Math.max(0, ms)
  if (t < 10_000) return `0:0${(t / 1000).toFixed(1)}`
  const s = Math.ceil(t / 1000)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

// Formato PGN estándar para [%clk h:mm:ss]
function clkTag(ms: number) {
  const s = Math.max(0, Math.ceil(ms / 1000))
  const mm = String(Math.floor(s / 60) % 60).padStart(2, '0')
  return `${Math.floor(s / 3600)}:${mm}:${String(s % 60).padStart(2, '0')}`
}

type RegState = { status: 'idle' | 'waiting' | 'busy' | 'done' | 'error'; msg: string }

export function PlayGame({ address }: { address?: string }) {
  const [chess] = useState(() => new Chess())
  const [, setVersion] = useState(0) // fuerza re-render tras mutar chess
  const [selected, setSelected] = useState<Square>()
  const [flipped, setFlipped] = useState(false)
  const [white, setWhite] = useState('')
  const [black, setBlack] = useState('')
  const [manual, setManual] = useState<Outcome>() // abandono / tablas acordadas
  const [reg, setReg] = useState<RegState>({ status: 'idle', msg: '' })
  const registering = useRef(false)
  const rootRef = useRef<HTMLElement>(null)
  const [isFs, setIsFs] = useState(false)
  const [tcIdx, setTcIdx] = useState(0)
  const [clock, setClock] = useState<Clock>(() => freshClock(0))
  const [now, setNow] = useState(() => Date.now())
  const turnStart = useRef(0) // Date.now() cuando arrancó el reloj del lado que mueve
  const clockHistory = useRef<Clock[]>([]) // snapshot antes de cada jugada, para deshacer

  useEffect(() => {
    const onChange = () => setIsFs(document.fullscreenElement === rootRef.current)
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  function toggleFullscreen() {
    if (document.fullscreenElement) void document.exitFullscreen()
    else rootRef.current?.requestFullscreen().catch(() => {})
  }

  const outcome = manual ?? naturalOutcome(chess)
  const over = outcome !== undefined
  const moves = chess.history()
  const names = { w: white.trim(), b: black.trim() }
  const tc = TIME_CONTROLS[tcIdx]
  const timed = tc.base > 0
  // El reloj arranca con la primera jugada de blancas.
  const running = timed && !over && moves.length > 0
  const turn = chess.turn()
  const shown: Clock = running ? { ...clock, [turn]: clock[turn] - (now - turnStart.current) } : clock

  useEffect(() => {
    if (!running) return
    const id = setInterval(() => setNow(Date.now()), 100)
    return () => clearInterval(id)
  }, [running])

  // Bandera: se acabó el tiempo del lado que mueve.
  useEffect(() => {
    if (running && shown[turn] <= 0) flag(turn)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, now])

  function flag(side: 'w' | 'b') {
    setClock((c) => ({ ...c, [side]: 0 }))
    setManual({ result: side === 'w' ? 1 : 0, reason: `Tiempo agotado de ${side === 'w' ? 'blancas' : 'negras'}` })
  }

  function changeTc(idx: number) {
    if (moves.length > 0) return
    setTcIdx(idx); setClock(freshClock(idx))
  }

  const targets = useMemo(
    () => (selected ? new Set(chess.moves({ square: selected, verbose: true }).map((m) => m.to)) : new Set<string>()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [selected, moves.length],
  )

  function bump() { setVersion((v) => v + 1) }

  function clickSquare(sq: Square) {
    if (over) return
    const piece = chess.get(sq)
    if (selected && targets.has(sq)) {
      const mover = chess.turn()
      const t = Date.now()
      let next = clock
      if (timed) {
        const left = clock[mover] - (moves.length > 0 ? t - turnStart.current : 0)
        if (left <= 0) return flag(mover)
        next = { ...clock, [mover]: left + tc.inc * 1000 }
      }
      chess.move({ from: selected, to: sq, promotion: 'q' })
      if (timed) chess.setComment(`[%clk ${clkTag(next[mover])}]`)
      clockHistory.current.push(clock)
      setClock(next); turnStart.current = t; setNow(t)
      setSelected(undefined)
      bump()
      return
    }
    setSelected(piece && piece.color === chess.turn() ? sq : undefined)
  }

  function undo() {
    if (over || moves.length === 0) return
    chess.removeComment(); chess.undo(); setSelected(undefined)
    const prev = clockHistory.current.pop()
    if (prev) setClock(prev)
    turnStart.current = Date.now(); setNow(turnStart.current)
    bump()
  }

  function resign() {
    if (over || moves.length === 0) return
    const loser = chess.turn()
    setManual({ result: loser === 'w' ? 1 : 0, reason: `Abandono de ${loser === 'w' ? 'blancas' : 'negras'}` })
  }

  function agreeDraw() {
    if (over || moves.length === 0) return
    setManual({ result: 2, reason: 'Tablas acordadas' })
  }

  function newGame() {
    chess.reset(); chess.removeComments(); setManual(undefined); setSelected(undefined)
    setClock(freshClock(tcIdx)); clockHistory.current = []
    setReg({ status: 'idle', msg: '' }); registering.current = false
    bump()
  }

  function pgnText() {
    chess.setHeader('White', names.w || '?')
    chess.setHeader('Black', names.b || '?')
    if (timed) chess.setHeader('TimeControl', `${tc.base * 60}+${tc.inc}`)
    else chess.removeHeader('TimeControl')
    chess.setHeader('Result', outcome ? ['1-0', '0-1', '1/2-1/2'][outcome.result] : '*')
    return chess.pgn()
  }

  async function register() {
    if (!outcome || registering.current) return
    if (moves.length === 0) return setReg({ status: 'error', msg: 'La partida no tiene jugadas.' })
    if (!names.w || !names.b) return setReg({ status: 'waiting', msg: 'Completá los nombres de blancas y negras para registrar.' })
    if (!address) return setReg({ status: 'waiting', msg: 'Conectá tu wallet: la partida se registra automáticamente al conectar.' })
    registering.current = true
    setReg({ status: 'busy', msg: 'Firmá la transacción en Freighter…' })
    try {
      const h = await hashPgn(pgnText())
      await registerGame(address, h, names.w, names.b, outcome.result)
      setReg({ status: 'done', msg: `✅ Registrada on-chain. Hash: ${toHex(h)}` })
    } catch (e) {
      registering.current = false
      setReg({ status: 'error', msg: '❌ ' + friendlyError(e) })
    }
  }

  // Registro automático al terminar la partida (o al conectar wallet / completar nombres después).
  useEffect(() => {
    if (over && (reg.status === 'idle' || reg.status === 'waiting')) void register()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [over, address, names.w, names.b])

  return (
    <section className="play" ref={rootRef}>
      <h2 className="title"><small>Jugá la</small>Partida</h2>
      <div className="play-layout">
      <div className="board-wrap">
      <Board chess={chess} flipped={flipped} over={over} selected={selected} targets={targets} onSquare={clickSquare} />
      </div>

      <aside className="panel">
      <label><span className="label">Reloj</span>
        <select value={tcIdx} disabled={moves.length > 0} onChange={(e) => changeTc(Number(e.target.value))}>
          {TIME_CONTROLS.map((t, i) => <option key={t.label} value={i}>{t.label}</option>)}
        </select>
      </label>

      <div className="play-names">
        <label><span className="label">Blancas</span>
          <input placeholder="Nombre" value={white} disabled={reg.status === 'busy' || reg.status === 'done'} onChange={(e) => setWhite(e.target.value)} />
        </label>
        <label><span className="label">Negras</span>
          <input placeholder="Nombre" value={black} disabled={reg.status === 'busy' || reg.status === 'done'} onChange={(e) => setBlack(e.target.value)} />
        </label>
      </div>

      {timed && (
        <div className="play-clocks">
          {(['w', 'b'] as const).map((side) => (
            <div key={side} className={`clock${running && turn === side ? ' is-active' : ''}${shown[side] < 10_000 ? ' is-low' : ''}`}>
              <span className="label">{side === 'w' ? names.w || 'Blancas' : names.b || 'Negras'}</span>
              <span className="clock-time">{fmtClock(shown[side])}</span>
            </div>
          ))}
        </div>
      )}

      <p className={`play-status${over ? ' is-over' : ''}`}>
        {over
          ? `${outcome.reason} — ${RESULTS[outcome.result]}`
          : `Turno de ${chess.turn() === 'w' ? 'blancas' : 'negras'}${chess.inCheck() ? ' (jaque)' : ''}`}
      </p>

      <div className="play-actions">
        <button onClick={() => setFlipped((v) => !v)}>Girar</button>
        <button disabled={over || moves.length === 0} onClick={undo}>Deshacer</button>
        <button disabled={over || moves.length === 0} onClick={resign}>Abandonar</button>
        <button disabled={over || moves.length === 0} onClick={agreeDraw}>Tablas</button>
        <button className="btn-red" disabled={reg.status === 'busy'} onClick={newGame}>Nueva</button>
        {document.fullscreenEnabled && (
          <button className="btn-fs" onClick={toggleFullscreen}>{isFs ? 'Salir de pantalla completa' : 'Pantalla completa'}</button>
        )}
      </div>

      {moves.length > 0 && (
        <ol className="play-moves">
          {moves.filter((_, i) => i % 2 === 0).map((m, i) => (
            <li key={i}>{m} {moves[i * 2 + 1] ?? ''}</li>
          ))}
        </ol>
      )}

      {over && (
        <>
          {reg.msg && <p className="msg">{reg.msg}</p>}
          {reg.status === 'error' && <button className="btn-red" onClick={() => void register()}>Reintentar registro</button>}
          <details>
            <summary>PGN</summary>
            <textarea readOnly rows={6} value={pgnText()} />
          </details>
        </>
      )}
      </aside>
      </div>
    </section>
  )
}
