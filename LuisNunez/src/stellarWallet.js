function withTimeout(promise, timeoutMs, message) {
  let timeoutId
  const timeout = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error(message)), timeoutMs)
  })

  return Promise.race([promise, timeout]).finally(() => clearTimeout(timeoutId))
}

export class WalletNotInstalledError extends Error {
  constructor() {
    super('No encontramos Freighter. Instala la extensión y vuelve a intentarlo.')
    this.name = 'WalletNotInstalledError'
  }
}

export async function connectFreighter(sdk, timeoutMs = 15000) {
  const connection = await withTimeout(
    sdk.isConnected(),
    timeoutMs,
    'Freighter no respondió. Desbloquea la extensión e inténtalo de nuevo.',
  )

  if (connection.error) {
    throw new Error(connection.error.message || 'No se pudo detectar Freighter.')
  }
  if (!connection.isConnected) {
    throw new WalletNotInstalledError()
  }

  const access = await withTimeout(
    sdk.requestAccess(),
    timeoutMs,
    'Freighter no respondió a la solicitud de acceso. Revisa la extensión.',
  )

  if (access.error) {
    throw new Error(access.error.message || 'Freighter rechazó el acceso.')
  }
  if (!access.address) {
    throw new Error('La wallet no devolvió una dirección pública.')
  }

  const networkDetails = await withTimeout(
    sdk.getNetworkDetails(),
    timeoutMs,
    'Freighter no respondió con la información de la red.',
  )

  if (networkDetails.error) {
    throw new Error(
      networkDetails.error.message || 'No se pudo obtener la red de la wallet.',
    )
  }
  if (!networkDetails.network || !networkDetails.networkUrl) {
    throw new Error('Freighter no devolvió una red Stellar válida.')
  }

  return {
    address: access.address,
    network: networkDetails.network,
    networkUrl: networkDetails.networkUrl,
  }
}
