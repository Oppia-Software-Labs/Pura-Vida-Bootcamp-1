import {
  Gift,
  LoaderCircle,
  Plus,
  RefreshCw,
  TriangleAlert,
} from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  type AccountInfo,
  BASE_RESERVE_XLM,
  formatXlm,
  maxSendable,
} from '@/lib/account'
import { LOAD_ERROR } from '@/hooks/useAccount'
import { type MateAsset, TOKENS } from '@/lib/assets'

type Props = {
  info: AccountInfo | null
  loading: boolean
  error: string
  refreshing: boolean
  funding: boolean
  /** Código del activo que se está habilitando, o null. */
  enabling: string | null
  onRefresh: () => void
  onFund: () => void
  onEnable: (asset: MateAsset) => void
}

export function AccountBalance({
  info,
  loading,
  error,
  refreshing,
  funding,
  enabling,
  onRefresh,
  onFund,
  onEnable,
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
        <>
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
                  {formatXlm(maxSendable(info))} XLM
                </span>
                . El resto ({formatXlm(info.reserved)} XLM) es la reserva mínima
                de la cuenta.
              </p>
            </div>
            <Button
              variant="outline"
              size="icon-lg"
              onClick={onRefresh}
              disabled={refreshing}
              aria-label="Actualizar saldo y movimientos"
            >
              <RefreshCw className={refreshing ? 'animate-spin' : undefined} />
            </Button>
          </div>

          <div className="grid gap-2 border-t pt-3">
            <p className="text-xs font-medium text-muted-foreground">
              Dólares digitales
            </p>
            <ul className="flex flex-wrap gap-2">
              {TOKENS.map((asset) => {
                const balance = info.tokens[asset.code]
                return (
                  <li key={asset.code}>
                    {balance === undefined ? (
                      <Button
                        variant="outline"
                        size="lg"
                        onClick={() => onEnable(asset)}
                        disabled={enabling !== null}
                      >
                        {enabling === asset.code ? (
                          <LoaderCircle className="animate-spin" />
                        ) : (
                          <Plus />
                        )}
                        Aceptar {asset.code}
                      </Button>
                    ) : (
                      <span className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-muted px-3 text-sm tabular-nums">
                        <span className="font-semibold">
                          {formatXlm(balance)}
                        </span>
                        <span className="text-muted-foreground">
                          {asset.code}
                        </span>
                      </span>
                    )}
                  </li>
                )
              })}
            </ul>
            <p className="text-xs text-pretty text-muted-foreground">
              En Stellar hay que aceptar un activo antes de poder recibirlo.
              Cada uno que aceptás suma {formatXlm(BASE_RESERVE_XLM)} XLM a la
              reserva.
            </p>
          </div>
        </>
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
            {error === LOAD_ERROR && (
              <Button variant="outline" size="sm" onClick={onRefresh}>
                Reintentar
              </Button>
            )}
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
