import { Buffer } from 'buffer'
import { Client } from 'chess_registry'
import { CONTRACT_ID, NETWORK_PASSPHRASE, RPC_URL } from './config'
import { makeSigner } from './wallet'

function client(address?: string) {
  return new Client({ contractId: CONTRACT_ID, networkPassphrase: NETWORK_PASSPHRASE, rpcUrl: RPC_URL, publicKey: address, signTransaction: address ? makeSigner(address) : undefined })
}
export async function registerGame(address: string, hash: Uint8Array, white: string, black: string, result: number) {
  const tx = await client(address).register_game({ registrar: address, pgn_hash: Buffer.from(hash), white, black, result })
  return tx.signAndSend()
}
export async function getGame(hash: Uint8Array, address?: string) {
  const tx = await client(address).get_game({ pgn_hash: Buffer.from(hash) })
  return tx.result
}
export async function gamesBy(address: string) {
  const tx = await client(address).games_by({ registrar: address })
  return tx.result
}
export function friendlyError(e: unknown): string {
  const m = String((e as Error)?.message ?? e)
  if (/Error\(Contract, #1\)/.test(m)) return 'Esta partida ya fue registrada.'
  if (/Error\(Contract, #2\)/.test(m)) return 'Resultado inválido.'
  if (/Error\(Contract, #3\)/.test(m)) return 'El atestador no está habilitado en el contrato.'
  return m
}
