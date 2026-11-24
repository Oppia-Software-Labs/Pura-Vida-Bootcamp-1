import { Keypair, Networks, StrKey } from '@stellar/stellar-sdk/base'
import type { WalletContext } from './walletSession.ts'

export interface SignedMessage { signedMessage: string | Uint8Array | null; signerAddress: string }
export type ProofIssue = 'invalid' | 'account' | 'network' | 'expired' | 'replayed' | 'challenge' | 'origin' | 'cancelled'
export class ProofError extends Error {
  readonly code: ProofIssue
  constructor(code: ProofIssue) { super(code); this.code = code }
}
export const CHALLENGE_LIFETIME = 180000
const PURPOSE = 'Abrir el segundo sello de Stellar Heist. Prueba local de control de la clave; no autoriza pagos.'
export interface MessageChallenge {
  readonly nonce: string
  readonly origin: string
  readonly address: string
  readonly passphrase: string
  readonly issuedAt: number
  readonly expiresAt: number
  readonly message: string
}
function text(challenge: Omit<MessageChallenge, 'message'>) {
  return [
    'Stellar Heist — The Genesis Vault',
    `Propósito: ${PURPOSE}`, `Origen: ${challenge.origin}`, `Dirección: ${challenge.address}`,
    `Red: Stellar Testnet (${challenge.passphrase})`, `Nonce: ${challenge.nonce}`,
    `Emitido: ${new Date(challenge.issuedAt).toISOString()}`, `Vence: ${new Date(challenge.expiresAt).toISOString()}`,
    'No gastarás XLM. No se envía ninguna transacción.',
  ].join('\n')
}
function validate(context: WalletContext) {
  if (context.passphrase !== Networks.TESTNET) throw new ProofError('network')
  if (!StrKey.isValidEd25519PublicKey(context.address)) throw new ProofError('account')
}
/** SDK v7 declares base64 strings or legacy Buffers (Uint8Array); reject all other formats. */
export function signatureBytes(signature: unknown): Uint8Array {
  if (signature instanceof Uint8Array && signature.length === 64) return Uint8Array.from(signature)
  if (typeof signature !== 'string' || !/^[A-Za-z0-9+/]{86}==$/.test(signature)) throw new ProofError('invalid')
  try {
    const raw = atob(signature)
    if (raw.length !== 64 || btoa(raw) !== signature) throw new ProofError('invalid')
    return Uint8Array.from(raw, char => char.charCodeAt(0))
  } catch { throw new ProofError('invalid') }
}
export function verifySep53(address: string, message: string, signature: unknown) {
  try {
    // verifyMessage adds the prefix and hashes exactly once. Do not prehash or base64-encode the message.
    return Keypair.fromPublicKey(address).verifyMessage(message, signatureBytes(signature))
  } catch { return false }
}

/** In-memory, single-use local challenges. This is not server authentication. */
export class MessageChallenges {
  private pending: MessageChallenge | null = null
  private consumed = new Set<string>()
  private readonly now: () => number
  constructor(now: () => number = Date.now) { this.now = now }
  create(context: WalletContext, origin: string): MessageChallenge {
    validate(context)
    let url: URL
    try { url = new URL(origin) } catch { throw new ProofError('origin') }
    if (url.origin !== origin || !['https:', 'http:'].includes(url.protocol)) throw new ProofError('origin')
    const nonce = Array.from(crypto.getRandomValues(new Uint8Array(32)), byte => byte.toString(16).padStart(2, '0')).join('')
    if (this.consumed.has(nonce)) throw new ProofError('challenge')
    const issuedAt = this.now()
    const fields = { nonce, origin, address: context.address, passphrase: context.passphrase, issuedAt, expiresAt: issuedAt + CHALLENGE_LIFETIME }
    this.pending = Object.freeze({ ...fields, message: text(fields) })
    return this.pending
  }
  verifyAndConsume(challenge: MessageChallenge, response: SignedMessage, context: WalletContext, origin: string) {
    if (this.consumed.has(challenge.nonce)) throw new ProofError('replayed')
    if (this.pending !== challenge || challenge.message !== text(challenge)) throw new ProofError('challenge')
    validate(context)
    if (context.passphrase !== challenge.passphrase) throw new ProofError('network')
    if (context.address !== challenge.address || response.signerAddress !== challenge.address) throw new ProofError('account')
    if (origin !== challenge.origin) throw new ProofError('origin')
    const current = this.now()
    if (current < challenge.issuedAt || current >= challenge.expiresAt) throw new ProofError('expired')
    if (!verifySep53(challenge.address, challenge.message, response.signedMessage)) throw new ProofError('invalid')
    if (this.now() >= challenge.expiresAt) throw new ProofError('expired')
    this.consumed.add(challenge.nonce)
    this.pending = null
  }
  abandon(challenge: MessageChallenge | undefined) { if (this.pending === challenge) this.pending = null }
  cancel() { this.pending = null }
  clear() { this.pending = null; this.consumed.clear() }
}
