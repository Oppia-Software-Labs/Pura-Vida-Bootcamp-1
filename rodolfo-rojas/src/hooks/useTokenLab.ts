import { Asset, Keypair, Operation } from '@stellar/stellar-sdk'
import { useState } from 'react'
import { fundWithFriendbot, horizon } from '../lib/stellar'
import { friendlyTxError, submitWithKeypair, submitWithWallet, type TxReceipt } from '../lib/transactions'
import type { Wallet } from './useWallet'

export type TokenLabStage = 'closed' | 'open' | 'trusted' | 'minted' | 'burned'

const MINT_AMOUNT = '100'
const BURN_AMOUNT = '10'

export function useTokenLab(wallet: Wallet) {
  const [issuer, setIssuer] = useState<Keypair | null>(null)
  const [asset, setAsset] = useState<Asset | null>(null)
  const [stage, setStage] = useState<TokenLabStage>('closed')
  const [balance, setBalance] = useState('0')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastReceipt, setLastReceipt] = useState<TxReceipt | null>(null)

  const run = async (action: () => Promise<void>) => {
    setBusy(true)
    setError(null)
    try {
      await action()
    } catch (e) {
      setError(friendlyTxError(e))
    } finally {
      setBusy(false)
    }
  }

  const refreshBalance = async (target: Asset) => {
    if (!wallet.address) return
    setBalance(await loadAssetBalance(wallet.address, target))
    await wallet.refresh()
  }

  const open = (assetCode: string) =>
    run(async () => {
      const keypair = Keypair.random()
      await fundWithFriendbot(keypair.publicKey())
      setIssuer(keypair)
      setAsset(new Asset(assetCode, keypair.publicKey()))
      setStage('open')
    })

  const trust = () =>
    run(async () => {
      if (!asset || !wallet.address) return
      setLastReceipt(await submitWithWallet(wallet.address, Operation.changeTrust({ asset }), wallet.signTransaction))
      setStage('trusted')
      await refreshBalance(asset)
    })

  const mint = () =>
    run(async () => {
      if (!asset || !issuer || !wallet.address) return
      const payment = Operation.payment({ destination: wallet.address, asset, amount: MINT_AMOUNT })
      setLastReceipt(await submitWithKeypair(issuer, payment))
      setStage('minted')
      await refreshBalance(asset)
    })

  const burn = () =>
    run(async () => {
      if (!asset || !issuer || !wallet.address) return
      const payment = Operation.payment({ destination: issuer.publicKey(), asset, amount: BURN_AMOUNT })
      setLastReceipt(await submitWithWallet(wallet.address, payment, wallet.signTransaction))
      setStage('burned')
      await refreshBalance(asset)
    })

  return {
    stage,
    assetCode: asset?.getCode() ?? null,
    balance,
    busy,
    error,
    lastReceipt,
    burnAmount: BURN_AMOUNT,
    canBurn: Number(balance) >= Number(BURN_AMOUNT),
    open,
    trust,
    mint,
    burn,
  }
}

export type TokenLab = ReturnType<typeof useTokenLab>

async function loadAssetBalance(address: string, asset: Asset): Promise<string> {
  const account = await horizon.loadAccount(address)
  const line = account.balances.find(
    (b) => 'asset_code' in b && b.asset_code === asset.getCode() && b.asset_issuer === asset.getIssuer(),
  )
  return line?.balance ?? '0'
}
