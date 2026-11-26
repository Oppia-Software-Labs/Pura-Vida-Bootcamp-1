import { useCallback, useEffect, useRef, useState } from 'react'

// Bridge local (Joaquin Pappa/vision-bridge, o su contenedor Docker) que corre el modelo chess-vision.
// La cámara la abre el navegador y le manda frames JPEG; el bridge devuelve el tablero jugada a jugada.
export const VISION_BRIDGE_URL: string = import.meta.env.VITE_VISION_BRIDGE_URL ?? 'ws://127.0.0.1:8765'

export type BridgeEnd = { pgn: string | null; hash?: string | null; result?: string; reason?: string; error?: string }

export type Corners = [number, number][] // a1, a8, h8, h1 normalizados 0..1
export type FrameInfo = { ms: number; hand?: boolean; warming?: boolean; needCorners?: boolean; corners?: Corners | null }
type Mode = 'camera' | 'replay' | 'browser'

type Msg =
  | { type: 'status'; running: boolean; mode: Mode }
  | ({ type: 'frame' } & FrameInfo)
  | { type: 'state'; fen: string; moves: string[] }
  | { type: 'log'; line: string }
  | ({ type: 'end' } & BridgeEnd)
  | { type: 'error'; message: string }

export type StartOpts = { white: string; black: string; corners?: Corners | null }

const MAX_LOG = 40

export function useVisionBridge() {
  const ws = useRef<WebSocket | null>(null)
  const [connected, setConnected] = useState(false)
  const [running, setRunning] = useState(false)
  const [mode, setMode] = useState<Mode>()
  const [frame, setFrame] = useState<FrameInfo>()
  // Backpressure: un frame en vuelo por vez; el bridge responde {type:'frame'} al terminarlo.
  const inFlight = useRef(false)
  const [moves, setMoves] = useState<string[]>([])
  const [log, setLog] = useState<string[]>([])
  const [end, setEnd] = useState<BridgeEnd>()
  const [error, setError] = useState<string>()

  useEffect(() => {
    let closed = false
    let retry: ReturnType<typeof setTimeout>
    function connect() {
      const sock = new WebSocket(VISION_BRIDGE_URL)
      ws.current = sock
      sock.onopen = () => { setConnected(true); setError(undefined) }
      sock.onclose = () => {
        setConnected(false); setRunning(false); inFlight.current = false
        if (!closed) retry = setTimeout(connect, 3000) // el bridge puede arrancar después que la app
      }
      sock.onmessage = (ev) => {
        let m: Msg
        try { m = JSON.parse(String(ev.data)) } catch { return }
        if (m.type === 'status') { setRunning(m.running); setMode(m.mode); if (!m.running) inFlight.current = false }
        else if (m.type === 'frame') { inFlight.current = false; setFrame(m) }
        else if (m.type === 'state') setMoves(m.moves)
        else if (m.type === 'log') setLog((l) => [...l, m.line].slice(-MAX_LOG))
        else if (m.type === 'end') setEnd({ pgn: m.pgn, hash: m.hash, result: m.result, reason: m.reason, error: m.error })
        else if (m.type === 'error') setError(m.message)
      }
    }
    connect()
    return () => { closed = true; clearTimeout(retry); ws.current?.close() }
  }, [])

  const send = (o: object) => ws.current?.readyState === WebSocket.OPEN && ws.current.send(JSON.stringify(o))

  const start = useCallback((o: StartOpts) => {
    setMoves([]); setLog([]); setEnd(undefined); setError(undefined); setFrame(undefined)
    inFlight.current = false
    send({ cmd: 'start', source: 'browser', ...o })
  }, [])
  /** Manda un frame si no hay otro en vuelo. Devuelve si lo mandó. */
  const sendFrame = useCallback((jpeg: Blob) => {
    const sock = ws.current
    if (inFlight.current || sock?.readyState !== WebSocket.OPEN) return false
    inFlight.current = true
    sock.send(jpeg)
    return true
  }, [])
  const setCorners = useCallback((corners: Corners | null) => send({ cmd: 'corners', corners }), [])
  const busy = useCallback(() => inFlight.current, [])
  const stop = useCallback(() => send({ cmd: 'stop' }), [])
  const reset = useCallback(() => { setMoves([]); setLog([]); setEnd(undefined); setError(undefined) }, [])

  return { connected, running, mode, moves, log, end, error, frame, start, stop, reset, sendFrame, setCorners, busy }
}
