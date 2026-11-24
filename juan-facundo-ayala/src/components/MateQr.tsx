import { useEffect, useId, useState } from 'react'
import { Download, Smartphone, Wallet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { buildSep7PayUri } from '@/lib/link'

type Mode = 'camara' | 'wallet'

const MODES: {
  value: Mode
  label: string
  icon: typeof Smartphone
  caption: string
  alt: string
  file: string
}[] = [
  {
    value: 'camara',
    label: 'Con la cámara',
    icon: Smartphone,
    caption:
      'Quien lo escanea con la cámara del celular abre esta app con tu dirección ya cargada.',
    alt: 'Código QR con el link para que te conviden un mate',
    file: 'mate-stellar-qr.png',
  },
  {
    value: 'wallet',
    label: 'Con una wallet',
    icon: Wallet,
    caption:
      'Pedido de pago estándar de Stellar (SEP-7), en Testnet. Una wallet compatible lo escanea y abre el pago a tu dirección.',
    alt: 'Código QR con un pedido de pago SEP-7 a tu dirección',
    file: 'mate-stellar-qr-wallet.png',
  },
]

type Props = {
  /** Link a la app con tu dirección cargada. */
  link: string
  /** Tu dirección, para el pedido de pago SEP-7. */
  address: string
}

/** QR para cobrar: uno abre la app y el otro le habla directo a una wallet. */
export function MateQr({ link, address }: Props) {
  const id = useId()
  const [mode, setMode] = useState<Mode>('camara')
  const [qr, setQr] = useState<{ content: string; src: string } | null>(null)
  const current = MODES.find((option) => option.value === mode) ?? MODES[0]
  const content = mode === 'camara' ? link : buildSep7PayUri(address)
  const src = qr && qr.content === content ? qr.src : null

  useEffect(() => {
    let active = true
    import('qrcode')
      .then((QRCode) =>
        QRCode.toDataURL(content, {
          margin: 2,
          width: 360,
          errorCorrectionLevel: 'M',
        }),
      )
      .then((url) => {
        if (active) setQr({ content, src: url })
      })
      .catch(() => {
        if (active) setQr(null)
      })
    return () => {
      active = false
    }
  }, [content])

  return (
    <figure className="grid justify-items-center gap-3 rounded-xl border bg-muted/40 p-4">
      <div
        role="group"
        aria-labelledby={`${id}-modo`}
        className="grid w-full grid-cols-2 gap-2"
      >
        <span id={`${id}-modo`} className="sr-only">
          Para quién es el QR
        </span>
        {MODES.map((option) => {
          const selected = option.value === mode
          const Icon = option.icon
          return (
            <Button
              key={option.value}
              type="button"
              size="sm"
              variant={selected ? 'default' : 'outline'}
              aria-pressed={selected}
              onClick={() => setMode(option.value)}
            >
              <Icon data-icon="inline-start" />
              {option.label}
            </Button>
          )
        })}
      </div>
      {src ? (
        <img
          src={src}
          width={180}
          height={180}
          alt={current.alt}
          className="rounded-lg"
        />
      ) : (
        <div className="size-[180px] rounded-lg bg-muted" aria-hidden="true" />
      )}
      <figcaption
        className="text-center text-sm text-pretty text-muted-foreground"
        aria-live="polite"
      >
        {current.caption}
      </figcaption>
      {src && (
        <Button variant="outline" size="sm" asChild>
          <a href={src} download={current.file}>
            <Download />
            Guardar QR
          </a>
        </Button>
      )}
    </figure>
  )
}
