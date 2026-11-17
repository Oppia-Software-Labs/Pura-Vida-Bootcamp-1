import { Networks, StrKey } from '@stellar/stellar-sdk'
import { disconnect, getAddress, getNetwork, isConnected, requestAccess } from '@stellar/varial-sdk'

export class WalletError extends Error {
  readonly missing: boolean

  constructor(message: string, missing = false) {
    super(message)
    this.missing = missing
  }
}

async function requireTestnet() {
  const { networkPassphrase, error } = await getNetwork()
  if (error) throw new WalletError('Abrí Varial y verificá que tu wallet esté desbloqueada.')
  if (networkPassphrase !== Networks.TESTNET) {
    throw new WalletError('Seleccioná Testnet en Varial y volvé a intentar.')
  }
}

export async function connectWallet() {
  const { isConnected: installed } = await isConnected()
  if (!installed) throw new WalletError('Instalá la extensión de Varial para conectar tu wallet.', true)

  const { address, error } = await requestAccess()
  if (error || !StrKey.isValidEd25519PublicKey(address)) {
    throw new WalletError('Autorizá la conexión en Varial para continuar.')
  }
  await requireTestnet()
  return address
}

export async function verifyWallet(expectedAddress: string) {
  const { address, error } = await getAddress()
  if (error || address !== expectedAddress) {
    throw new WalletError('Volvé a conectar tu wallet para confirmar la cuenta receptora.')
  }
  await requireTestnet()
}

export async function disconnectWallet() {
  const { error } = await disconnect()
  if (error) throw new WalletError('Podés revocar el acceso a esta página desde Varial.')
}
