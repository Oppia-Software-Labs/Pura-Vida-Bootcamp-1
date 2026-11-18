import { type FormEvent, useEffect, useId, useRef, useState } from 'react'
import { Link2, LoaderCircle, Send, Sprout, TriangleAlert } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { MateSent, type Sent } from '@/components/MateSent'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  type AccountInfo,
  formatXlm,
  formatXlmExact,
  maxSendable,
} from '@/lib/account'
import { type AssetCode, ASSETS, getAsset, XLM } from '@/lib/assets'
import { NETWORK_NAME, shortAddress } from '@/lib/config'
import { parseMateLink } from '@/lib/link'
import {
  buildMateTx,
  DEMO_RECIPIENT,
  horizonErrorMessage,
  isValidAddress,
  MateError,
  maxCost,
  MEMO_MAX_BYTES,
  memoBytes,
  parseAmount,
  planMate,
  quoteInXlm,
  submitMateTx,
  YERBA_SHARE,
} from '@/lib/mate'
import { signWithWallet, walletErrorMessage } from '@/lib/wallet'

// Tres montos por activo: uno bajo, uno intermedio y uno alto.
const QUICK_AMOUNTS: Record<AssetCode, number[]> = {
  XLM: [10, 100, 1000],
  USDC: [5, 100, 500],
}

type Step = 'idle' | 'building' | 'signing' | 'submitting'

const STEP_LABEL: Record<Exclude<Step, 'idle'>, string> = {
  building: 'Preparando el envío…',
  signing: 'Aprobalo en tu wallet…',
  submitting: 'Enviando a la red…',
}

const NETWORK_ERROR =
  'No pudimos conectar con la red de Stellar. Revisá tu conexión y probá de nuevo.'

/**
 * Cotización en XLM de un envío; `cost` es null si nadie ofrece el cambio.
 * `failed` avisa que no se pudo consultar.
 */
type QuoteState = { key: string; cost: number | null; failed?: boolean }

type Props = {
  address: string | null
  account: AccountInfo | null
  /** Todavía se está leyendo el saldo por primera vez. */
  accountLoading: boolean
  /** La wallet está en otra red y no va a poder firmar. */
  wrongNetwork: boolean
  /** Se llama después de un envío exitoso, para refrescar saldo e historial. */
  onSent: () => void
}

export function MateForm({
  address,
  account,
  accountLoading,
  wrongNetwork,
  onSent,
}: Props) {
  const id = useId()
  // Si la app se abrió desde un link para pedir un mate, llega precargada.
  const [link] = useState(() => parseMateLink(window.location.search))
  const [to, setTo] = useState(link?.to ?? '')
  const [assetCode, setAssetCode] = useState<AssetCode>(link?.asset ?? 'XLM')
  const [amountText, setAmountText] = useState(
    link?.amount || String(QUICK_AMOUNTS[link?.asset ?? 'XLM'][0]),
  )
  const [message, setMessage] = useState(link?.message ?? '')
  const [withYerba, setWithYerba] = useState(true)
  const [showErrors, setShowErrors] = useState(false)
  const [step, setStep] = useState<Step>('idle')
  const [error, setError] = useState('')
  const [sent, setSent] = useState<Sent | null>(null)
  const [quote, setQuote] = useState<QuoteState | null>(null)
  const sentTitle = useRef<HTMLParagraphElement>(null)
  const toInput = useRef<HTMLInputElement>(null)
  const wasSent = useRef(false)

  // Lleva el foco al resultado para que también lo anuncie un lector de
  // pantalla y, al volver, al primer campo del formulario.
  useEffect(() => {
    if (sent) sentTitle.current?.focus()
    else if (wasSent.current) toInput.current?.focus()
    wasSent.current = Boolean(sent)
  }, [sent])

  const asset = getAsset(assetCode) ?? XLM
  const isXlm = asset.issuer === null
  const ready = Boolean(address && account?.funded) && !wrongNetwork
  const busy = step !== 'idle'
  const destination = to.trim()
  const amount = parseAmount(amountText)
  const maxXlm = maxSendable(account)
  const fromLink = link !== null && destination === link.to
  const usedBytes = memoBytes(message.trim())

  // Si quien envía ya tiene el activo, paga con eso. Si no, paga con XLM y
  // la red lo convierte en el camino: hace falta cotizar cuánto cuesta.
  // El aporte yerbatero se suma arriba del mate: quien recibe cobra completo.
  const holding = account?.tokens[assetCode] ?? 0
  const plan = planMate({
    to: destination,
    asset,
    amount: amount ?? 0,
    held: holding,
    withYerba,
  })
  const share = plan.share
  const total = (amount ?? 0) + share
  const converts = amount !== null && plan.toConvert > 0
  const convertsAll =
    plan.mateConverts && (share === 0 || plan.shareConverts) && holding === 0
  const quoteKey = converts ? `${assetCode}:${plan.toConvert.toFixed(7)}` : ''

  useEffect(() => {
    if (!quoteKey || !ready) return
    const [code, value] = quoteKey.split(':')
    const target = getAsset(code)
    if (!target) return
    let cancelled = false
    // Se espera un momento para no cotizar cada tecla.
    const timer = setTimeout(() => {
      quoteInXlm(target, Number(value))
        .then((result) => {
          if (!cancelled) {
            setQuote({ key: quoteKey, cost: result ? result.cost : null })
          }
        })
        .catch(() => {
          // Sin cotización no se bloquea: se vuelve a cotizar al enviar.
          if (!cancelled) setQuote({ key: quoteKey, cost: null, failed: true })
        })
    }, 400)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [quoteKey, ready])

  const currentQuote = quote && quote.key === quoteKey ? quote : null
  const cost = currentQuote?.cost ?? null

  const toError = !destination
    ? 'Pegá la dirección de quien recibe.'
    : !isValidAddress(destination)
      ? 'Esa no es una dirección de Stellar válida (empiezan con G y tienen 56 caracteres).'
      : destination === address
        ? 'No podés convidarte a vos mismo.'
        : ''
  const amountError =
    amount === null
      ? 'Ingresá un monto mayor a 0, con hasta 7 decimales (por ejemplo, 1,5).'
      : isXlm
        ? total > maxXlm + 1e-9
          ? share > 0
            ? `Con el aporte son ${formatXlmExact(total)} XLM y podés enviar hasta ${formatXlm(maxXlm)}.`
            : `Podés enviar hasta ${formatXlm(maxXlm)} XLM.`
          : ''
        : !converts || !currentQuote || currentQuote.failed
          ? ''
          : cost === null
            ? `No te alcanzan los ${asset.code} y en este momento nadie lo cambia por XLM en la red.`
            : maxCost(cost) > maxXlm
              ? `Hacen falta unos ${formatXlm(maxCost(cost))} XLM y podés gastar hasta ${formatXlm(maxXlm)}.`
              : ''
  const messageError =
    usedBytes > MEMO_MAX_BYTES ? 'El mensaje es demasiado largo.' : ''
  const invalid = Boolean(toError || amountError || messageError)

  // Aclara con qué se paga cuando lo que llega no es XLM.
  const amountHint =
    isXlm || amount === null || !ready
      ? ''
      : !converts
        ? `Lo pagás con tus ${asset.code}: tenés ${formatXlm(holding)}.`
        : !currentQuote
          ? 'Buscando el mejor cambio…'
          : currentQuote.failed
            ? 'No pudimos cotizar el cambio ahora. Se cotiza de nuevo al enviar.'
            : cost === null
              ? ''
              : convertsAll
                ? `No tenés ${asset.code}: lo pagás con unos ${formatXlm(cost)} XLM y la red lo convierte en el camino.`
                : `Tus ${asset.code} no alcanzan para todo: el resto lo pagás con unos ${formatXlm(cost)} XLM y la red lo convierte en el camino.`

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!address || busy) return
    setShowErrors(true)
    setError('')
    if (invalid || amount === null) return

    let phase: Step = 'building'
    try {
      setStep(phase)
      const xdr = await buildMateTx({
        from: address,
        to: destination,
        asset,
        amount,
        message,
        withYerba,
      })
      phase = 'signing'
      setStep(phase)
      const signedXdr = await signWithWallet(xdr, address)
      phase = 'submitting'
      setStep(phase)
      const hash = await submitMateTx(signedXdr)
      setSent({
        hash,
        amount,
        asset: assetCode,
        to: destination,
        message: message.trim(),
        converted: !converts ? 'nada' : convertsAll ? 'todo' : 'parte',
        share,
      })
      setMessage('')
      setShowErrors(false)
      onSent()
    } catch (err) {
      // Solo durante la firma el error viene de la wallet; en los otros
      // pasos es un rechazo de Horizon o un problema de conexión.
      setError(
        horizonErrorMessage(err) ||
          (err instanceof MateError
            ? err.message
            : phase === 'signing'
              ? walletErrorMessage(err) || 'Cerraste la wallet sin firmar.'
              : NETWORK_ERROR),
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
          {wrongNetwork
            ? `Cambiá tu wallet a ${NETWORK_NAME} para poder enviar.`
            : ready
              ? 'Elegí a quién, cuánto y dejale un mensaje.'
              : !address
                ? 'Conectá tu wallet para poder enviar.'
                : !account
                  ? 'Necesitamos leer tu saldo para poder enviar.'
                  : 'Activá tu cuenta con XLM de prueba para poder enviar.'}
        </CardDescription>
      </CardHeader>

      <CardContent>
        {sent ? (
          <MateSent
            sent={sent}
            titleRef={sentTitle}
            onAgain={() => setSent(null)}
          />
        ) : (
          <form className="grid gap-5" onSubmit={handleSubmit} noValidate>
            {fromLink && (
              <Alert>
                <Link2 />
                <AlertDescription>
                  Abriste un link para convidarle un mate a{' '}
                  <span className="font-mono">{shortAddress(link.to)}</span>.
                  Revisá que sea la persona correcta antes de enviar.
                </AlertDescription>
              </Alert>
            )}
            <fieldset className="grid gap-5" disabled={busy}>
              <div className="grid gap-2">
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor={`${id}-to`}>Para</Label>
                  <Button
                    type="button"
                    variant="link"
                    size="xs"
                    className="-my-2 h-auto px-0 py-2"
                    onClick={() => setTo(DEMO_RECIPIENT)}
                  >
                    Usar cuenta de demo
                  </Button>
                </div>
                <Input
                  ref={toInput}
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
                <p
                  id={`${id}-asset`}
                  className="text-sm leading-none font-medium"
                >
                  Qué le llega
                </p>
                <div
                  role="group"
                  aria-labelledby={`${id}-asset`}
                  className="grid grid-cols-2 gap-2"
                >
                  {ASSETS.map((option) => {
                    const selected = option.code === assetCode
                    return (
                      <Button
                        key={option.code}
                        type="button"
                        variant={selected ? 'default' : 'outline'}
                        className="h-auto flex-col gap-0 py-2"
                        aria-pressed={selected}
                        onClick={() => {
                          const tier =
                            amount === null
                              ? -1
                              : QUICK_AMOUNTS[assetCode].indexOf(amount)
                          if (tier >= 0) {
                            setAmountText(
                              String(QUICK_AMOUNTS[option.code][tier]),
                            )
                          }
                          setAssetCode(option.code)
                        }}
                      >
                        <span className="font-semibold">{option.code}</span>
                        <span className="text-xs font-normal opacity-80">
                          {option.name}
                        </span>
                      </Button>
                    )
                  })}
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor={`${id}-amount`}>Cuánto ({asset.code})</Label>
                <div className="flex flex-wrap gap-2">
                  {QUICK_AMOUNTS[assetCode].map((value) => (
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
                    aria-describedby={`${id}-amount-error ${id}-amount-hint`}
                  />
                </div>
                <p
                  id={`${id}-amount-hint`}
                  className="text-sm text-pretty text-muted-foreground empty:hidden"
                  aria-live="polite"
                >
                  {amountError ? '' : amountHint}
                </p>
                <p
                  id={`${id}-amount-error`}
                  className="text-sm text-destructive empty:hidden"
                  role="alert"
                >
                  {showErrors || (!isXlm && amount !== null) ? amountError : ''}
                </p>
              </div>

              <label className="flex cursor-pointer items-start gap-3 rounded-lg border bg-muted/40 p-3 has-checked:border-primary/40 has-checked:bg-accent/60">
                <input
                  type="checkbox"
                  className="mt-0.5 size-4 shrink-0 accent-primary"
                  checked={withYerba}
                  onChange={(e) => setWithYerba(e.target.checked)}
                />
                <span className="grid gap-0.5">
                  <span className="text-sm font-medium text-pretty">
                    <Sprout
                      className="mr-1.5 inline size-4 align-[-0.15em] text-primary"
                      aria-hidden="true"
                    />
                    Sumar {YERBA_SHARE * 100} % al fondo yerbatero de Misiones
                  </span>
                  {share > 0 && (
                    <span className="text-sm text-muted-foreground tabular-nums">
                      Son {formatXlmExact(share)} {asset.code} más, aparte de tu
                      mate.
                    </span>
                  )}
                  <span className="text-xs text-pretty text-muted-foreground">
                    Demo en Testnet: llega a una cuenta de prueba, en la misma
                    transacción que tu mate.
                  </span>
                </span>
              </label>

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
                : wrongNetwork
                  ? `Cambiá a ${NETWORK_NAME}`
                  : !address
                    ? 'Conectá tu wallet'
                    : !account
                      ? accountLoading
                        ? 'Leyendo tu saldo…'
                        : 'No pudimos leer tu saldo'
                      : !account.funded
                        ? 'Activá tu cuenta'
                        : amount !== null
                          ? `Convidar ${formatXlmExact(amount)} ${asset.code}`
                          : 'Convidar'}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  )
}
