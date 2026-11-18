import { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'

type TipJarQrProps = {
    address: string
}

function CopyIcon() {
    return (
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
            <rect x="8" y="8" width="12" height="12" rx="2" />
            <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
        </svg>
    )
}

export function TipJarQr({ address }: TipJarQrProps) {
    const [copyMessage, setCopyMessage] = useState('')

    async function handleCopy() {
        try {
            await navigator.clipboard.writeText(address)
            setCopyMessage('Dirección copiada.')
        } catch {
            setCopyMessage('No se pudo copiar. Podés seleccionar la dirección y copiarla.')
        }
    }

    return (
        <>
            <QRCodeSVG
                className="tip-qr"
                value={address}
                size={168}
                marginSize={4}
                title="Código QR de la dirección pública de Stellar"
            />

            <div className="wallet-address">
                <strong>Dirección pública de Stellar</strong>
                <code>{address}</code>
            </div>

            <button
                className="copy-button screen-only"
                type="button"
                onClick={handleCopy}
            >
                <CopyIcon />
                Copiar dirección
            </button>

            <p className="copy-status screen-only" role="status">
                {copyMessage}
            </p>
        </>
    )
}