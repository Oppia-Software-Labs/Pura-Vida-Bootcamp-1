import { useEffect, useState } from 'react'

type CheckResult = {
  hash: string
  round: number
  status: 'confirmed' | 'failed' | 'unconfirmed'
}

const checkInterval = 2500
const maxChecks = 8

export function usePaymentConfirmation(hash: string | null) {
  const [round, setRound] = useState(0)
  const [result, setResult] = useState<CheckResult | null>(null)

  useEffect(() => {
    if (!hash) return

    let active = true
    let timer: number | undefined
    let remaining = maxChecks

    async function check(transactionHash: string) {
      const status = await import('./paymentTransaction')
        .then(({ getPaymentConfirmation }) => getPaymentConfirmation(transactionHash))
        .catch(() => 'pending' as const)
      if (!active) return

      if (status !== 'pending') {
        setResult({ hash: transactionHash, round, status })
        return
      }

      remaining -= 1
      if (remaining > 0) {
        timer = window.setTimeout(() => void check(transactionHash), checkInterval)
      } else {
        setResult({ hash: transactionHash, round, status: 'unconfirmed' })
      }
    }

    void check(hash)
    return () => {
      active = false
      window.clearTimeout(timer)
    }
  }, [hash, round])

  const status = result?.hash === hash && result.round === round ? result.status : 'checking'
  const checkAgain = () => setRound((current) => current + 1)

  return { status, checkAgain }
}
