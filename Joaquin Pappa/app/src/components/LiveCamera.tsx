import { useEffect, useRef, useState } from 'react'
import type { Corners, FrameInfo } from '../lib/visionBridge'

const FRAME_W = 960 // ancho que se manda al modelo (el bridge escala las esquinas igual)
const TICK_MS = 50 // máximo ~20 fps; el backpressure del bridge manda menos si el modelo va lento
const CORNER_NAMES = ['a1', 'a8', 'h8', 'h1']

type Props = {
  running: boolean
  frame?: FrameInfo
  sendFrame: (jpeg: Blob) => boolean
  busy: () => boolean
  /** Esquinas marcadas a mano (null = auto-detectar). */
  onCorners: (c: Corners | null) => void
}

/** Abre la cámara elegida con getUserMedia, la muestra en vivo y le pasa frames al bridge. */
export function LiveCamera({ running, frame, sendFrame, busy, onCorners }: Props) {
  const video = useRef<HTMLVideoElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([])
  const [deviceId, setDeviceId] = useState(() => localStorageGet('cam-device') ?? '')
  const [camError, setCamError] = useState<string>()
  const [marking, setMarking] = useState<Corners | null>(null)
  const [manual, setManual] = useState<Corners | null>(null)

  // Abrir la cámara (y reabrir al cambiar de dispositivo).
  useEffect(() => {
    let stream: MediaStream | undefined
    let alive = true
    if (!navigator.mediaDevices?.getUserMedia) {
      setCamError('Este navegador no permite usar la cámara (requiere HTTPS o localhost).')
      return
    }
    navigator.mediaDevices
      .getUserMedia({ video: { ...(deviceId ? { deviceId: { exact: deviceId } } : {}), width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false })
      .then(async (s) => {
        if (!alive) return s.getTracks().forEach((t) => t.stop())
        stream = s
        setCamError(undefined)
        if (video.current) { video.current.srcObject = s; await video.current.play().catch(() => {}) }
        // Las etiquetas de los dispositivos solo aparecen después de dar permiso.
        const all = await navigator.mediaDevices.enumerateDevices()
        if (alive) setDevices(all.filter((d) => d.kind === 'videoinput'))
      })
      .catch((e: Error) => {
        if (!alive) return
        if (deviceId && e.name === 'OverconstrainedError') { setDeviceId(''); return } // cámara guardada ya no está
        setCamError(e.name === 'NotAllowedError' ? 'Permiso de cámara denegado.' : `No se pudo abrir la cámara: ${e.message}`)
      })
    return () => { alive = false; stream?.getTracks().forEach((t) => t.stop()) }
  }, [deviceId])

  // Loop de captura: solo mientras graba y si no hay un frame en vuelo.
  useEffect(() => {
    if (!running) return
    let encoding = false
    const id = setInterval(() => {
      const v = video.current, c = canvas.current
      if (encoding || busy() || !v || !c || v.readyState < 2 || !v.videoWidth) return
      c.width = FRAME_W
      c.height = Math.round((v.videoHeight * FRAME_W) / v.videoWidth)
      c.getContext('2d')!.drawImage(v, 0, 0, c.width, c.height)
      encoding = true
      c.toBlob((b) => { encoding = false; if (b) sendFrame(b) }, 'image/jpeg', 0.75)
    }, TICK_MS)
    return () => clearInterval(id)
  }, [running, sendFrame, busy])

  function pickDevice(id: string) {
    setDeviceId(id)
    localStorageSet('cam-device', id)
  }

  function clickVideo(e: React.MouseEvent<HTMLDivElement>) {
    if (!marking) return
    const r = e.currentTarget.getBoundingClientRect()
    const next: Corners = [...marking, [(e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height]]
    if (next.length < 4) return setMarking(next)
    setMarking(null); setManual(next); onCorners(next)
  }

  function autoCorners() {
    setMarking(null); setManual(null); onCorners(null)
  }

  const shown = marking ?? frame?.corners ?? manual
  const status = !running ? null
    : frame?.needCorners ? 'No encuentro el tablero: marcá las esquinas o mové la cámara.'
    : frame?.warming ? 'Estabilizando…'
    : frame?.hand ? 'Mano sobre el tablero'
    : frame ? `Viendo el tablero · ${frame.ms} ms/frame`
    : 'Esperando al modelo…'

  return (
    <div className="cam-live">
      <div className={`cam-video${marking ? ' is-marking' : ''}`} onClick={clickVideo}>
        <video ref={video} muted playsInline />
        {shown && shown.length > 0 && (
          <svg viewBox="0 0 1 1" preserveAspectRatio="none" aria-hidden="true">
            {shown.length === 4 && <polygon points={shown.map((p) => p.join(',')).join(' ')} />}
            {shown.map(([x, y], i) => (
              <g key={i}>
                <circle cx={x} cy={y} r="0.012" />
                <text x={x + 0.015} y={y - 0.015}>{CORNER_NAMES[i]}</text>
              </g>
            ))}
          </svg>
        )}
        {marking && <p className="cam-hint">Clickeá la esquina <b>{CORNER_NAMES[marking.length]}</b></p>}
        {camError && <p className="cam-hint is-error">{camError}</p>}
      </div>
      <canvas ref={canvas} hidden />

      <div className="cam-bar">
        <select value={deviceId} onChange={(e) => pickDevice(e.target.value)} aria-label="Cámara">
          {!deviceId && <option value="">Cámara por defecto</option>}
          {devices.map((d, i) => <option key={d.deviceId} value={d.deviceId}>{d.label || `Cámara ${i + 1}`}</option>)}
        </select>
        <button onClick={() => setMarking(marking ? null : [])}>{marking ? 'Cancelar' : 'Marcar esquinas'}</button>
        <button onClick={autoCorners} disabled={!manual && !marking}>Auto</button>
      </div>
      {status && <p className="cam-status">{status}</p>}
    </div>
  )
}

function localStorageGet(k: string): string | null {
  try { return localStorage.getItem(k) } catch { return null }
}
function localStorageSet(k: string, v: string) {
  try { localStorage.setItem(k, v) } catch { /* modo privado */ }
}
