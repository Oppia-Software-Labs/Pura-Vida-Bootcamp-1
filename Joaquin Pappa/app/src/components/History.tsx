import { useEffect, useMemo, useState } from 'react'
import { gamesBy, getGame, friendlyError } from '../lib/contract'
import { toHex } from '../lib/pgn'
import { RESULTS } from '../lib/config'

type Row = { hash: string; white: string; black: string; result: number; ts: number }
type Rec = { name: string; games: number; w: number; d: number; l: number }

const MONTHS = 6
const fmtDate = (ts: number) => new Date(ts * 1000).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })
const pct = (n: number, t: number) => (t ? Math.round((n / t) * 100) : 0)

function stats(rows: Row[]) {
  const total = rows.length
  const by = [0, 0, 0]
  const players = new Map<string, Rec>()
  const add = (name: string, k: 'w' | 'd' | 'l') => {
    const key = name.toLowerCase()
    const r = players.get(key) ?? { name, games: 0, w: 0, d: 0, l: 0 }
    r.games++; r[k]++
    players.set(key, r)
  }
  for (const g of rows) {
    by[g.result]++
    add(g.white, g.result === 0 ? 'w' : g.result === 1 ? 'l' : 'd')
    add(g.black, g.result === 1 ? 'w' : g.result === 0 ? 'l' : 'd')
  }
  const ranking = [...players.values()].sort((a, b) => b.games - a.games || (b.w + b.d / 2) - (a.w + a.d / 2)).slice(0, 5)

  // Actividad de los últimos N meses (incluye meses en cero).
  const now = new Date()
  const months = Array.from({ length: MONTHS }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (MONTHS - 1 - i), 1)
    return { key: `${d.getFullYear()}-${d.getMonth()}`, label: d.toLocaleDateString(undefined, { month: 'short' }), n: 0 }
  })
  for (const g of rows) {
    const d = new Date(g.ts * 1000)
    const m = months.find((x) => x.key === `${d.getFullYear()}-${d.getMonth()}`)
    if (m) m.n++
  }
  const peak = Math.max(1, ...months.map((m) => m.n))
  const ts = rows.map((r) => r.ts)
  return {
    total, by, ranking, months, peak,
    players: players.size,
    first: ts.length ? Math.min(...ts) : 0,
    last: ts.length ? Math.max(...ts) : 0,
  }
}

export function History({ address }: { address?: string }) {
  const [rows, setRows] = useState<Row[]>([])
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)
  const [q, setQ] = useState('')

  useEffect(() => {
    if (!address) return
    let off = false
    setMsg(''); setLoading(true); setRows([])
    gamesBy(address)
      .then(async (list) => {
        const hashes = list.map((b) => new Uint8Array(b))
        const games = await Promise.all(hashes.map((h) => getGame(h, address).catch(() => undefined)))
        const out: Row[] = []
        games.forEach((g, i) => {
          if (g) out.push({ hash: toHex(hashes[i]), white: g.white, black: g.black, result: g.result, ts: Number(g.timestamp) })
        })
        out.sort((a, b) => b.ts - a.ts)
        if (!off) setRows(out)
      })
      .catch((e) => { if (!off) setMsg(friendlyError(e)) })
      .finally(() => { if (!off) setLoading(false) })
    return () => { off = true }
  }, [address])

  const s = useMemo(() => stats(rows), [rows])
  const shown = useMemo(() => {
    const t = q.trim().toLowerCase()
    return t ? rows.filter((r) => r.white.toLowerCase().includes(t) || r.black.toLowerCase().includes(t)) : rows
  }, [rows, q])

  return (
    <section className="stats-page">
      <h2 className="title"><small>Revisá tus</small>Partidas</h2>
      {!address && <p className="lead">Conectá tu wallet para ver tus partidas registradas y sus estadísticas.</p>}
      {msg && <p className="msg">{msg}</p>}

      {loading && (
        <div className="kpis" aria-busy="true" aria-label="Cargando">
          {[0, 1, 2, 3].map((i) => <div key={i} className="kpi"><span className="skeleton short" /><span className="skeleton" /></div>)}
        </div>
      )}

      {address && !loading && !msg && rows.length === 0 && (
        <p className="lead">Todavía no registraste partidas. Jugá una o registrá un PGN para ver tus estadísticas acá.</p>
      )}

      {rows.length > 0 && (
        <>
          <div className="kpis">
            <div className="kpi" style={{ ['--i' as string]: 0 }}><span className="kpi-label">Partidas</span><strong>{s.total}</strong><small>registradas on-chain</small></div>
            <div className="kpi" style={{ ['--i' as string]: 1 }}><span className="kpi-label">Jugadores</span><strong>{s.players}</strong><small>nombres distintos</small></div>
            <div className="kpi" style={{ ['--i' as string]: 2 }}><span className="kpi-label">Tablas</span><strong>{pct(s.by[2], s.total)}%</strong><small>{s.by[2]} de {s.total}</small></div>
            <div className="kpi" style={{ ['--i' as string]: 3 }}><span className="kpi-label">Última</span><strong className="kpi-date">{fmtDate(s.last)}</strong><small>desde {fmtDate(s.first)}</small></div>
          </div>

          <div className="stats-grid">
            <article className="card">
              <h3>Resultados</h3>
              <div className="split" role="img" aria-label={`Blancas ${s.by[0]}, negras ${s.by[1]}, tablas ${s.by[2]}`}>
                {s.by[0] > 0 && <span className="split-w" style={{ flexGrow: s.by[0] }} />}
                {s.by[2] > 0 && <span className="split-d" style={{ flexGrow: s.by[2] }} />}
                {s.by[1] > 0 && <span className="split-b" style={{ flexGrow: s.by[1] }} />}
              </div>
              <ul className="legend">
                <li><i className="split-w" />Ganan blancas<b>{s.by[0]}</b><span>{pct(s.by[0], s.total)}%</span></li>
                <li><i className="split-d" />Tablas<b>{s.by[2]}</b><span>{pct(s.by[2], s.total)}%</span></li>
                <li><i className="split-b" />Ganan negras<b>{s.by[1]}</b><span>{pct(s.by[1], s.total)}%</span></li>
              </ul>
            </article>

            <article className="card">
              <h3>Actividad <small>últimos {MONTHS} meses</small></h3>
              <div className="bars">
                {s.months.map((m) => (
                  <div key={m.key} className="bar" title={`${m.label}: ${m.n}`}>
                    <span className="bar-n">{m.n || ''}</span>
                    <span className="bar-fill" style={{ height: `${(m.n / s.peak) * 100}%` }} />
                    <span className="bar-l">{m.label}</span>
                  </div>
                ))}
              </div>
            </article>

            <article className="card card-wide">
              <h3>Jugadores <small>top {s.ranking.length} por partidas</small></h3>
              <table className="ranking">
                <thead><tr><th>Jugador</th><th>PJ</th><th>G</th><th>E</th><th>P</th><th>Puntos</th></tr></thead>
                <tbody>
                  {s.ranking.map((p) => (
                    <tr key={p.name}>
                      <td>{p.name}</td><td>{p.games}</td><td>{p.w}</td><td>{p.d}</td><td>{p.l}</td>
                      <td><span className="score"><span style={{ width: `${pct(p.w + p.d / 2, p.games)}%` }} /></span>{p.w + p.d / 2}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </article>
          </div>

          <div className="games-head">
            <h3>Todas las partidas</h3>
            <input type="search" placeholder="Buscar jugador…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Buscar jugador" />
          </div>
          {shown.length === 0 && <p className="lead">Ninguna partida coincide con “{q}”.</p>}
          <ul className="history">
            {shown.map((g, i) => (
              <li key={g.hash} style={{ ['--i' as string]: Math.min(i, 12) }}>
                <span className="history-n">{String(rows.indexOf(g) + 1).padStart(2, '0')}</span>
                <div className="game">
                  <p className="game-players">
                    <span className={g.result === 0 ? 'win' : undefined}>{g.white}</span>
                    <em>vs</em>
                    <span className={g.result === 1 ? 'win' : undefined}>{g.black}</span>
                  </p>
                  <code title={g.hash}>{g.hash.slice(0, 10)}…{g.hash.slice(-8)}</code>
                </div>
                <span className={`chip chip-${g.result}`}>{RESULTS[g.result]}</span>
                <time className="game-date">{fmtDate(g.ts)}</time>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  )
}
