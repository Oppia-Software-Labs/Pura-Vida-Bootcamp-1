import { useRef, useState } from 'react'
import { toPng } from 'html-to-image'
import logoBuzon from '../assets/logo-buzon.png'
import type { TipJarDraft } from '../hooks/useTipJarDraft'
import { TipJarQr } from './TipJarQr'

type TipJarPreviewProps = {
  draft: TipJarDraft
  address: string | null
}

export function TipJarPreview({ draft, address }: TipJarPreviewProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [downloadMessage, setDownloadMessage] = useState('')

  const creatorName = draft.creatorName.trim()
  const message = draft.message.trim()
  const title = creatorName
    ? `Buzón de ${creatorName}`
    : 'Mi buzón de propinas'

  async function handleDownload() {
    const card = cardRef.current

    if (!card) {
      return
    }

    setIsExporting(true)
    setDownloadMessage('')

    try {
      const image = await toPng(card, {
        pixelRatio: 2,
        filter: (node) => !node.classList?.contains('screen-only'),
      })

      const link = document.createElement('a')
      link.download = 'buzon-de-propinas-stellar.png'
      link.href = image
      link.click()

      setDownloadMessage('La descarga se inició.')
    } catch {
      setDownloadMessage('No se pudo generar la imagen. Volvé a intentar.')
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <section className="preview" aria-labelledby="preview-title">
      <h2 id="preview-title">Vista previa de tu buzón</h2>

      <div className="tip-card" ref={cardRef}>
        <img src={logoBuzon} alt="" width="136" height="136" />
        <h3>{title}</h3>
        <p>{message || '¡Gracias por apoyar lo que hago!'}</p>

        {address ? (
          <TipJarQr key={address} address={address} />
        ) : (
          <div className="qr-placeholder">
            Conectá tu wallet para generar el código QR.
          </div>
        )}
      </div>

      {address && (
        <div className="download-actions">
          <button
            className="copy-button"
            type="button"
            onClick={handleDownload}
            disabled={isExporting}
          >
            <svg
              aria-hidden="true"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 3v12m-4-4 4 4 4-4M4 16v4h16v-4" />
            </svg>
            {isExporting ? 'Generando imagen…' : 'Descargar tarjeta'}
          </button>

          <p className="copy-status" role="status">
            {downloadMessage}
          </p>
        </div>
      )}
    </section>
  )
}