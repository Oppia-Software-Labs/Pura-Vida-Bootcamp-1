import type { ReactNode } from 'react'
import type { DonaRosa } from '../hooks/useDonaRosa'
import type { Pulperia } from '../hooks/usePulperia'
import type { Wallet } from '../hooks/useWallet'
import { accountExplorerUrl, shortAddress } from '../lib/stellar'
import { txExplorerUrl, type TxReceipt } from '../lib/transactions'

type TryItProps = {
  conceptId: string
  wallet: Wallet
  rosa: DonaRosa
  pulperia: Pulperia
}

const PULPERIA_CONCEPTS = ['token', 'trustline', 'mint-burn']

export function TryIt({ conceptId, wallet, rosa, pulperia }: TryItProps) {
  if (conceptId === 'smart-contract') return null
  if (!wallet.address) return <TryItBox><ConnectFirst /></TryItBox>
  if (conceptId === 'testnet' || conceptId === 'wallet') return <TryItBox><WalletShortcut /></TryItBox>
  if (conceptId === 'transaccion') return <TryItBox><SendToRosa rosa={rosa} /></TryItBox>
  if (conceptId === 'fee') return <TryItBox><FeePaid rosa={rosa} /></TryItBox>
  if (PULPERIA_CONCEPTS.includes(conceptId)) return <TryItBox><PulperiaChepe pulperia={pulperia} /></TryItBox>
  return null
}

function TryItBox({ children }: { children: ReactNode }) {
  return (
    <div className="mt-6 rounded-2xl border-2 border-dashed border-cafeto/40 bg-cafeto/5 p-4">
      <p className="font-display text-xl font-bold text-cafeto">🧪 Probalo en testnet</p>
      <div className="mt-2 space-y-3">{children}</div>
    </div>
  )
}

function ConnectFirst() {
  return (
    <p>
      Primero <a href="#wallet" className="font-bold underline">conectá tu wallet</a> y lo probamos con billetes de
      juguete.
    </p>
  )
}

function WalletShortcut() {
  return (
    <p>
      ¡Ya lo estás haciendo! Tu monedero está conectado.{' '}
      <a href="#wallet" className="font-bold underline">Mirá tu dirección y tu saldo</a>, y si está vacío pedile XLM
      al abuelo Friendbot.
    </p>
  )
}

function SendToRosa({ rosa }: { rosa: DonaRosa }) {
  return (
    <>
      <p>
        Doña Rosa ({shortAddress(rosa.rosaAddress)}) acaba de abrir su monedero. Mandale {rosa.amount} XLM: vas a
        firmar con tu wallet, como cuando confirmás un SINPE.
      </p>
      <ActionButton onClick={rosa.send} busy={rosa.busy} busyLabel="Esperando tu firma…">
        Mandarle {rosa.amount} XLM a Doña Rosa
      </ActionButton>
      {rosa.receipt && (
        <Receipt receipt={rosa.receipt}>
          ¡Listo! Quedó anotado en el ledger.{' '}
          <a className="underline" href={accountExplorerUrl(rosa.rosaAddress)} target="_blank" rel="noreferrer">
            Ver el monedero de Doña Rosa
          </a>
        </Receipt>
      )}
      <ErrorText error={rosa.error} />
    </>
  )
}

function FeePaid({ rosa }: { rosa: DonaRosa }) {
  if (!rosa.receipt) {
    return (
      <>
        <p>Mandá una transacción y te digo cuánto pagaste de pasaje.</p>
        <SendToRosa rosa={rosa} />
      </>
    )
  }
  return (
    <p className="text-lg">
      🚌 En tu último envío pagaste <strong>{rosa.receipt.feeXlm} XLM</strong> de pasaje.{' '}
      <a className="underline" href={txExplorerUrl(rosa.receipt.hash)} target="_blank" rel="noreferrer">
        Ver el tiquete
      </a>
    </p>
  )
}

function PulperiaChepe({ pulperia }: { pulperia: Pulperia }) {
  return (
    <>
      <p>
        Vamos a abrir la <strong>Pulpería Chepe</strong>, que emite vales <code>CHEPE</code>. Tenés{' '}
        <strong>{pulperia.vales} CHEPE</strong>.
      </p>
      <ol className="space-y-2">
        <Step done={pulperia.stage !== 'cerrada'} label="0. Don Chepe abre su pulpería (cuenta emisora nueva)">
          <ActionButton onClick={pulperia.abrirPulperia} busy={pulperia.busy} busyLabel="Abriendo…">
            Abrir la pulpería
          </ActionButton>
        </Step>
        <Step
          done={pulperia.stage === 'confias' || pulperia.stage === 'tenesVales'}
          enabled={pulperia.stage === 'abierta'}
          label="1. Trustline: decí “yo acepto vales de Don Chepe”"
        >
          <ActionButton onClick={pulperia.confiar} busy={pulperia.busy} busyLabel="Esperando tu firma…">
            Confiar en Don Chepe
          </ActionButton>
        </Step>
        <Step
          done={pulperia.stage === 'tenesVales'}
          enabled={pulperia.stage === 'confias'}
          label={`2. Mint: Don Chepe imprime ${pulperia.mintAmount} vales para vos`}
        >
          <ActionButton onClick={pulperia.imprimirVales} busy={pulperia.busy} busyLabel="Imprimiendo…">
            Imprimir vales
          </ActionButton>
        </Step>
        <Step
          done={false}
          enabled={pulperia.stage === 'tenesVales' && pulperia.canBurn}
          label={`3. Burn: devolvé ${pulperia.burnAmount} vales y Don Chepe los rompe`}
        >
          <ActionButton onClick={pulperia.quemarVales} busy={pulperia.busy} busyLabel="Esperando tu firma…">
            Quemar {pulperia.burnAmount} CHEPE
          </ActionButton>
        </Step>
      </ol>
      {pulperia.lastReceipt && <Receipt receipt={pulperia.lastReceipt}>Último paso anotado en el ledger.</Receipt>}
      <ErrorText error={pulperia.error} />
      {pulperia.issuerAddress && (
        <p className="text-xs opacity-60">
          La llave de Don Chepe vive solo en la memoria de esta página (es testnet, no pasa nada). Si recargás, la
          pulpería cierra.
        </p>
      )}
    </>
  )
}

type StepProps = {
  label: string
  done: boolean
  enabled?: boolean
  children: ReactNode
}

function Step({ label, done, enabled = true, children }: StepProps) {
  return (
    <li className={`flex flex-wrap items-center gap-3 ${!enabled && !done ? 'opacity-40' : ''}`}>
      <span className="min-w-60 flex-1">
        {done ? '✅' : '⬜'} {label}
      </span>
      {enabled && !done && children}
    </li>
  )
}

type ActionButtonProps = {
  onClick: () => void
  busy: boolean
  busyLabel: string
  children: ReactNode
}

function ActionButton({ onClick, busy, busyLabel, children }: ActionButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={busy}
      className="rounded-full bg-cafeto px-5 py-2 font-bold text-crema hover:opacity-90 disabled:opacity-50"
    >
      {busy ? busyLabel : children}
    </button>
  )
}

function Receipt({ receipt, children }: { receipt: TxReceipt; children: ReactNode }) {
  return (
    <p className="rounded-xl bg-white/70 p-3 text-sm">
      ✅ {children} Pasaje pagado: {receipt.feeXlm} XLM.{' '}
      <a className="underline" href={txExplorerUrl(receipt.hash)} target="_blank" rel="noreferrer">
        Ver transacción
      </a>
    </p>
  )
}

function ErrorText({ error }: { error: string | null }) {
  if (!error) return null
  return <p className="rounded-xl bg-terracota/10 p-3 text-terracota">{error}</p>
}
