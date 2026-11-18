import { useCallback, useEffect, useRef, useState } from 'react'
import {
  type AccountInfo,
  fundWithFriendbot,
  getAccountInfo,
} from '@/lib/account'
import type { MateAsset } from '@/lib/assets'
import {
  buildTrustTx,
  horizonErrorMessage,
  MateError,
  submitMateTx,
} from '@/lib/mate'
import { signWithWallet, walletErrorMessage } from '@/lib/wallet'

type State = {
  /** Dirección a la que pertenecen los datos de este estado. */
  address: string | null
  info: AccountInfo | null
  error: string
}

/** Tarea en curso sobre una cuenta: se guarda de cuál para no mezclarlas. */
type Task = { address: string; what: string } | null

const EMPTY: State = { address: null, info: null, error: '' }

export const LOAD_ERROR = 'No pudimos leer el saldo. Revisá tu conexión.'

export function useAccount(address: string | null) {
  const [state, setState] = useState<State>(EMPTY)
  const [refreshing, setRefreshing] = useState(false)
  const [task, setTask] = useState<Task>(null)

  // Cuenta vigente: una respuesta que llega tarde, de una cuenta anterior,
  // no debe pisar los datos de la actual.
  const latest = useRef(address)
  useEffect(() => {
    latest.current = address
  }, [address])

  const load = useCallback(async (target: string) => {
    try {
      const info = await getAccountInfo(target)
      if (latest.current !== target) return
      setState({ address: target, info, error: '' })
    } catch {
      if (latest.current !== target) return
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

  /** Corre una tarea sobre la cuenta, recarga el saldo y muestra su error. */
  const run = useCallback(
    async (what: string, action: (target: string) => Promise<void>) => {
      if (!address) return
      setTask({ address, what })
      try {
        await action(address)
        await load(address)
      } catch (err) {
        if (latest.current !== address) return
        // Friendbot y MateError ya traen un mensaje para mostrar; el resto
        // son rechazos de Horizon o de la wallet, que hay que traducir.
        const ownMessage = what === 'fund' || err instanceof MateError
        const error =
          horizonErrorMessage(err) ||
          (ownMessage && err instanceof Error
            ? err.message
            : walletErrorMessage(err))
        setState((prev) => ({ ...prev, error }))
      } finally {
        // Una tarea vieja no apaga el indicador de otra cuenta.
        setTask((prev) => (prev?.address === address ? null : prev))
      }
    },
    [address, load],
  )

  /** Pide XLM de prueba a Friendbot para activar la cuenta. */
  const fund = useCallback(() => run('fund', fundWithFriendbot), [run])

  /** Habilita un activo (trustline) para que la cuenta pueda recibirlo. */
  const enable = useCallback(
    (asset: MateAsset) =>
      run(asset.code, async (target) => {
        const xdr = await buildTrustTx(target, asset)
        await submitMateTx(await signWithWallet(xdr, target))
      }),
    [run],
  )

  // Si cambió la cuenta, los datos viejos no se muestran.
  const current = state.address === address ? state : EMPTY
  const running = task?.address === address ? task.what : null

  return {
    info: current.info,
    error: current.error,
    loading: address !== null && current.address !== address,
    refreshing,
    funding: running === 'fund',
    /** Código del activo que se está habilitando, o null. */
    enabling: running !== null && running !== 'fund' ? running : null,
    refresh,
    fund,
    enable,
  }
}
