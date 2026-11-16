import { useState } from 'react'
import { getPublicKey, isConnected } from '@lobstrco/signer-extension-api'
import {
  fundTestnetAccount,
  getAccountFunds,
  isUnfundedAccount,
  type AccountFunds,
} from '../lib/stellar.ts'

const emptyFunds: AccountFunds = { total: '', reserved: '', available: '' }

export function useLobstrWallet() {
  const [publicKey, setPublicKey] = useState('')
  const [funds, setFunds] = useState<AccountFunds>(emptyFunds)
  const [error, setError] = useState('')
  const [needsFunding, setNeedsFunding] = useState(false)

  async function readBalance(address: string) {
    try {
      setFunds(await getAccountFunds(address))
      setNeedsFunding(false)
      setError('')
    } catch (caught) {
      if (isUnfundedAccount(caught)) {
        setFunds(emptyFunds)
        setNeedsFunding(true)
        setError('Esta dirección todavía no existe en testnet.')
        return
      }

      setFunds(emptyFunds)
      setNeedsFunding(false)
      setError(caught instanceof Error ? caught.message : 'No se pudo leer el balance.')
    }
  }

  async function connect() {
    setError('')
    setFunds(emptyFunds)
    setNeedsFunding(false)

    try {
      const installed = await isConnected()
      if (!installed) {
        setError('Instala la extensión LOBSTR signer en Chrome y vuelve a intentar.')
        return
      }

      const key = await getPublicKey()
      setPublicKey(key)
      await readBalance(key)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No se pudo conectar la wallet.')
    }
  }

  async function fund() {
    if (!publicKey) return
    setError('')

    try {
      await fundTestnetAccount(publicKey)
      await readBalance(publicKey)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Friendbot no pudo fondear la cuenta.')
    }
  }

  return { publicKey, funds, error, needsFunding, connect, fund }
}
