import { Asset, BASE_FEE, Keypair, Networks, Operation, Transaction, TransactionBuilder } from '@stellar/stellar-sdk'
import { Server } from '@stellar/stellar-sdk/rpc'
import { signTransaction } from '@stellar/varial-sdk'
import type { PaymentDetails } from './payment'
import { verifyWallet } from './wallet'

const testnet = new Server('https://soroban-testnet.stellar.org', { timeout: 10000 })

export async function authorizePayment(payer: string, details: PaymentDetails) {
  const [source] = await Promise.all([
    testnet.getAccount(payer),
    testnet.getAccount(details.address),
  ]).catch(() => {
    throw new Error('No se pudieron consultar las cuentas. Revisá que ambas estén activadas en Testnet.')
  })

  const transaction = new TransactionBuilder(source, {
    fee: BASE_FEE,
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(Operation.payment({
      destination: details.address,
      amount: details.amount,
      asset: Asset.native(),
    }))
    .setTimeout(180)
    .build()

  await verifyWallet(payer)
  const approval = await signTransaction(transaction.toXDR(), {
    address: payer,
    networkPassphrase: Networks.TESTNET,
  })

  if (approval.error?.code === -4) {
    throw new Error('Cancelaste el pago en Varial.')
  }
  if (approval.error || !approval.signedTxXdr) {
    throw new Error('Varial no pudo firmar el pago. Volvé a intentarlo.')
  }

  const hash = transaction.hash()
  const signer = Keypair.fromPublicKey(payer)
  try {
    const signed = TransactionBuilder.fromXDR(approval.signedTxXdr, Networks.TESTNET)
    if (signed instanceof Transaction
      && signed.hash().every((byte, index) => byte === hash[index])
      && signed.signatures.some(({ signature }) => signer.verify(hash, signature))) {
      return signed
    }
  } catch {
    throw new Error('No se pudo leer la transacción firmada por Varial.')
  }

  throw new Error('La firma de Varial no coincide con el pago que revisaste.')
}

const submissionStatuses = {
  PENDING: 'submitted',
  DUPLICATE: 'submitted',
  TRY_AGAIN_LATER: 'retry',
  ERROR: 'rejected',
} as const

export async function submitPayment(transaction: Transaction) {
  const hash = Array.from(transaction.hash(), (byte) => byte.toString(16).padStart(2, '0')).join('')
  try {
    const result = await testnet.sendTransaction(transaction)
    const status = result.hash === hash ? submissionStatuses[result.status] : undefined
    return { status: status ?? 'unknown', hash } as const
  } catch {
    return { status: 'unknown', hash } as const
  }
}

export async function getPaymentConfirmation(hash: string) {
  const result = await testnet.getTransaction(hash)
  if (result.txHash === hash) {
    if (result.status === 'SUCCESS') return 'confirmed'
    if (result.status === 'FAILED') return 'failed'
  }
  return 'pending'
}
