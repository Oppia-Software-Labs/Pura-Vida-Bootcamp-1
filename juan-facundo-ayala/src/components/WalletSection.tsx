import { type ReactNode, useState } from 'react'
import {
  Check,
  Copy,
  Link2,
  LoaderCircle,
  LogOut,
  QrCode,
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
import { explorerAccountUrl, NETWORK_NAME, shortAddress } from '@/lib/config'
import { MateQr } from '@/components/MateQr'
import { buildMateLink } from '@/lib/link'

const SUPPORTED_WALLETS = [
  'Varial (ex Freighter)',
  'xBull',
  'Albedo',
  'Lobstr',
  'Hana',
  'Rabet',
]

type Copied = 'address' | 'link' | null

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
  const [copied, setCopied] = useState<Copied>(null)
  const [showQr, setShowQr] = useState(false)

  const copy = async (what: Exclude<Copied, null>, text: string) => {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      // Sin permiso para el portapapeles no se confirma nada.
      return
    }
    setCopied(what)
    setTimeout(() => setCopied(null), 1500)
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
                  Conectada · {wrongNetwork ? 'otra red' : NETWORK_NAME}
                </p>
                <a
                  className="rounded-sm font-mono text-sm underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/50"
                  href={explorerAccountUrl(address)}
                  target="_blank"
                  rel="noreferrer"
                  title={address}
                >
                  {shortAddress(address)}
                  <span className="sr-only">
                    {' '}
                    (ver tu cuenta en el explorador)
                  </span>
                </a>
              </div>
              <Button
                variant="outline"
                size="lg"
                onClick={() => copy('address', address)}
                aria-label={
                  copied === 'address'
                    ? 'Dirección copiada'
                    : 'Copiar dirección completa'
                }
              >
                {copied === 'address' ? <Check /> : <Copy />}
                {copied === 'address' ? 'Copiada' : 'Copiar'}
              </Button>
            </div>
            {children}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Button
                variant="outline"
                size="lg"
                onClick={() =>
                  copy(
                    'link',
                    buildMateLink(
                      window.location.origin + window.location.pathname,
                      address,
                    ),
                  )
                }
              >
                {copied === 'link' ? <Check /> : <Link2 />}
                {copied === 'link'
                  ? 'Link copiado'
                  : 'Link para que me conviden'}
              </Button>
              <Button
                variant="outline"
                size="lg"
                aria-expanded={showQr}
                onClick={() => setShowQr((value) => !value)}
              >
                <QrCode />
                {showQr ? 'Ocultar QR' : 'QR para cobrar'}
              </Button>
              <Button
                variant="ghost"
                size="lg"
                className="text-muted-foreground"
                onClick={onDisconnect}
              >
                <LogOut />
                Desconectar
              </Button>
            </div>
            {showQr && (
              <MateQr
                address={address}
                link={buildMateLink(
                  window.location.origin + window.location.pathname,
                  address,
                )}
              />
            )}
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
