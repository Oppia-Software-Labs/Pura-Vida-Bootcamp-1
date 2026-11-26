import { Networks, StellarWalletsKit } from '@creit-tech/stellar-wallets-kit'
import { AlbedoModule } from '@creit-tech/stellar-wallets-kit/modules/albedo'
import { LobstrModule } from '@creit-tech/stellar-wallets-kit/modules/lobstr'
import { VarialModule } from '@creit-tech/stellar-wallets-kit/modules/varial'
import { xBullModule } from '@creit-tech/stellar-wallets-kit/modules/xbull'
import { useCallback, useState } from 'react'
import { NETWORK_PASSPHRASE, loadAccountSnapshot, type AccountSnapshot } from '../lib/stellar'

// defaultModules() pulls in the MetaMask module, which imports the old npm v1 kit and breaks the build.
StellarWalletsKit.init({
  modules: [new VarialModule(), new xBullModule(), new LobstrModule(), new AlbedoModule()],
  network: Networks.TESTNET,
})

export function useWallet() {
  const [address, setAddress] = useState<string | null>(null)
  const [account, setAccount] = useState<AccountSnapshot | null>(null)
  const [onTestnet, setOnTestnet] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadAccount = useCallback(async (target: string) => {
    try {
      setAccount(await loadAccountSnapshot(target))
    } catch (e) {
      setError(messageOf(e))
    }
  }, [])

  const refresh = useCallback(async () => {
    if (!address) return
    await loadAccount(address)
  }, [address, loadAccount])

  const connect = useCallback(async () => {
    setError(null)
    try {
      const { address } = await StellarWalletsKit.authModal()
      setAddress(address)
      setOnTestnet(await isWalletOnTestnet())
      await loadAccount(address)
    } catch (e) {
      setError(messageOf(e))
    }
  }, [loadAccount])

  const disconnect = useCallback(async () => {
    await StellarWalletsKit.disconnect()
    setAddress(null)
    setAccount(null)
  }, [])

  const signTransaction = useCallback(async (xdr: string) => {
    const { signedTxXdr } = await StellarWalletsKit.signTransaction(xdr, {
      networkPassphrase: NETWORK_PASSPHRASE,
      address: address ?? undefined,
    })
    return signedTxXdr
  }, [address])

  return { address, account, onTestnet, error, connect, disconnect, refresh, signTransaction }
}

export type Wallet = ReturnType<typeof useWallet>

async function isWalletOnTestnet(): Promise<boolean> {
  try {
    const { networkPassphrase } = await StellarWalletsKit.getNetwork()
    return networkPassphrase === NETWORK_PASSPHRASE
  } catch {
    return true
  }
}

function messageOf(error: unknown): string {
  if (error instanceof Error) return error.message
  const message = (error as { message?: string })?.message
  return message ?? 'Algo salió mal. Probá de nuevo.'
}
