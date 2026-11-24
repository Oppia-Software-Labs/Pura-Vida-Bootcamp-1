import type { PaymentState } from '../stellar/paymentFlow'

export type PaymentVisualStage = 'inactive' | 'authorized' | 'pending' | 'uncertain' | 'failed' | 'verified'

/** Presentation only. SUCCESS from the RPC alone is insufficient: require the validated receipt. */
export function paymentVisualStage(payment: PaymentState): PaymentVisualStage {
  if (payment.status === 'success' && payment.receipt) return 'verified'
  if (payment.status === 'failed') return 'failed'
  if (payment.status === 'uncertain') return 'uncertain'
  if (payment.status === 'submitting' && payment.authorized) return 'authorized'
  if (payment.status === 'confirming') {
    return payment.submissionStatus === 'PENDING' || payment.submissionStatus === 'DUPLICATE' ? 'pending' : 'uncertain'
  }
  return 'inactive'
}
