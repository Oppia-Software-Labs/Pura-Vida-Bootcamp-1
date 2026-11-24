import { useEffect, useMemo, useRef, useState } from 'react'
import { Chess } from 'chess.js'

type Parsed =
  | { ok: true; moves: string[]; headers: Record<string, string> }
  | { ok: false; error: string }

function parse(pgn: string): Parsed | null {
  if (!pgn.trim()) return null
  try {
    const c = new Chess()
    c.loadPgn(pgn)
    return { ok: true, moves: c.history(), headers: c.getHeaders() as Record<string, string> }
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'PGN inválido' }
  }
}

const known = (v?: string) => (v && !/^[?.\s]+$/.test(v) ? v : undefined)

export type PgnMeta = { white?: string; black?: string; result?: string }

export function PgnEditor({ value, onChange, disabled, onMeta }: {
  value: string
  onChange: (v: string) => void
  disabled?: boolean
  /** Se llama cuando cambian los headers White/Black/Result conocidos del PGN. */
  onMeta?: (m: PgnMeta) => void
}) {
  const parsed = useMemo(() => parse(value), [value])
  const file = useRef<HTMLInputElement>(null)
  const [drag, setDrag] = useState(false)

  async function paste() {
    try { onChange(await navigator.clipboard.readText()) } catch { /* sin permiso de portapapeles */ }
  }
  async function load(f?: File) {
    if (f) onChange(await f.text())
  }

  const h = parsed?.ok ? parsed.headers : {}
  const white = known(h.White), black = known(h.Black), result = h.Result && h.Result !== '*' ? h.Result : undefined
  const event = known(h.Event), date = known(h.Date)
  const plies = parsed?.ok ? parsed.moves.length : 0
  const turns = Math.ceil(plies / 2)

  const metaCb = useRef(onMeta)
  metaCb.current = onMeta
  useEffect(() => {
    if (white || black || result) metaCb.current?.({ white, black, result })
  }, [white, black, result])

  return (
    <div className={`pgn${drag ? ' drag' : ''}${parsed && !parsed.ok ? ' invalid' : ''}`}>
      <div className="pgn-bar">
        <span className="pgn-title">PGN</span>
        {parsed?.ok && <span className="pgn-status ok">{turns} {turns === 1 ? 'jugada' : 'jugadas'} · válido</span>}
        {parsed && !parsed.ok && <span className="pgn-status bad">Inválido</span>}
        <div className="pgn-actions">
          <button type="button" className="pgn-btn" disabled={disabled} onClick={paste}>Pegar</button>
          <button type="button" className="pgn-btn" disabled={disabled} onClick={() => file.current?.click()}>Abrir .pgn</button>
          {value && <button type="button" className="pgn-btn" disabled={disabled} onClick={() => onChange('')}>Limpiar</button>}
          <input ref={file} type="file" accept=".pgn,text/plain" hidden onChange={(e) => { load(e.target.files?.[0]); e.target.value = '' }} />
        </div>
      </div>

      {(white || black || result || event) && (
        <div className="pgn-meta">
          {(white || black) && <span className="pgn-players"><i className="pc w" />{white ?? '—'}<span className="vs">vs</span><i className="pc b" />{black ?? '—'}</span>}
          {result && <span className="pgn-chip strong">{result}</span>}
          {event && <span className="pgn-chip">{event}</span>}
          {date && <span className="pgn-chip">{date}</span>}
        </div>
      )}

      <textarea
        aria-label="PGN"
        spellCheck={false}
        rows={8}
        placeholder={'[White "Magnus"]\n[Black "Hikaru"]\n\n1. e4 e5 2. Nf3 Nc6 …\n\nPegá, escribí o soltá un archivo .pgn'}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        onDragOver={(e) => { e.preventDefault(); setDrag(true) }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); load(e.dataTransfer.files[0]) }}
      />

      {parsed?.ok && plies > 0 && (
        <div className="pgn-moves" aria-label="Jugadas">
          {parsed.moves.map((m, i) => (
            <span key={i} className="mv">{i % 2 === 0 && <b>{i / 2 + 1}.</b>}{m}</span>
          ))}
        </div>
      )}
      {parsed && !parsed.ok && <p className="pgn-error">{parsed.error}</p>}
    </div>
  )
}
