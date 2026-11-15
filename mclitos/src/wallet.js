export const TESTNET_PASSPHRASE = 'Test SDF Network ; September 2015';
const HORIZON = 'https://horizon-testnet.stellar.org';
const isAddress = value => typeof value === 'string' && /^G[A-Z2-7]{55}$/.test(value);

// Solo usamos lectura de cuenta y permisos de dirección; nunca solicitamos firmas.
export function createWalletClient(sdk, fetcher = fetch) {
  async function checkNetwork() {
    const result = await sdk.getNetworkDetails();
    if (result.error) throw new Error('No se pudo leer la red de la wallet. Desbloqueala e intentá de nuevo.');
    if (result.networkPassphrase !== TESTNET_PASSPHRASE) {
      throw new Error('Cambiá tu wallet a Testnet y volvé a conectar.');
    }
  }

  async function checkAccount(address) {
    const current = await sdk.getAddress();
    if (current.error || current.address !== address) {
      throw new Error('La cuenta de la wallet cambió o está bloqueada. Desconectá y volvé a conectar.');
    }
    await checkNetwork();
  }

  return {
    async connect() {
      const connection = await sdk.isConnected();
      if (connection.error || !connection.isConnected) {
        throw new Error('Instalá Varial (antes Freighter) y desbloqueá la extensión para conectar.');
      }
      const access = await sdk.requestAccess();
      if (access.error) throw new Error('No se autorizó la conexión. Podés volver a intentarlo.');
      if (!isAddress(access.address)) throw new Error('La wallet no devolvió una dirección válida.');
      await checkNetwork();
      return access.address;
    },

    async loadBalances(address) {
      if (!isAddress(address)) throw new Error('La dirección pública no es válida.');
      // Se comprueba la sesión antes de cada lectura para no mostrar otra cuenta o red.
      await checkAccount(address);
      let response;
      try {
        response = await fetcher(HORIZON + '/accounts/' + encodeURIComponent(address), {
          signal: AbortSignal.timeout(15000),
        });
      } catch {
        throw new Error('No se pudo consultar el saldo. Revisá tu conexión y volvé a intentar.');
      }
      if (response.status === 404) {
        throw new Error('Esta cuenta todavía no está activada en Testnet. Usá Stellar Lab para obtener XLM de prueba y actualizá.');
      }
      if (!response.ok) throw new Error('Horizon no está disponible. Intentá actualizar en unos minutos.');
      let account;
      try {
        account = await response.json();
        if (!account || !Array.isArray(account.balances) || account.balances.some(balance =>
          !balance || typeof balance.balance !== 'string' || !/^\d+\.\d{7}$/.test(balance.balance) ||
          (balance.asset_type !== 'native' &&
            (typeof balance.asset_code !== 'string' || !isAddress(balance.asset_issuer)))
        )) throw new Error();
      } catch {
        throw new Error('Horizon devolvió una respuesta inesperada.');
      }
      // La wallet pudo cambiar mientras Horizon respondía.
      await checkAccount(address);
      return account.balances.map(balance => ({
        code: balance.asset_type === 'native' ? 'XLM' : balance.asset_code,
        issuer: balance.asset_type === 'native' ? null : balance.asset_issuer,
        amount: balance.balance,
      }));
    },
  };
}
