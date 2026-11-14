import { StellarWalletsKit, Networks } from "@creit.tech/stellar-wallets-kit";
import { defaultModules } from "@creit.tech/stellar-wallets-kit/modules/utils";


StellarWalletsKit.init({
  modules: defaultModules(),
  network: Networks.TESTNET,
});

export async function connectWallet() {
  const { address } = await StellarWalletsKit.authModal();
  return address;
}

export async function disconnectWallet() {
  await StellarWalletsKit.disconnect();
}

// Firma la transacción con la wallet conectada.
// Si la wallet nos dice en qué red está, revisamos que sea Testnet.
export async function signTip(xdr: string, address: string) {
  let red: string | null = null;
  try {
    red = (await StellarWalletsKit.getNetwork()).networkPassphrase;
  } catch {
    // Algunas wallets (como Lobstr) no dicen su red. No la bloqueamos:
    // si firma para otra red, Horizon la rechazará (tx_bad_auth).
    red = null;
  }
  if (red !== null && red !== Networks.TESTNET) {
    throw new Error("Tu wallet está en otra red. Cámbiala a Testnet y prueba otra vez.");
  }

  const { signedTxXdr } = await StellarWalletsKit.signTransaction(xdr, {
    networkPassphrase: Networks.TESTNET,
    address,
  });
  return signedTxXdr;
}