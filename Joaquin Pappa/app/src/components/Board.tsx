import type { Chess, Square } from 'chess.js'

const GLYPH: Record<string, string> = { k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟' }
const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']

type Props = {
  chess: Chess
  flipped?: boolean
  over?: boolean
  selected?: Square
  targets?: Set<string>
  onSquare?: (sq: Square) => void // sin handler el tablero es de solo lectura
}

export function Board({ chess, flipped = false, over = false, selected, targets, onSquare }: Props) {
  const ranks = flipped ? [1, 2, 3, 4, 5, 6, 7, 8] : [8, 7, 6, 5, 4, 3, 2, 1]
  const files = flipped ? [...FILES].reverse() : FILES
  const last = chess.history({ verbose: true }).at(-1)
  const checkSq = chess.inCheck()
    ? chess.board().flat().find((p) => p && p.type === 'k' && p.color === chess.turn())?.square
    : undefined

  return (
    <div className={`board${over ? ' board-over' : ''}${onSquare ? '' : ' board-readonly'}`} role="grid" aria-label="Tablero">
      {ranks.map((r, ri) =>
        files.map((f, fi) => {
          const sq = `${f}${r}` as Square
          const p = chess.get(sq)
          const dark = (FILES.indexOf(f) + r) % 2 === 1
          const cls = [
            'sq',
            dark ? 'sq-dark' : 'sq-light',
            selected === sq && 'sq-sel',
            (last?.from === sq || last?.to === sq) && 'sq-last',
            checkSq === sq && 'sq-check',
            targets?.has(sq) && (p ? 'sq-capture' : 'sq-target'),
          ].filter(Boolean).join(' ')
          return (
            <button key={sq} className={cls} style={{ ['--i' as string]: ri * 8 + fi }} onClick={onSquare && (() => onSquare(sq))} disabled={!onSquare} aria-label={sq}>
              {p && <span className={p.color === 'w' ? 'pc-w' : 'pc-b'}>{GLYPH[p.type]}</span>}
            </button>
          )
        }),
      )}
    </div>
  )
}
