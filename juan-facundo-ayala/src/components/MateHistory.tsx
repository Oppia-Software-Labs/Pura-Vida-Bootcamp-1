import { useEffect, useState } from 'react'
import { ArrowDownLeft, ArrowUpRight, ExternalLink } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { formatXlmExact } from '@/lib/account'
import { explorerTxUrl, shortAddress } from '@/lib/config'
import { getRecentMates, type MateRecord } from '@/lib/history'
import { YERBA_FUND } from '@/lib/mate'

const dateFormatter = new Intl.DateTimeFormat('es-AR', {
  day: 'numeric',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
})

type State = {
  /** Clave (cuenta + versión) a la que pertenecen los datos. */
  key: string
  records: MateRecord[] | null
  failed: boolean
}

type Props = {
  address: string
  /** Cambia cuando puede haber movimientos nuevos, para recargar la lista. */
  version: number
}

export function MateHistory({ address, version }: Props) {
  const key = `${address}:${version}`
  const [state, setState] = useState<State>({
    key: '',
    records: null,
    failed: false,
  })

  useEffect(() => {
    let cancelled = false
    getRecentMates(address)
      .then((records) => {
        if (!cancelled) setState({ key, records, failed: false })
      })
      .catch(() => {
        if (!cancelled) {
          setState((prev) => ({
            key,
            // Solo se conserva la lista si es de esta misma cuenta.
            records: prev.key.startsWith(`${address}:`) ? prev.records : null,
            failed: true,
          }))
        }
      })
    return () => {
      cancelled = true
    }
  }, [address, key])

  // Mientras recarga tras un envío se sigue mostrando la lista anterior.
  const sameAccount = state.key.startsWith(`${address}:`)
  const records = sameAccount ? state.records : null
  const loading = state.key !== key && records === null

  return (
    <Card className="shadow-sm [--card-spacing:--spacing(5)]">
      <CardHeader>
        <CardTitle className="text-xl">Últimos mates</CardTitle>
        <CardDescription>
          Los movimientos más recientes de tu cuenta.
        </CardDescription>
      </CardHeader>

      <CardContent>
        {loading && (
          <div
            className="grid gap-3"
            aria-busy="true"
            aria-label="Cargando movimientos"
          >
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-11 w-full" />
          </div>
        )}

        {sameAccount && state.failed && (
          <p className="text-sm text-destructive" role="alert">
            No pudimos cargar los movimientos. Revisá tu conexión.
          </p>
        )}

        {records?.length === 0 && !state.failed && (
          <p className="text-sm text-muted-foreground">
            Todavía no hay movimientos. Tu primer mate va a aparecer acá.
          </p>
        )}

        {records && records.length > 0 && (
          <ul className="divide-y">
            {records.map((record) => {
              const sent = record.direction === 'sent'
              // El aporte se muestra sin dirección: va siempre al fondo.
              const toFund = sent && record.counterparty === YERBA_FUND
              // Crear una cuenta (Friendbot o un primer envío) no es un mate.
              const label = toFund
                ? 'Aporte al fondo yerbatero'
                : record.kind === 'activation'
                  ? sent
                    ? 'Activaste la cuenta de '
                    : 'Cuenta activada por '
                  : sent
                    ? 'Convidaste a '
                    : 'Te convidó '
              return (
                <li
                  key={record.id}
                  className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <span
                    aria-hidden="true"
                    className={
                      sent
                        ? 'flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground'
                        : 'flex size-8 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground'
                    }
                  >
                    {sent ? (
                      <ArrowUpRight className="size-4" />
                    ) : (
                      <ArrowDownLeft className="size-4" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium">
                      {label}
                      {!toFund && (
                        <span className="font-mono font-normal whitespace-nowrap">
                          {shortAddress(record.counterparty)}
                        </span>
                      )}
                    </p>
                    <p className="truncate text-sm text-muted-foreground">
                      {record.message && !toFund
                        ? `“${record.message}” · `
                        : ''}
                      {dateFormatter.format(record.date)}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-semibold tabular-nums">
                      {sent ? '−' : '+'}
                      {formatXlmExact(record.amount)}
                      <span className="font-normal text-muted-foreground">
                        {' '}
                        {record.asset}
                      </span>
                    </p>
                    <a
                      href={explorerTxUrl(record.hash)}
                      target="_blank"
                      rel="noreferrer"
                      className="-my-2 inline-flex items-center gap-1 py-2 text-xs text-primary underline-offset-4 hover:underline"
                      aria-label="Ver comprobante en el explorador"
                    >
                      Ver
                      <ExternalLink className="size-3" aria-hidden="true" />
                    </a>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
