import { networks } from 'chess_registry'
export const NETWORK_PASSPHRASE = networks.testnet.networkPassphrase
export const CONTRACT_ID = networks.testnet.contractId
export const RPC_URL = 'https://soroban-testnet.stellar.org'
export const RESULTS = ['1-0', '0-1', '½-½'] as const

// Controles de tiempo del reloj: base en minutos + incremento en segundos por jugada.
export const TIME_CONTROLS = [
  { label: 'Sin reloj', base: 0, inc: 0 },
  { label: '1 + 0 · Bullet', base: 1, inc: 0 },
  { label: '3 + 2 · Blitz', base: 3, inc: 2 },
  { label: '5 + 0 · Blitz', base: 5, inc: 0 },
  { label: '10 + 0 · Rápida', base: 10, inc: 0 },
  { label: '15 + 10 · Rápida', base: 15, inc: 10 },
  { label: '30 + 0 · Clásica', base: 30, inc: 0 },
] as const
