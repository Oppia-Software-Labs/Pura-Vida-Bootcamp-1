import { useEffect, useSyncExternalStore } from 'react'
import { WalletSession } from '../stellar/walletSession'
import { varialPort } from '../stellar/varial'

const session = new WalletSession(varialPort)
export function useWallet() {
  const state = useSyncExternalStore(session.subscribe, session.getSnapshot)
  useEffect(() => {
    const check = () => { if (!document.hidden) void session.check() }
    const timer = window.setInterval(check, 1000)
    window.addEventListener('focus', check)
    document.addEventListener('visibilitychange', check)
    return () => {
      clearInterval(timer)
      window.removeEventListener('focus', check)
      document.removeEventListener('visibilitychange', check)
      session.disconnect()
    }
  }, [])
  return { ...state, connect: session.connect, disconnect: session.disconnect, refreshBalance: session.refreshBalance, signProof: session.signProof, cancelProof: session.cancelProof }
}
export type WalletConnection = ReturnType<typeof useWallet>
