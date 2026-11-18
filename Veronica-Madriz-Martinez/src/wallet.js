// Conexión de wallet Stellar.
// Raven confirmó que Freighter ahora se llama Varial y que su librería es
// @stellar/varial-sdk (misma API: isConnected, requestAccess, getAddress,
// getNetwork, signTransaction). Si no carga, uso @stellar/freighter-api.

let api = null;
let walletName = "Varial";

async function loadApi() {
  if (api) return api;
  try {
    api = await import("https://esm.sh/@stellar/varial-sdk");
  } catch {
    api = await import("https://esm.sh/@stellar/freighter-api");
    walletName = "Freighter";
  }
  // Algunos builds exponen todo bajo `default`.
  if (!api.requestAccess && api.default) api = api.default;
  return api;
}

export function getWalletName() {
  return walletName;
}

/** ¿Está instalada la extensión? */
export async function isInstalled() {
  const w = await loadApi();
  const res = await w.isConnected();
  return Boolean(res?.isConnected ?? res);
}

/** Si la app ya tiene permiso, devuelve la dirección sin abrir popup. */
export async function getConnectedAddress() {
  const w = await loadApi();
  if (!(await isInstalled())) return null;
  const { address, error } = await w.getAddress();
  if (error || !address) return null;
  return address;
}

/** Pide acceso a la wallet (abre el popup) y devuelve { address, network }. */
export async function connect() {
  const w = await loadApi();
  if (!(await isInstalled())) {
    throw new Error(`No se encontró la extensión ${walletName}. Instálala desde varialwallet.com y recarga.`);
  }
  const { address, error } = await w.requestAccess();
  if (error) throw new Error(error.message || String(error));
  const network = await getNetwork();
  return { address, network };
}

/** Devuelve { network, networkPassphrase } de la wallet. */
export async function getNetwork() {
  const w = await loadApi();
  const res = await w.getNetwork();
  if (res?.error) throw new Error(res.error.message || String(res.error));
  return { network: res.network, networkPassphrase: res.networkPassphrase };
}

/** Firma un XDR con la wallet y devuelve el XDR firmado. */
export async function sign(xdr, networkPassphrase, address) {
  const w = await loadApi();
  const res = await w.signTransaction(xdr, { networkPassphrase, address });
  if (res?.error) {
    const msg = res.error.message || String(res.error);
    throw new Error(/reject|declin|denied/i.test(msg) ? "Rechazaste la firma en la wallet." : msg);
  }
  return res.signedTxXdr;
}
