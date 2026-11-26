import { useCallback, useEffect, useRef, useState } from 'react'
import {
  WatchWalletChanges,
  getAddress,
  getNetwork,
  isConnected,
  requestAccess,
} from '@stellar/varial-sdk'
import { isAccessDeclined, isTestnet } from './network'

const idle = {
  phase: 'idle',
  address: '',
  network: '',
  networkPassphrase: '',
  testnet: false,
  notice: '',
}

function sessionFrom(address, network, networkPassphrase, networkError) {
  return {
    phase: 'ready',
    address,
    network: network || '',
    networkPassphrase: networkPassphrase || '',
    testnet: !networkError && isTestnet(network, networkPassphrase),
    notice: networkError ? 'network' : '',
  }
}

export function useVarial() {
  const [wallet, setWallet] = useState({ ...idle, phase: 'checking' })
  const watcherRef = useRef(null)

  useEffect(() => {
    let cancelled = false

    async function restore() {
      const installed = await isConnected()
      if (cancelled) return
      if (installed.error || !installed.isConnected) {
        setWallet(idle)
        return
      }

      const current = await getAddress()
      if (cancelled) return
      if (current.error || !current.address) {
        setWallet(idle)
        return
      }

      const net = await getNetwork()
      if (cancelled) return
      setWallet(sessionFrom(current.address, net.network, net.networkPassphrase, net.error))
    }

    restore()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (wallet.phase !== 'ready' || !wallet.address) {
      watcherRef.current?.stop()
      watcherRef.current = null
      return undefined
    }

    const watcher = new WatchWalletChanges(3000)
    watcherRef.current = watcher
    watcher.watch((info) => {
      if (info.error && !info.address) return
      if (!info.address) {
        setWallet(idle)
        return
      }
      setWallet(
        sessionFrom(info.address, info.network, info.networkPassphrase, Boolean(info.error)),
      )
    })

    return () => {
      watcher.stop()
      if (watcherRef.current === watcher) watcherRef.current = null
    }
  }, [wallet.phase, wallet.address])

  const connect = useCallback(async () => {
    setWallet((current) => ({ ...current, phase: 'connecting', notice: '' }))

    const installed = await isConnected()
    if (installed.error || !installed.isConnected) {
      setWallet({ ...idle, phase: 'missing' })
      return
    }

    const access = await requestAccess()
    if (access.error || !access.address) {
      setWallet({
        ...idle,
        phase: isAccessDeclined(access.error) ? 'rejected' : 'error',
      })
      return
    }

    const net = await getNetwork()
    setWallet(sessionFrom(access.address, net.network, net.networkPassphrase, net.error))
  }, [])

  const disconnect = useCallback(() => {
    watcherRef.current?.stop()
    watcherRef.current = null
    setWallet({ ...idle, notice: 'local' })
  }, [])

  return { wallet, connect, disconnect }
}
