import type { PaymentJournal } from './paymentFlow'
const key = (address: string) => `stellar-heist:testnet:pending:${address}`
/** Public tracking only. Never store a signed envelope, signature, secret or completion flag. */
export const paymentJournal: PaymentJournal = {
  read(address) { return JSON.parse(sessionStorage.getItem(key(address)) ?? 'null') },
  save(draft) { sessionStorage.setItem(key(draft.account), JSON.stringify(draft)) },
  clear(address) { sessionStorage.removeItem(key(address)) },
}
