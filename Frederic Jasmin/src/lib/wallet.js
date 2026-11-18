import { StellarWalletsKit } from '@creit.tech/stellar-wallets-kit/sdk'
import { defaultModules } from '@creit.tech/stellar-wallets-kit/modules/utils'
import { Networks } from '@creit.tech/stellar-wallets-kit/types'

// La app trabaja en testnet: nada de lo que se haga aquí mueve dinero real.
StellarWalletsKit.init({
  modules: defaultModules(),
  network: Networks.TESTNET,
})

// Abre el modal del kit para que el usuario elija su wallet (Freighter, xBull, Albedo...)
// y devuelve la dirección pública (G...) de la cuenta conectada.
export async function connectWallet() {
  const { address } = await StellarWalletsKit.authModal()
  return address
}

export async function disconnectWallet() {
  await StellarWalletsKit.disconnect()
}

export function shortAddress(address) {
  return `${address.slice(0, 6)}...${address.slice(-6)}`
}

export { StellarWalletsKit }
