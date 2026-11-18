import { type ReactNode, useState } from 'react'
import {
  Check,
  Copy,
  LoaderCircle,
  LogOut,
  TriangleAlert,
  Wallet,
} from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { NETWORK_NAME, shortAddress } from '@/lib/config'

const SUPPORTED_WALLETS = ['Varial', 'xBull', 'Albedo', 'Lobstr', 'y más']

type Props = {
  address: string | null
  connecting: boolean
  error: string
  wrongNetwork: boolean
  onConnect: () => void
  onDisconnect: () => void
  /** Contenido extra de la cuenta conectada (por ejemplo, el saldo). */
  children?: ReactNode
}

export function WalletSection({
  address,
  connecting,
  error,
  wrongNetwork,
  onConnect,
  onDisconnect,
  children,
}: Props) {
  const [copied, setCopied] = useState(false)

  const copyAddress = async () => {
    if (!address) return
    await navigator.clipboard.writeText(address)
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  return (
    <Card className="shadow-sm [--card-spacing:--spacing(5)]">
      <CardHeader>
        <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          Paso 1
        </p>
        <CardTitle className="text-xl">Tu wallet</CardTitle>
        <CardDescription>
          {address
            ? 'Esta es la cuenta desde la que vas a convidar.'
            : 'La app nunca ve tu clave: cada envío lo aprobás vos desde la wallet.'}
        </CardDescription>
      </CardHeader>

      <CardContent className="grid gap-4">
        {!address ? (
          <>
            <Button
              className="h-11 w-full text-base"
              onClick={onConnect}
              disabled={connecting}
            >
              {connecting ? (
                <LoaderCircle
                  className="animate-spin"
                  data-icon="inline-start"
                />
              ) : (
                <Wallet data-icon="inline-start" />
              )}
              {connecting ? 'Abriendo wallets…' : 'Conectar wallet'}
            </Button>
            <ul
              className="flex flex-wrap gap-1.5"
              aria-label="Wallets compatibles"
            >
              {SUPPORTED_WALLETS.map((name) => (
                <li key={name}>
                  <Badge variant="secondary">{name}</Badge>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between gap-3 rounded-lg bg-muted px-3 py-2.5">
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 text-xs font-medium text-primary">
                  <span
                    className="size-2 rounded-full bg-primary"
                    aria-hidden="true"
                  />
                  Conectada · {NETWORK_NAME}
                </p>
                <p className="font-mono text-sm" title={address}>
                  {shortAddress(address)}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={copyAddress}
                aria-label="Copiar dirección completa"
              >
                {copied ? <Check /> : <Copy />}
                {copied ? 'Copiada' : 'Copiar'}
              </Button>
            </div>
            {children}
            <Button
              variant="ghost"
              size="sm"
              className="justify-self-start text-muted-foreground"
              onClick={onDisconnect}
            >
              <LogOut />
              Desconectar
            </Button>
          </>
        )}

        {wrongNetwork && (
          <Alert variant="destructive">
            <TriangleAlert />
            <AlertDescription>
              Tu wallet está en otra red. Cambiala a {NETWORK_NAME} para poder
              firmar.
            </AlertDescription>
          </Alert>
        )}
        {error && (
          <Alert variant="destructive">
            <TriangleAlert />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  )
}
