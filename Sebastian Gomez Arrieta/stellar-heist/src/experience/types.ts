export type ExperiencePhase = 'boot' | 'lobby' | 'entering' | 'mission' | 'returning'
export type ProofVisualState = 'idle' | 'scanning' | 'verified'

/** GSAP owns these channels. Three.js reads them; it never writes narrative state. */
export interface SceneSignals {
  boot: number
  travel: number
  unlock: number
  door: number
  reveal: number
}

// Verified against official Testnet RPC in this browser; not server-authenticated evidence.
export type { VerifiedPayment as VaultCompletion } from '../stellar/payment'
