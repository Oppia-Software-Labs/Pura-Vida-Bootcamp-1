export type ExperiencePhase = 'boot' | 'lobby' | 'entering' | 'mission' | 'returning'

/** GSAP owns these channels. Three.js reads them; it never writes narrative state. */
export interface SceneSignals {
  boot: number
  travel: number
  unlock: number
  door: number
  reveal: number
}

// Only a future trusted verification adapter may construct this evidence.
// This brand is an architectural boundary, NOT cryptographic verification.
declare const verifiedByTrustedAdapter: unique symbol
export interface TrustedVaultCompletion {
  readonly [verifiedByTrustedAdapter]: true
  readonly network: 'TESTNET'
  readonly transactionHash: string
  readonly account: string
  readonly verifiedMissions: readonly [true, true, true]
}

// No browser action, URL, localStorage value, or preview control sets this.
// Wallet, signature and payment verification are intentionally not implemented.
export const verifiedCompletion: TrustedVaultCompletion | null = null
