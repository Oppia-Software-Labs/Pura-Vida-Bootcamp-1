import { Keypair, Networks, Transaction, TransactionBuilder, xdr } from '@stellar/stellar-sdk/base'
import { WalletError, stroopsToXlm } from './walletSession.ts'
import type { WalletPort } from './walletSession.ts'
import type { PaymentPort } from './paymentFlow.ts'
import { PaymentError, rpcInteger } from './payment.ts'

export const TESTNET_RPC = 'https://soroban-testnet.stellar.org'

async function bounded<T>(task: Promise<T>, timeout = 10000): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined
  try {
    return await Promise.race([task, new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new WalletError('timeout')), timeout) })])
  } finally { clearTimeout(timer) }
}
async function api() { return import('@stellar/varial-sdk') }
function checkError(error: { code?: number; message?: string } | undefined, fallback: 'provider' | 'rejected' | 'revoked') {
  if (error) throw new WalletError(error.code === -4 ? 'rejected' : /locked/i.test(error.message ?? '') ? 'locked' : fallback === 'rejected' ? 'provider' : fallback)
}
export const varialPort: WalletPort = {
  async signMessage(message, context) {
    const result = await bounded((await api()).signMessage(message, { address: context.address, networkPassphrase: context.passphrase }), 120000)
    checkError(result.error, 'provider')
    return { signedMessage: result.signedMessage, signerAddress: result.signerAddress }
  },
  async installed() {
    const result = await bounded((await api()).isConnected())
    checkError(result.error, 'provider')
    return result.isConnected
  },
  async authorize() {
    const result = await bounded((await api()).requestAccess(), 120000)
    checkError(result.error, 'rejected')
    if (!result.address) throw new WalletError('rejected')
  },
  async context() {
    const wallet = await api()
    const allowed = await bounded(wallet.isAllowed())
    checkError(allowed.error, 'revoked')
    if (!allowed.isAllowed) throw new WalletError('revoked')
    const [address, network] = await Promise.all([bounded(wallet.getAddress()), bounded(wallet.getNetworkDetails())])
    checkError(address.error, 'revoked'); checkError(network.error, 'provider')
    return { address: address.address, passphrase: network.networkPassphrase }
  },
  async balance(address) {
    const { Server } = await import('@stellar/stellar-sdk/rpc')
    const server = new Server(TESTNET_RPC, { timeout: 10000 })
    const key = xdr.LedgerKey.account(new xdr.LedgerKeyAccount({ accountId: Keypair.fromPublicKey(address).xdrPublicKey() }))
    const result = await bounded(server.getLedgerEntries(key))
    if (!result.entries.length) return null
    const entry = result.entries[0].val
    if (entry.type !== 'account') throw new WalletError('rpc')
    return stroopsToXlm(BigInt(entry.value.balance.toString()))
  },
}

async function rpcServer() {
  const { Server } = await import('@stellar/stellar-sdk/rpc')
  return new Server(TESTNET_RPC, { timeout: 10000 })
}
export const varialPayments: PaymentPort = {
  async load(address) {
    const server = await rpcServer()
    const key = xdr.LedgerKey.account(new xdr.LedgerKeyAccount({ accountId: Keypair.fromPublicKey(address).xdrPublicKey() }))
    const [network, ledger, response] = await Promise.all([bounded(server.getNetwork()), bounded(server.getLatestLedger()), bounded(server.getLedgerEntries(key))])
    if (network.passphrase !== Networks.TESTNET) throw new PaymentError('network')
    const entry = response.entries[0]?.val
    if (!entry) throw new PaymentError('inactive')
    if (entry.type !== 'account' || !entry.value.accountId.equals(Keypair.fromPublicKey(address).xdrPublicKey())) throw new PaymentError('rpc')
    const account = entry.value
    const ext = account.ext.type === 'v1' ? account.ext.value : null
    const sponsorship = ext?.ext.type === 'v2' ? ext.ext.value : null
    return {
      address, passphrase: network.passphrase, sequence: account.seqNum.toString(), balance: account.balance,
      sellingLiabilities: ext?.liabilities.selling ?? 0n, subentries: account.numSubEntries,
      sponsoring: sponsorship?.numSponsoring ?? 0, sponsored: sponsorship?.numSponsored ?? 0,
      baseReserve: BigInt(ledger.headerXdr.baseReserve), baseFee: BigInt(ledger.headerXdr.baseFee), ledger: ledger.sequence,
      closeTime: Number(ledger.headerXdr.scpValue.closeTime),
    }
  },
  async sign(draft, context) {
    const result = await bounded((await api()).signTransaction(draft.unsignedXdr, { address: context.address, networkPassphrase: context.passphrase }), 120000)
    checkError(result.error, 'provider')
    return { signedTxXdr: result.signedTxXdr, signerAddress: result.signerAddress }
  },
  async send(envelope, signal) {
    const transaction = TransactionBuilder.fromXDR(envelope, Networks.TESTNET)
    if (!(transaction instanceof Transaction)) throw new PaymentError('modified')
    const server = await rpcServer()
    if (signal?.aborted) throw new PaymentError('session')
    const result = await bounded(server.sendTransaction(transaction))
    return { hash: result.hash, status: result.status }
  },
  async lookup(hash) {
    const result = await bounded((await rpcServer()).getTransaction(hash))
    // SDK 17 types declare numbers, but the current RPC returns timestamp strings unchanged.
    const base = { hash: result.txHash, status: result.status, oldestLedger: rpcInteger(result.oldestLedger), latestLedger: rpcInteger(result.latestLedger), latestLedgerCloseTime: rpcInteger(result.latestLedgerCloseTime) }
    if (result.status === 'NOT_FOUND') return base
    return { ...base, ledger: rpcInteger(result.ledger), createdAt: rpcInteger(result.createdAt), envelope: result.envelopeXdr.toXdr('base64'), result: result.resultXdr.toXdr('base64') }
  },
}
