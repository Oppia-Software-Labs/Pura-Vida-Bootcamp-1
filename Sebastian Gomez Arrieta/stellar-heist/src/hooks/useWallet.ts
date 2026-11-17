import { useEffect, useSyncExternalStore } from 'react'
import { WalletSession } from '../stellar/walletSession'
import { varialPayments, varialPort } from '../stellar/varial'
import { paymentJournal } from '../stellar/paymentJournal'

const session = new WalletSession(varialPort, undefined, { port: varialPayments, journal: paymentJournal })
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
  return { ...state, connect: session.connect, disconnect: session.disconnect, refreshBalance: session.refreshBalance, signProof: session.signProof, cancelProof: session.cancelProof, preparePayment: session.preparePayment, submitPayment: session.submitPayment, checkPayment: session.checkPayment, cancelPayment: session.cancelPayment }
}
export type WalletConnection = ReturnType<typeof useWallet>
