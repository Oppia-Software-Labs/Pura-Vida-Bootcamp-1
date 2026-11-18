import { useEffect, useState } from 'react'

/** QR del link para pedir un mate: quien lo escanea abre el formulario ya cargado. */
export function MateQr({ link }: { link: string }) {
  const [src, setSrc] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    import('qrcode')
      .then((QRCode) =>
        QRCode.toDataURL(link, {
          margin: 2,
          width: 360,
          errorCorrectionLevel: 'M',
        }),
      )
      .then((url) => {
        if (active) setSrc(url)
      })
      .catch(() => {
        if (active) setSrc(null)
      })
    return () => {
      active = false
    }
  }, [link])

  return (
    <figure className="grid justify-items-center gap-2 rounded-xl border bg-muted/40 p-4">
      {src ? (
        <img
          src={src}
          width={180}
          height={180}
          alt="Código QR con el link para que te conviden un mate"
          className="rounded-lg"
        />
      ) : (
        <div className="size-[180px] rounded-lg bg-muted" aria-hidden="true" />
      )}
      <figcaption className="text-center text-sm text-muted-foreground">
        Mostralo o imprimilo: quien lo escanea abre el formulario con tu
        dirección ya cargada.
      </figcaption>
    </figure>
  )
}
