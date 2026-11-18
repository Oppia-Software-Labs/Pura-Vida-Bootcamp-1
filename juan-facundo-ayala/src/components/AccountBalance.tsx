import { Gift, LoaderCircle, RefreshCw, TriangleAlert } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { type AccountInfo, formatXlm } from '@/lib/account'

type Props = {
  info: AccountInfo | null
  loading: boolean
  error: string
  refreshing: boolean
  funding: boolean
  onRefresh: () => void
  onFund: () => void
}

export function AccountBalance({
  info,
  loading,
  error,
  refreshing,
  funding,
  onRefresh,
  onFund,
}: Props) {
  if (loading) {
    return (
      <div className="grid gap-2" aria-busy="true" aria-label="Cargando saldo">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-9 w-44" />
        <Skeleton className="h-4 w-56" />
      </div>
    )
  }

  return (
    <div className="grid gap-3">
      {info?.funded && (
        <div className="flex items-start justify-between gap-3">
          <div className="grid gap-0.5">
            <p className="text-xs font-medium text-muted-foreground">Saldo</p>
            <p className="font-heading text-3xl leading-tight font-semibold tabular-nums">
              {formatXlm(info.balance)}{' '}
              <span className="font-sans text-base font-medium text-muted-foreground">
                XLM
              </span>
            </p>
            <p className="text-sm text-muted-foreground">
              Podés enviar hasta{' '}
              <span className="font-medium text-foreground tabular-nums">
                {formatXlm(info.available)} XLM
              </span>
              . El resto ({formatXlm(info.reserved)} XLM) es la reserva mínima
              de la cuenta.
            </p>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={onRefresh}
            disabled={refreshing}
            aria-label="Actualizar saldo"
          >
            <RefreshCw className={refreshing ? 'animate-spin' : undefined} />
          </Button>
        </div>
      )}

      {info && !info.funded && (
        <div className="grid gap-3 rounded-lg bg-accent p-3 text-accent-foreground">
          <div className="grid gap-0.5">
            <p className="font-medium">Tu cuenta todavía no está activa</p>
            <p className="text-sm">
              En Testnet se activa gratis: Friendbot te manda 10.000 XLM de
              prueba, sin valor real.
            </p>
          </div>
          <Button onClick={onFund} disabled={funding} className="h-10 w-full">
            {funding ? (
              <LoaderCircle className="animate-spin" data-icon="inline-start" />
            ) : (
              <Gift data-icon="inline-start" />
            )}
            {funding ? 'Pidiendo XLM a Friendbot…' : 'Pedir XLM de prueba'}
          </Button>
        </div>
      )}

      {error && (
        <Alert variant="destructive">
          <TriangleAlert />
          <AlertDescription className="flex flex-wrap items-center justify-between gap-2">
            {error}
            <Button variant="outline" size="sm" onClick={onRefresh}>
              Reintentar
            </Button>
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
