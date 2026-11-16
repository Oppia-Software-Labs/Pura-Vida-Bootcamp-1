import { useState } from 'react'
import type { Wallet } from '../hooks/useWallet'
import { accountExplorerUrl, fundWithFriendbot, shortAddress } from '../lib/stellar'
import { Section } from './Section'

export function WalletSection({ wallet }: { wallet: Wallet }) {
  return (
    <Section id="wallet" emoji="👛" title="Conectá tu wallet">
      <p className="text-lg">
        <strong>La abuelita dice:</strong> “Una wallet es como tu monedero con candado. Todos pueden ver
        el monedero (tu dirección), pero solo vos tenés la llave para abrirlo. Si perdés la llave, nadie
        te puede hacer otra.”
      </p>
      <p className="mt-2 text-sm opacity-75">
        Usamos <strong>testnet</strong>: es como jugar de tiendita con billetes de Monopoly. Nada de lo
        que hagás acá cuesta plata de verdad.
      </p>
      <div className="mt-6">
        {wallet.address ? <ConnectedWallet wallet={wallet} /> : <ConnectButton wallet={wallet} />}
      </div>
      {wallet.error && <p className="mt-4 rounded-xl bg-terracota/10 p-3 text-terracota">{wallet.error}</p>}
    </Section>
  )
}

function ConnectButton({ wallet }: { wallet: Wallet }) {
  return (
    <div>
      <button
        onClick={wallet.connect}
        className="rounded-full bg-terracota px-6 py-3 text-lg font-bold text-crema hover:opacity-90"
      >
        Conectar wallet
      </button>
      <p className="mt-3 text-sm opacity-75">
        ¿No tenés wallet? Instalá{' '}
        <a className="underline" href="https://www.freighter.app/" target="_blank" rel="noreferrer">
          Freighter
        </a>{' '}
        (ahora se llama Varial) o xBull, y creá una cuenta en testnet.
      </p>
    </div>
  )
}

function ConnectedWallet({ wallet }: { wallet: Wallet }) {
  const address = wallet.address!
  return (
    <div className="space-y-4">
      {!wallet.onTestnet && (
        <p className="rounded-xl bg-mostaza/30 p-3">
          ⚠️ Tu wallet no está en <strong>Testnet</strong>. Cambiala en la configuración de la wallet para
          jugar sin riesgo.
        </p>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <span className="rounded-full bg-cafeto px-4 py-2 font-mono text-crema" title={address}>
          {shortAddress(address)}
        </span>
        <a className="underline" href={accountExplorerUrl(address)} target="_blank" rel="noreferrer">
          Ver en el explorador
        </a>
        <button onClick={wallet.disconnect} className="ml-auto text-sm underline opacity-75">
          Desconectar
        </button>
      </div>
      <Balance wallet={wallet} />
    </div>
  )
}

function Balance({ wallet }: { wallet: Wallet }) {
  if (!wallet.account) return <p className="opacity-75">Contando las monedas…</p>
  if (wallet.account.status === 'unfunded') return <FriendbotOffer wallet={wallet} />
  return (
    <div className="flex flex-wrap items-baseline gap-3">
      <p className="font-display text-4xl font-bold">{formatXlm(wallet.account.xlm)} XLM</p>
      <button onClick={wallet.refresh} className="text-sm underline opacity-75">
        Actualizar
      </button>
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
    <div className="rounded-2xl bg-mostaza/20 p-4">
      <p>
        Tu monedero todavía está vacío, y en Stellar un monedero vacío ni siquiera existe. 👴{' '}
        <strong>El abuelo Friendbot</strong> te regala 10.000 XLM de juguete para empezar.
      </p>
      <button
        onClick={askFriendbot}
        disabled={asking}
        className="mt-3 rounded-full bg-cafeto px-5 py-2 font-bold text-crema hover:opacity-90 disabled:opacity-50"
      >
        {asking ? 'Pidiéndole al abuelo…' : 'Pedirle XLM al abuelo Friendbot'}
      </button>
      {error && <p className="mt-2 text-terracota">{error}</p>}
    </div>
  )
}

function formatXlm(amount: string): string {
  return Number(amount).toLocaleString('es-CR', { maximumFractionDigits: 2 })
}
