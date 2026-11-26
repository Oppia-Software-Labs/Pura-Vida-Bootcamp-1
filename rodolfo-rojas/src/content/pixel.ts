export type PixelGrid = (string | null)[][]

export const PALETTE: Record<string, string> = {
  K: '#0A1A4A',
  B: '#1F3BFF',
  L: '#DCE3FF',
  W: '#FFFFFF',
  S: '#F2C29B',
  s: '#D9A07A',
  G: '#C6D0EA',
  R: '#E5383B',
  Y: '#FFC93C',
  H: '#46557F',
  V: '#0F7A4A',
}

const FONT: Record<string, string[]> = {
  '0': ['KKK', 'K.K', 'K.K', 'K.K', 'KKK'],
  '1': ['.K.', 'KK.', '.K.', '.K.', 'KKK'],
  '5': ['KKK', 'K..', 'KKK', '..K', 'KKK'],
  G: ['KKK', 'K..', 'K.K', 'K.K', 'KKK'],
  S: ['KKK', 'K..', 'KKK', '..K', 'KKK'],
  T: ['KKK', '.K.', '.K.', '.K.', '.K.'],
  '+': ['...', '.K.', 'KKK', '.K.', '...'],
  '-': ['...', '...', 'KKK', '...', '...'],
}

type Recolor = Record<string, string>

export function createGrid(size = 32): PixelGrid {
  return Array.from({ length: size }, () => Array.from({ length: size }, () => null))
}

export function fromRows(rows: string[]): PixelGrid {
  return rows.map((row) => row.split('').map((pixel) => (pixel === '.' ? null : pixel)))
}

export function stamp(grid: PixelGrid, rows: string[], x: number, y: number, recolor: Recolor = {}) {
  rows.forEach((row, dy) =>
    row.split('').forEach((pixel, dx) => {
      if (pixel === '.') return
      paint(grid, x + dx, y + dy, recolor[pixel] ?? pixel)
    }),
  )
}

export function fill(grid: PixelGrid, x: number, y: number, width: number, height: number, color: string | null) {
  for (let dy = 0; dy < height; dy++) for (let dx = 0; dx < width; dx++) paint(grid, x + dx, y + dy, color)
}

export function box(grid: PixelGrid, x: number, y: number, width: number, height: number, inner: string) {
  fill(grid, x, y, width, height, 'K')
  fill(grid, x + 1, y + 1, width - 2, height - 2, inner)
}

export function text(grid: PixelGrid, value: string, x: number, y: number, color: string) {
  value.split('').forEach((char, index) => {
    const glyph = FONT[char]
    if (glyph) stamp(grid, glyph, x + index * 4, y, { K: color })
  })
}

export function scene(draw: (grid: PixelGrid) => void): PixelGrid {
  const grid = createGrid()
  fill(grid, 0, 31, 32, 1, 'G')
  draw(grid)
  return grid
}

function paint(grid: PixelGrid, x: number, y: number, color: string | null) {
  if (y < 0 || y >= grid.length || x < 0 || x >= grid[y].length) return
  grid[y][x] = color
}
