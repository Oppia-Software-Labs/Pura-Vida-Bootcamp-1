import { Asset, Keypair, Operation } from '@stellar/stellar-sdk'
import { useCallback, useState } from 'react'
import { fundWithFriendbot, horizon } from '../lib/stellar'
import { friendlyTxError, submitWithKeypair, submitWithWallet, type TxReceipt } from '../lib/transactions'
import type { Wallet } from './useWallet'

export type PulperiaStage = 'cerrada' | 'abierta' | 'confias' | 'tenesVales'

const ASSET_CODE = 'CHEPE'
const MINT_AMOUNT = '100'
const BURN_AMOUNT = '10'

export function usePulperia(wallet: Wallet) {
  const [issuer, setIssuer] = useState<Keypair | null>(null)
  const [stage, setStage] = useState<PulperiaStage>('cerrada')
  const [vales, setVales] = useState('0')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastReceipt, setLastReceipt] = useState<TxReceipt | null>(null)

  const asset = issuer ? new Asset(ASSET_CODE, issuer.publicKey()) : null

  const run = useCallback(async (action: () => Promise<void>) => {
    setBusy(true)
    setError(null)
    try {
      await action()
    } catch (e) {
      setError(friendlyTxError(e))
    } finally {
      setBusy(false)
    }
  }, [])

  const refreshVales = useCallback(async (chepe: Asset) => {
    if (!wallet.address) return
    setVales(await loadAssetBalance(wallet.address, chepe))
    await wallet.refresh()
  }, [wallet])

  const abrirPulperia = () =>
    run(async () => {
      const keypair = Keypair.random()
      await fundWithFriendbot(keypair.publicKey())
      setIssuer(keypair)
      setStage('abierta')
    })

  const confiar = () =>
    run(async () => {
      if (!asset || !wallet.address) return
      setLastReceipt(await submitWithWallet(wallet.address, Operation.changeTrust({ asset }), wallet.signTransaction))
      setStage('confias')
      await refreshVales(asset)
    })

  const imprimirVales = () =>
    run(async () => {
      if (!asset || !issuer || !wallet.address) return
      const mint = Operation.payment({ destination: wallet.address, asset, amount: MINT_AMOUNT })
      setLastReceipt(await submitWithKeypair(issuer, mint))
      setStage('tenesVales')
      await refreshVales(asset)
    })

  const quemarVales = () =>
    run(async () => {
      if (!asset || !issuer || !wallet.address) return
      const burn = Operation.payment({ destination: issuer.publicKey(), asset, amount: BURN_AMOUNT })
      setLastReceipt(await submitWithWallet(wallet.address, burn, wallet.signTransaction))
      await refreshVales(asset)
    })

  return {
    issuerAddress: issuer?.publicKey() ?? null,
    stage,
    vales,
    busy,
    error,
    lastReceipt,
    mintAmount: MINT_AMOUNT,
    burnAmount: BURN_AMOUNT,
    canBurn: Number(vales) >= Number(BURN_AMOUNT),
    abrirPulperia,
    confiar,
    imprimirVales,
    quemarVales,
  }
}

export type Pulperia = ReturnType<typeof usePulperia>

async function loadAssetBalance(address: string, asset: Asset): Promise<string> {
  const account = await horizon.loadAccount(address)
  const line = account.balances.find(
    (b) => 'asset_code' in b && b.asset_code === asset.getCode() && b.asset_issuer === asset.getIssuer(),
  )
  return line?.balance ?? '0'
}
