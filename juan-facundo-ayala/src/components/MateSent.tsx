import type { RefObject } from 'react'
import { CircleCheck, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { AssetCode } from '@/lib/assets'
import { explorerTxUrl, shortAddress } from '@/lib/config'
import { formatXlmExact } from '@/lib/account'

export type Sent = {
  hash: string
  amount: number
  asset: AssetCode
  to: string
  message: string
  /** Cuánto se pagó con XLM para que la red lo convirtiera al activo. */
  converted: 'todo' | 'parte' | 'nada'
  /** Aporte al fondo yerbatero que viajó en la misma transacción. */
  share: number
}

type Props = {
  sent: Sent
  /** Recibe el foco al mostrarse, para que lo anuncie un lector de pantalla. */
  titleRef: RefObject<HTMLParagraphElement | null>
  onAgain: () => void
}

/** Resultado de un envío: qué llegó, a quién, y el link al comprobante. */
export function MateSent({ sent, titleRef, onAgain }: Props) {
  return (
    <div className="grid gap-4">
      <div
        role="status"
        className="grid animate-in justify-items-start gap-1 rounded-lg bg-accent p-4 text-accent-foreground duration-300 fade-in zoom-in-95 motion-reduce:animate-none"
      >
        <CircleCheck className="size-6" aria-hidden="true" />
        <p
          ref={titleRef}
          tabIndex={-1}
          className="font-heading text-lg font-semibold outline-none"
        >
          ¡Mate convidado! Pura vida.
        </p>
        <p className="text-sm">
          Le llegaron {formatXlmExact(sent.amount)} {sent.asset} a{' '}
          <span className="font-mono">{shortAddress(sent.to)}</span>.
          {sent.converted === 'todo' &&
            ' Pagaste con XLM y la red lo convirtió en el camino.'}
          {sent.converted === 'parte' &&
            ' Una parte la pagaste con XLM y la red la convirtió en el camino.'}
        </p>
        {sent.share > 0 && (
          <p className="text-sm">
            Además sumaste {formatXlmExact(sent.share)} {sent.asset} al fondo
            yerbatero de esta demo, en la misma transacción.
          </p>
        )}
        {sent.message && <p className="text-sm italic">“{sent.message}”</p>}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button onClick={onAgain}>Convidar otro</Button>
        <Button variant="outline" asChild>
          <a href={explorerTxUrl(sent.hash)} target="_blank" rel="noreferrer">
            Ver comprobante
            <ExternalLink data-icon="inline-end" />
          </a>
        </Button>
      </div>
    </div>
  )
}
