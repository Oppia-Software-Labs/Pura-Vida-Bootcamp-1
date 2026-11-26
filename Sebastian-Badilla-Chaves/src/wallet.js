import {
  isConnected,
  requestAccess,
  getAddress,
  getNetwork,
  signTransaction,
} from "@stellar/freighter-api";

// Conexión con la extensión Freighter (wallet oficial de Stellar).
// Docs: https://docs.freighter.app

export async function isFreighterInstalled() {
  const res = await isConnected();
  return !res.error && res.isConnected;
}

export async function connectWallet() {
  if (!(await isFreighterInstalled())) {
    throw new Error(
      "No encontramos Freighter. Instala la extensión desde freighter.app y recarga la página."
    );
  }
  const res = await requestAccess();
  if (res.error) throw new Error(errorMessage(res.error));
  return res.address;
}

// Si el usuario ya había autorizado la app, recupera la dirección sin abrir el popup.
export async function getConnectedAddress() {
  if (!(await isFreighterInstalled())) return null;
  const res = await getAddress();
  if (res.error || !res.address) return null;
  return res.address;
}

export async function getWalletNetwork() {
  const res = await getNetwork();
  if (res.error) throw new Error(errorMessage(res.error));
  return res;
}

export async function signWithWallet(xdr, networkPassphrase, address) {
  const res = await signTransaction(xdr, { networkPassphrase, address });
  if (res.error) throw new Error(errorMessage(res.error));
  return res.signedTxXdr;
}

function errorMessage(error) {
  if (typeof error === "string") return error;
  return error?.message || "Error desconocido de la wallet";
}
