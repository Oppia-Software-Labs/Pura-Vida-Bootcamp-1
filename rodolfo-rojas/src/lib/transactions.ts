import { Asset, BASE_FEE, Keypair, Operation, TransactionBuilder, type Transaction, type xdr } from '@stellar/stellar-sdk'
import { NETWORK_PASSPHRASE, horizon, loadAccountSnapshot } from './stellar'

export type SignWithWallet = (xdr: string) => Promise<string>

export type TxReceipt = {
  hash: string
  feeXlm: string
}

const STROOPS_PER_XLM = 10_000_000
const EXPLORER_TX_URL = 'https://stellar.expert/explorer/testnet/tx'

export async function submitWithWallet(
  source: string,
  operation: xdr.Operation,
  sign: SignWithWallet,
): Promise<TxReceipt> {
  const tx = await buildTx(source, operation)
  const signedXdr = await sign(tx.toXDR())
  return submit(TransactionBuilder.fromXDR(signedXdr, NETWORK_PASSPHRASE) as Transaction)
}

export async function submitWithKeypair(keypair: Keypair, operation: xdr.Operation): Promise<TxReceipt> {
  const tx = await buildTx(keypair.publicKey(), operation)
  tx.sign(keypair)
  return submit(tx)
}

export async function sendXlm(source: string, destination: string, amount: string, sign: SignWithWallet) {
  const snapshot = await loadAccountSnapshot(destination)
  const operation =
    snapshot.status === 'unfunded'
      ? Operation.createAccount({ destination, startingBalance: amount })
      : Operation.payment({ destination, asset: Asset.native(), amount })
  return submitWithWallet(source, operation, sign)
}

export function txExplorerUrl(hash: string): string {
  return `${EXPLORER_TX_URL}/${hash}`
}

export function friendlyTxError(error: unknown): string {
  const codes = (error as { response?: { data?: { extras?: { result_codes?: unknown } } } })?.response?.data?.extras
    ?.result_codes
  if (codes) return `La red rechazó la transacción: ${JSON.stringify(codes)}`
  if (error instanceof Error) return error.message
  return (error as { message?: string })?.message ?? 'Algo salió mal. Probá de nuevo.'
}

async function buildTx(source: string, operation: xdr.Operation) {
  const account = await horizon.loadAccount(source)
  return new TransactionBuilder(account, { fee: BASE_FEE, networkPassphrase: NETWORK_PASSPHRASE })
    .addOperation(operation)
    .setTimeout(180)
    .build()
}

async function submit(tx: Transaction): Promise<TxReceipt> {
  const { hash } = await horizon.submitTransaction(tx)
  const record = await horizon.transactions().transaction(hash).call()
  return { hash, feeXlm: String(Number(record.fee_charged) / STROOPS_PER_XLM) }
}
