import { Keypair } from '@stellar/stellar-sdk'
import { useState } from 'react'
import { friendlyTxError, sendXlm, type TxReceipt } from '../lib/transactions'
import type { Wallet } from './useWallet'

const AMOUNT = '1'

export function useDonaRosa(wallet: Wallet) {
  const [rosaAddress] = useState(() => Keypair.random().publicKey())
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [receipt, setReceipt] = useState<TxReceipt | null>(null)

  const send = async () => {
    if (!wallet.address) return
    setBusy(true)
    setError(null)
    try {
      setReceipt(await sendXlm(wallet.address, rosaAddress, AMOUNT, wallet.signTransaction))
      await wallet.refresh()
    } catch (e) {
      setError(friendlyTxError(e))
    } finally {
      setBusy(false)
    }
  }

  return { rosaAddress, amount: AMOUNT, busy, error, receipt, send }
}

export type DonaRosa = ReturnType<typeof useDonaRosa>
