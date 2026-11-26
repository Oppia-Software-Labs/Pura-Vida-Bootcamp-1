import { useState } from 'react'
import { personaById, type PersonaId } from '../content/personas'
import type { Wallet } from '../hooks/useWallet'
import { balanceLabel, fundWithFriendbot, shortAddress } from '../lib/stellar'
import { SpeechBubble } from './SpeechBubble'
import { Button, ExternalLink, Eyebrow, Notice } from './ui'

export function WalletSection({ wallet, persona }: { wallet: Wallet; persona: PersonaId }) {
  return (
    <section id="wallet" className="mx-auto flex max-w-3xl flex-col items-center gap-7 px-4 pt-16 pb-24 text-center sm:px-6">
      <Eyebrow>Paso 0 · Antes de empezar</Eyebrow>
      <h2 className="font-pixel text-4xl leading-tight sm:text-5xl">Conectá tu wallet</h2>
      <SpeechBubble persona={persona}>{personaById(persona).greeting}</SpeechBubble>
      {wallet.address ? <ConnectedCard wallet={wallet} /> : <ConnectPrompt wallet={wallet} />}
      <p className="text-[15px] text-tinta">
        Todo pasa en <strong className="text-navy">testnet</strong>: plata de juguete, cero riesgo. Funciona con
        Freighter, xBull, LOBSTR y Albedo.
      </p>
      {wallet.error && <Notice tone="error">{wallet.error}</Notice>}
    </section>
  )
}

function ConnectPrompt({ wallet }: { wallet: Wallet }) {
  return (
    <div className="flex flex-col items-center gap-4">
      <Button onClick={wallet.connect}>Conectar wallet</Button>
      <p className="text-sm text-tinta">
        ¿No tenés una? Instalá <ExternalLink href="https://www.freighter.app/">Freighter</ExternalLink> o{' '}
        <ExternalLink href="https://xbull.app/">xBull</ExternalLink> y ponela en Testnet.
      </p>
    </div>
  )
}

function ConnectedCard({ wallet }: { wallet: Wallet }) {
  return (
    <div className="flex w-full flex-col gap-4 border-2 border-navy bg-white p-6 text-left shadow-hard">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
        <span aria-hidden className="flex size-10 shrink-0 items-center justify-center bg-verde font-pixel text-xl text-white">
          ✓
        </span>
        <div className="min-w-48 flex-1">
          <p className="eyebrow text-verde">Wallet conectada · Testnet</p>
          <p className="mt-1 font-mono text-lg" title={wallet.address!}>
            {shortAddress(wallet.address!)}
          </p>
        </div>
        <p className="font-pixel text-3xl">{balanceLabel(wallet.account)}</p>
      </div>
      {wallet.account?.status === 'unfunded' && <FriendbotOffer wallet={wallet} />}
    </div>
  )
}

function FriendbotOffer({ wallet }: { wallet: Wallet }) {
  const [asking, setAsking] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const askFriendbot = async () => {
    setAsking(true)
    setError(null)
    try {
      await fundWithFriendbot(wallet.address!)
      await wallet.refresh()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setAsking(false)
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-4 border-t border-borde pt-4">
      <p className="min-w-60 flex-1 text-[15px]">
        Tu monedero está vacío, y en Stellar un monedero vacío ni siquiera existe. <strong>Friendbot</strong> te regala
        10.000 XLM de testnet.
      </p>
      <Button onClick={askFriendbot} disabled={asking}>
        {asking ? 'Pidiendo…' : 'Pedir XLM'}
      </Button>
      {error && (
        <div className="basis-full">
          <Notice tone="error">{error}</Notice>
        </div>
      )}
    </div>
  )
}
