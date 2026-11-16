import type { ReactNode } from 'react'
import type { PersonaId } from '../content/personas'
import type { PixelGrid } from '../content/pixel'
import { PRACTICE, type PracticeStep } from '../content/practice'
import { SCENES, type SceneId } from '../content/scenes'
import type { FirstPayment } from '../hooks/useFirstPayment'
import type { TokenLab, TokenLabStage } from '../hooks/useTokenLab'
import { accountExplorerUrl } from '../lib/stellar'
import { txExplorerUrl, type TxReceipt } from '../lib/transactions'
import { PixelArt } from './PixelArt'
import { Button, ExternalLink, Eyebrow, Notice, Panel } from './ui'

type PracticeSectionProps = {
  persona: PersonaId
  payment: FirstPayment
  lab: TokenLab
  funded: boolean
}

export function PracticeSection({ persona, payment, lab, funded }: PracticeSectionProps) {
  const level2Unlocked = Boolean(payment.receipt)
  return (
    <section id="practica" className="mx-auto flex max-w-3xl flex-col items-center gap-7 border-t-2 border-navy px-4 py-24 sm:px-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <Eyebrow>Práctica · Testnet</Eyebrow>
        <h2 className="font-pixel text-4xl leading-tight sm:text-5xl">Ahora hacelo de verdad</h2>
        <p className="text-tinta">Dos niveles. No podés abrir el 2 sin terminar el 1.</p>
      </div>
      {!funded && <Notice tone="info">Primero pedile XLM a Friendbot en la sección de wallet para tener con qué jugar.</Notice>}
      <LevelOne persona={persona} payment={payment} funded={funded} />
      <LevelTwo persona={persona} lab={lab} unlocked={level2Unlocked} />
    </section>
  )
}

function LevelOne({ persona, payment, funded }: { persona: PersonaId; payment: FirstPayment; funded: boolean }) {
  const content = PRACTICE[persona].level1
  const done = Boolean(payment.receipt)
  return (
    <Panel className="flex w-full flex-col items-center gap-5 p-7 text-center">
      <div className="flex flex-wrap items-center justify-center gap-3">
        <span className="eyebrow text-tinta">Nivel 1 · Tu primera transacción</span>
        {done && <span className="eyebrow bg-verde px-2.5 py-1 text-white">Nivel 1 ✓</span>}
      </div>
      <h3 className="font-pixel text-3xl leading-tight">{content.title}</h3>
      <PixelArt grid={SCENES[persona].level1} size={224} label={content.sceneAlt} className="border-2 border-navy" />
      <p className="max-w-xl whitespace-pre-line text-lg">{content.text}</p>
      {persona === 'dev' && content.code && <Code>{content.code}</Code>}
      {!done && (
        <Button onClick={payment.send} disabled={!funded || payment.busy}>
          {payment.busy ? 'Esperando tu firma…' : `Mandar ${payment.amount} XLM`}
        </Button>
      )}
      {payment.receipt && (
        <Receipt receipt={payment.receipt}>
          Quedó anotado en el ledger.{' '}
          <ExternalLink href={accountExplorerUrl(payment.recipientAddress)}>Ver la cuenta de {content.recipient}</ExternalLink>
        </Receipt>
      )}
      {payment.error && <Notice tone="error">{payment.error}</Notice>}
    </Panel>
  )
}

type StepState = 'done' | 'active' | 'locked'

const STEP_SCENES: SceneId[] = ['step1', 'step2', 'step3', 'step4']

function stepStates(stage: TokenLabStage): StepState[] {
  if (stage === 'closed') return ['active', 'locked', 'locked', 'locked']
  if (stage === 'open') return ['done', 'active', 'locked', 'locked']
  if (stage === 'trusted') return ['done', 'done', 'active', 'locked']
  if (stage === 'minted') return ['done', 'done', 'done', 'active']
  return ['done', 'done', 'done', 'done']
}

function LevelTwo({ persona, lab, unlocked }: { persona: PersonaId; lab: TokenLab; unlocked: boolean }) {
  const content = PRACTICE[persona].level2
  const assetCode = lab.assetCode ?? content.assetCode
  const states = stepStates(lab.stage)
  const actions = [() => lab.open(content.assetCode), lab.trust, lab.mint, lab.burn]
  const completed = lab.stage === 'burned'
  return (
    <Panel className={`flex w-full flex-col gap-5 p-7 ${unlocked ? '' : 'opacity-50'}`}>
      <div className="flex flex-col items-center gap-2.5 text-center">
        <div className="flex flex-wrap items-center justify-center gap-3">
          <span className="eyebrow text-tinta">
            Nivel 2 · Tu propio token · {unlocked ? 'Desbloqueado' : 'Bloqueado: terminá el nivel 1'}
          </span>
          {completed && <span className="eyebrow bg-verde px-2.5 py-1 text-white">Nivel 2 ✓</span>}
        </div>
        <h3 className="font-pixel text-3xl leading-tight">{content.title}</h3>
        <p className="font-pixel text-4xl text-azul">
          Tenés {Number(lab.balance).toLocaleString('es-CR')} {assetCode}
        </p>
      </div>
      <ol className="flex flex-col gap-4">
        {content.steps.map((step, index) => (
          <StepRow
            key={step.title}
            number={index + 1}
            step={step}
            scene={SCENES[persona][STEP_SCENES[index]]}
            state={unlocked ? states[index] : 'locked'}
            showCode={persona === 'dev'}
            busy={lab.busy}
            onAction={actions[index]}
          >
            {index === 3 && completed && (
              <BurnResult lab={lab} assetCode={assetCode} />
            )}
          </StepRow>
        ))}
      </ol>
      {lab.lastReceipt && !completed && <Receipt receipt={lab.lastReceipt}>Último paso anotado en el ledger.</Receipt>}
      {lab.error && <Notice tone="error">{lab.error}</Notice>}
    </Panel>
  )
}

const ROW_STYLES: Record<StepState, string> = {
  done: 'border-navy',
  active: 'border-azul shadow-[5px_5px_0_#1F3BFF]',
  locked: 'border-borde opacity-45',
}

const TAG_STYLES: Record<StepState, string> = {
  done: 'bg-verde text-white',
  active: 'bg-azul text-white',
  locked: 'border border-tinta text-tinta',
}

type StepRowProps = {
  number: number
  step: PracticeStep
  scene: PixelGrid
  state: StepState
  showCode: boolean
  busy: boolean
  onAction: () => void
  children?: ReactNode
}

function StepRow({ number, step, scene, state, showCode, busy, onAction, children }: StepRowProps) {
  const tag = { done: `Paso ${number} ✓`, active: `Paso ${number} · Ahora`, locked: `Paso ${number} · Bloqueado` }[state]
  return (
    <li className={`flex flex-wrap items-start gap-x-5 gap-y-4 border-2 bg-white p-4 ${ROW_STYLES[state]}`}>
      <PixelArt grid={scene} size={160} label={step.sceneAlt} className="border-2 border-navy" />
      <div className="flex min-w-0 flex-[1_1_240px] flex-col gap-2">
        <span className={`eyebrow self-start px-2 py-0.5 ${TAG_STYLES[state]}`}>{tag}</span>
        <span className="text-lg font-semibold">{step.title}</span>
        <span className="whitespace-pre-line text-[15px] text-tinta">{step.text}</span>
        {showCode && step.code && <Code>{step.code}</Code>}
        {state === 'active' && (
          <Button onClick={onAction} disabled={busy} className="self-start">
            {busy ? 'Firmando…' : step.cta}
          </Button>
        )}
        {children}
      </div>
    </li>
  )
}

function BurnResult({ lab, assetCode }: { lab: TokenLab; assetCode: string }) {
  const burnAmount = lab.burnAmount
  return (
    <div className="flex flex-col gap-3" aria-live="polite">
      {lab.lastReceipt && (
        <Receipt receipt={lab.lastReceipt}>
          Quemaste {burnAmount} {assetCode}: ya no existen. Ahora tenés {Number(lab.balance).toLocaleString('es-CR')}{' '}
          {assetCode}.
        </Receipt>
      )}
      {lab.canBurn && (
        <Button variant="ghost" onClick={lab.burn} disabled={lab.busy} className="self-start">
          {lab.busy ? 'Firmando…' : `Quemar ${burnAmount} más`}
        </Button>
      )}
    </div>
  )
}

function Code({ children }: { children: string }) {
  return (
    <pre className="w-full overflow-x-auto bg-navy px-4 py-3 text-left font-mono text-xs leading-normal text-niebla">
      <code>{children}</code>
    </pre>
  )
}

function Receipt({ receipt, children }: { receipt: TxReceipt; children: ReactNode }) {
  return (
    <div className="w-full border-l-4 border-verde bg-papel px-4 py-3 text-left text-[15px]">
      <p>{children}</p>
      <p className="mt-1">
        Fee pagado: <strong>{receipt.feeXlm} XLM</strong> ·{' '}
        <ExternalLink href={txExplorerUrl(receipt.hash)}>Ver transacción</ExternalLink>
      </p>
    </div>
  )
}
