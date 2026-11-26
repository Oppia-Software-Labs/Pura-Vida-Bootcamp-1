import { PALETTE, type PixelGrid } from '../content/pixel'

type PixelArtProps = {
  grid: PixelGrid
  size: number
  label?: string
  className?: string
}

export function PixelArt({ grid, size, label, className = '' }: PixelArtProps) {
  return (
    <svg
      viewBox={`0 0 ${grid[0].length} ${grid.length}`}
      width={size}
      height={size}
      shapeRendering="crispEdges"
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={`block shrink-0 bg-niebla ${className}`}
    >
      {grid.flatMap((row, y) =>
        row.map((pixel, x) =>
          pixel ? <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={PALETTE[pixel]} /> : null,
        ),
      )}
    </svg>
  )
}
