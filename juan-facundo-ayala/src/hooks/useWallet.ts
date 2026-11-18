import { useCallback, useEffect, useState } from 'react'
import {
  connectWallet,
  disconnectWallet,
  isWalletOnTestnet,
  onWalletChange,
  walletErrorMessage,
} from '@/lib/wallet'

export function useWallet() {
  const [address, setAddress] = useState<string | null>(null)
  const [connecting, setConnecting] = useState(false)
  const [error, setError] = useState('')
  const [wrongNetwork, setWrongNetwork] = useState(false)

  // El kit recuerda la última sesión y emite el estado al suscribirse.
  useEffect(() => onWalletChange(setAddress), [])

  useEffect(() => {
    if (!address) return
    let cancelled = false
    isWalletOnTestnet().then((onTestnet) => {
      if (!cancelled) setWrongNetwork(onTestnet === false)
    })
    return () => {
      cancelled = true
      setWrongNetwork(false)
    }
  }, [address])

  const connect = useCallback(async () => {
    setConnecting(true)
    setError('')
    try {
      setAddress(await connectWallet())
    } catch (err) {
      setError(walletErrorMessage(err))
    } finally {
      setConnecting(false)
    }
  }, [])

  const disconnect = useCallback(async () => {
    setError('')
    try {
      await disconnectWallet()
    } finally {
      setAddress(null)
    }
  }, [])

  return { address, connecting, error, wrongNetwork, connect, disconnect }
}
