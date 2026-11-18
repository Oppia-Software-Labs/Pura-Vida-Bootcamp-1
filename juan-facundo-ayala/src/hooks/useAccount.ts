import { useCallback, useEffect, useState } from 'react'
import {
  type AccountInfo,
  fundWithFriendbot,
  getAccountInfo,
} from '@/lib/account'

type State = {
  /** Dirección a la que pertenecen los datos de este estado. */
  address: string | null
  info: AccountInfo | null
  error: string
}

const EMPTY: State = { address: null, info: null, error: '' }

const LOAD_ERROR = 'No pudimos leer el saldo. Revisá tu conexión.'

export function useAccount(address: string | null) {
  const [state, setState] = useState<State>(EMPTY)
  const [refreshing, setRefreshing] = useState(false)
  const [funding, setFunding] = useState(false)

  const load = useCallback(async (target: string) => {
    try {
      const info = await getAccountInfo(target)
      setState({ address: target, info, error: '' })
    } catch {
      setState((prev) => ({
        address: target,
        info: prev.address === target ? prev.info : null,
        error: LOAD_ERROR,
      }))
    }
  }, [])

  useEffect(() => {
    if (!address) return
    let cancelled = false
    getAccountInfo(address)
      .then((info) => {
        if (!cancelled) setState({ address, info, error: '' })
      })
      .catch(() => {
        if (!cancelled) setState({ address, info: null, error: LOAD_ERROR })
      })
    return () => {
      cancelled = true
    }
  }, [address])

  const refresh = useCallback(async () => {
    if (!address) return
    setRefreshing(true)
    await load(address)
    setRefreshing(false)
  }, [address, load])

  const fund = useCallback(async () => {
    if (!address) return
    setFunding(true)
    try {
      await fundWithFriendbot(address)
      await load(address)
    } catch (err) {
      setState((prev) => ({
        ...prev,
        error: err instanceof Error ? err.message : 'Friendbot falló.',
      }))
    } finally {
      setFunding(false)
    }
  }, [address, load])

  // Si cambió la cuenta, los datos viejos no se muestran.
  const current = state.address === address ? state : EMPTY

  return {
    info: current.info,
    error: current.error,
    loading: address !== null && current.address !== address,
    refreshing,
    funding,
    refresh,
    fund,
  }
}
