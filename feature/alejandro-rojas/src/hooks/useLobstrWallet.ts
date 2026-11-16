import { useState } from 'react'
import { getPublicKey, isConnected, signTransaction } from '@lobstrco/signer-extension-api'
import {
  ACCOUNT_MESSAGE,
  fundTestnetAccount,
  getAccountSnapshot,
  isUnfundedAccount,
  saveAccountMessage,
  type AccountEntry,
  type AccountFunds,
} from '../lib/stellar.ts'

const emptyFunds: AccountFunds = { total: '', reserved: '', available: '' }

export function useLobstrWallet() {
  const [publicKey, setPublicKey] = useState('')
  const [funds, setFunds] = useState<AccountFunds>(emptyFunds)
  const [entries, setEntries] = useState<AccountEntry[]>([])
  const [error, setError] = useState('')
  const [needsFunding, setNeedsFunding] = useState(false)
  const [saving, setSaving] = useState(false)

  function clearAccount() {
    setFunds(emptyFunds)
    setEntries([])
  }

  async function readAccount(address: string) {
    try {
      const snapshot = await getAccountSnapshot(address)
      setFunds(snapshot)
      setEntries(snapshot.entries)
      setNeedsFunding(false)
      setError('')
    } catch (caught) {
      if (isUnfundedAccount(caught)) {
        clearAccount()
        setNeedsFunding(true)
        setError('Esta dirección todavía no existe en testnet.')
        return
      }

      clearAccount()
      setNeedsFunding(false)
      setError(caught instanceof Error ? caught.message : 'No se pudo leer el balance.')
    }
  }

  async function connect() {
    setError('')
    clearAccount()
    setNeedsFunding(false)

    try {
      const installed = await isConnected()
      if (!installed) {
        setError('Instala la extensión LOBSTR signer en Chrome y vuelve a intentar.')
        return
      }

      const key = await getPublicKey()
      setPublicKey(key)
      await readAccount(key)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No se pudo conectar la wallet.')
    }
  }

  async function fund() {
    if (!publicKey) return
    setError('')

    try {
      await fundTestnetAccount(publicKey)
      await readAccount(publicKey)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Friendbot no pudo fondear la cuenta.')
    }
  }

  async function saveMessage() {
    if (!publicKey || saving) return
    setSaving(true)
    setError('')

    try {
      await saveAccountMessage(publicKey, signTransaction)
      await readAccount(publicKey)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Lobstr no pudo firmar el dato.')
    } finally {
      setSaving(false)
    }
  }

  function logout() {
    setPublicKey('')
    clearAccount()
    setError('')
    setNeedsFunding(false)
    setSaving(false)
  }

  const hasMessage = entries.some(
    (entry) => entry.name === ACCOUNT_MESSAGE.name && entry.value === ACCOUNT_MESSAGE.value,
  )

  return {
    publicKey,
    funds,
    entries,
    error,
    needsFunding,
    saving,
    hasMessage,
    connect,
    fund,
    saveMessage,
    logout,
  }
}
