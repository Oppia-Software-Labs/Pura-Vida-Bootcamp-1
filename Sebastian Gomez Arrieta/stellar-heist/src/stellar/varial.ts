import { Keypair, xdr } from '@stellar/stellar-sdk/base'
import { WalletError, stroopsToXlm } from './walletSession.ts'
import type { WalletPort } from './walletSession.ts'

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
    const server = new Server('https://soroban-testnet.stellar.org', { timeout: 10000 })
    const key = xdr.LedgerKey.account(new xdr.LedgerKeyAccount({ accountId: Keypair.fromPublicKey(address).xdrPublicKey() }))
    const result = await bounded(server.getLedgerEntries(key))
    if (!result.entries.length) return null
    const entry = result.entries[0].val
    if (entry.type !== 'account') throw new WalletError('rpc')
    return stroopsToXlm(BigInt(entry.value.balance.toString()))
  },
}
