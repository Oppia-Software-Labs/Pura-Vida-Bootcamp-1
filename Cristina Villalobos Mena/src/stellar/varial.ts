import { isConnected, requestAccess } from '@stellar/varial-sdk'

type WalletConnectionResult =
  | { status: 'connected'; address: string }
  | { status: 'extension-missing' }
  | { status: 'detection-error' }
  | { status: 'access-error' }

export async function connectVarialWallet(): Promise<WalletConnectionResult> {
  try {
    const { isConnected: installed, error } = await isConnected()

    if (error) {
      return { status: 'detection-error' }
    }

    if (!installed) {
      return { status: 'extension-missing' }
    }
  } catch {
    return { status: 'detection-error' }
  }

  try {
    const { address, error } = await requestAccess()

    if (error || !address?.trim()) {
      return { status: 'access-error' }
    }

    return { status: 'connected', address }
  } catch {
    return { status: 'access-error' }
  }
}