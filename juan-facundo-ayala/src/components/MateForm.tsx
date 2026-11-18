import { type FormEvent, useId, useState } from 'react'
import {
  CircleCheck,
  ExternalLink,
  LoaderCircle,
  Send,
  TriangleAlert,
} from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { type AccountInfo, formatXlm } from '@/lib/account'
import { explorerTxUrl, shortAddress } from '@/lib/config'
import {
  buildMateTx,
  DEMO_RECIPIENT,
  FEE_MARGIN_XLM,
  horizonErrorMessage,
  isValidAddress,
  MEMO_MAX_BYTES,
  memoBytes,
  submitMateTx,
} from '@/lib/mate'
import { signWithWallet, walletErrorMessage } from '@/lib/wallet'

const QUICK_AMOUNTS = [1, 5, 10]

type Step = 'idle' | 'building' | 'signing' | 'submitting'

const STEP_LABEL: Record<Exclude<Step, 'idle'>, string> = {
  building: 'Preparando el envío…',
  signing: 'Aprobalo en tu wallet…',
  submitting: 'Enviando a la red…',
}

type Sent = { hash: string; amount: number; to: string }

type Props = {
  address: string | null
  account: AccountInfo | null
  /** Se llama después de un envío exitoso, para refrescar saldo e historial. */
  onSent: () => void
}

export function MateForm({ address, account, onSent }: Props) {
  const id = useId()
  const [to, setTo] = useState('')
  const [amountText, setAmountText] = useState('1')
  const [message, setMessage] = useState('')
  const [showErrors, setShowErrors] = useState(false)
  const [step, setStep] = useState<Step>('idle')
  const [error, setError] = useState('')
  const [sent, setSent] = useState<Sent | null>(null)

  const ready = Boolean(address && account?.funded)
  const busy = step !== 'idle'
  const destination = to.trim()
  const amount = Number(amountText.replace(',', '.'))
  const maxAmount = Math.max(0, (account?.available ?? 0) - FEE_MARGIN_XLM)
  const usedBytes = memoBytes(message.trim())

  const toError = !destination
    ? 'Pegá la dirección de quien recibe.'
    : !isValidAddress(destination)
      ? 'Esa no es una dirección de Stellar válida (empiezan con G y tienen 56 caracteres).'
      : destination === address
        ? 'No podés convidarte a vos mismo.'
        : ''
  const amountError =
    !Number.isFinite(amount) || amount <= 0
      ? 'Ingresá un monto mayor a 0.'
      : amount > maxAmount
        ? `Podés enviar hasta ${formatXlm(maxAmount)} XLM.`
        : ''
  const messageError =
    usedBytes > MEMO_MAX_BYTES ? 'El mensaje es demasiado largo.' : ''
  const invalid = Boolean(toError || amountError || messageError)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!address || busy) return
    setShowErrors(true)
    setError('')
    if (invalid) return

    try {
      setStep('building')
      const xdr = await buildMateTx({
        from: address,
        to: destination,
        amount,
        message,
      })
      setStep('signing')
      const signedXdr = await signWithWallet(xdr, address)
      setStep('submitting')
      const hash = await submitMateTx(signedXdr)
      setSent({ hash, amount, to: destination })
      setMessage('')
      setShowErrors(false)
      onSent()
    } catch (err) {
      setError(
        horizonErrorMessage(err) ||
          walletErrorMessage(err) ||
          'Cerraste la wallet sin firmar.',
      )
    } finally {
      setStep('idle')
    }
  }

  return (
    <Card className="shadow-sm [--card-spacing:--spacing(5)]">
      <CardHeader>
        <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          Paso 2
        </p>
        <CardTitle className="text-xl">Convidá un mate</CardTitle>
        <CardDescription>
          {ready
            ? 'Elegí a quién, cuánto y dejale un mensaje.'
            : address
              ? 'Activá tu cuenta con XLM de prueba para poder enviar.'
              : 'Conectá tu wallet para poder enviar.'}
        </CardDescription>
      </CardHeader>

      <CardContent>
        {sent ? (
          <div className="grid gap-4">
            <div className="grid justify-items-start gap-1 rounded-lg bg-accent p-4 text-accent-foreground">
              <CircleCheck className="size-6" aria-hidden="true" />
              <p className="font-heading text-lg font-semibold">
                ¡Mate convidado!
              </p>
              <p className="text-sm">
                Enviaste {formatXlm(sent.amount)} XLM a{' '}
                <span className="font-mono">{shortAddress(sent.to)}</span>.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => setSent(null)}>Convidar otro</Button>
              <Button variant="outline" asChild>
                <a
                  href={explorerTxUrl(sent.hash)}
                  target="_blank"
                  rel="noreferrer"
                >
                  Ver comprobante
                  <ExternalLink data-icon="inline-end" />
                </a>
              </Button>
            </div>
          </div>
        ) : (
          <form className="grid gap-5" onSubmit={handleSubmit} noValidate>
            <fieldset className="grid gap-5" disabled={!ready || busy}>
              <div className="grid gap-2">
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor={`${id}-to`}>Para</Label>
                  <Button
                    type="button"
                    variant="link"
                    size="xs"
                    className="h-auto p-0"
                    onClick={() => setTo(DEMO_RECIPIENT)}
                  >
                    Usar cuenta de demo
                  </Button>
                </div>
                <Input
                  id={`${id}-to`}
                  className="h-10 font-mono"
                  placeholder="G…"
                  autoComplete="off"
                  spellCheck={false}
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  aria-invalid={showErrors && Boolean(toError)}
                  aria-describedby={`${id}-to-error`}
                />
                <p
                  id={`${id}-to-error`}
                  className="text-sm text-destructive empty:hidden"
                  role="alert"
                >
                  {showErrors ? toError : ''}
                </p>
              </div>

              <div className="grid gap-2">
                <Label htmlFor={`${id}-amount`}>Cuánto (XLM)</Label>
                <div className="flex flex-wrap gap-2">
                  {QUICK_AMOUNTS.map((value) => (
                    <Button
                      key={value}
                      type="button"
                      variant={amount === value ? 'default' : 'outline'}
                      className="h-10 min-w-12 tabular-nums"
                      aria-pressed={amount === value}
                      onClick={() => setAmountText(String(value))}
                    >
                      {value}
                    </Button>
                  ))}
                  <Input
                    id={`${id}-amount`}
                    className="h-10 min-w-24 flex-1 tabular-nums"
                    inputMode="decimal"
                    autoComplete="off"
                    value={amountText}
                    onChange={(e) => setAmountText(e.target.value)}
                    aria-invalid={showErrors && Boolean(amountError)}
                    aria-describedby={`${id}-amount-error`}
                  />
                </div>
                <p
                  id={`${id}-amount-error`}
                  className="text-sm text-destructive empty:hidden"
                  role="alert"
                >
                  {showErrors ? amountError : ''}
                </p>
              </div>

              <div className="grid gap-2">
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor={`${id}-message`}>Mensaje (opcional)</Label>
                  <span
                    className={
                      messageError
                        ? 'text-xs text-destructive tabular-nums'
                        : 'text-xs text-muted-foreground tabular-nums'
                    }
                  >
                    {usedBytes}/{MEMO_MAX_BYTES}
                  </span>
                </div>
                <Input
                  id={`${id}-message`}
                  className="h-10"
                  placeholder="Gracias por la mano"
                  autoComplete="off"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  aria-invalid={Boolean(messageError)}
                  aria-describedby={`${id}-message-hint`}
                />
                <p
                  id={`${id}-message-hint`}
                  className={
                    messageError
                      ? 'text-sm text-destructive'
                      : 'text-sm text-muted-foreground'
                  }
                >
                  {messageError || 'Queda público en la red, junto al envío.'}
                </p>
              </div>
            </fieldset>

            {error && (
              <Alert variant="destructive">
                <TriangleAlert />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="h-11 w-full text-base"
              disabled={!ready || busy}
            >
              {busy ? (
                <LoaderCircle
                  className="animate-spin"
                  data-icon="inline-start"
                />
              ) : (
                <Send data-icon="inline-start" />
              )}
              {busy
                ? STEP_LABEL[step]
                : amount > 0 && Number.isFinite(amount)
                  ? `Convidar ${formatXlm(amount)} XLM`
                  : 'Convidar'}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  )
}
