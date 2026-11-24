import { useCallback, useEffect, useState } from 'react'
import { loadNativeBalance } from './balance'

export function useNativeBalance(wallet) {
  const address = wallet.phase === 'ready' && wallet.testnet ? wallet.address : ''
  const [nonce, setNonce] = useState(0)
  const [result, setResult] = useState({ address: '', nonce: -1, status: 'idle', amount: '' })

  const refresh = useCallback(() => {
    setNonce((value) => value + 1)
  }, [])

  useEffect(() => {
    if (!address) return undefined

    let ignore = false
    loadNativeBalance(address).then((loaded) => {
      if (ignore) return
      setResult({ address, nonce, status: loaded.status, amount: loaded.amount })
    })

    return () => {
      ignore = true
    }
  }, [address, nonce])

  if (!address || result.address !== address || result.nonce !== nonce) {
    return { status: address ? 'loading' : 'idle', amount: '', address, refresh }
  }

  return { status: result.status, amount: result.amount, address, refresh }
}
