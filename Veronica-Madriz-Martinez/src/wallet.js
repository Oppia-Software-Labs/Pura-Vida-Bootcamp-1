// Conexión de wallet Stellar.
// Raven confirmó que Freighter ahora se llama Varial y que su librería es
// @stellar/varial-sdk (misma API: isConnected, requestAccess, getAddress,
// getNetwork, signTransaction). Probamos varias fuentes en orden y, si una
// falla, pasamos a la siguiente. Cada paso tiene tiempo límite para que el
// botón nunca se quede "colgado".
import { loadScript, withTimeout } from "./loader.js";

const SOURCES = [
  { name: "Varial", load: () => import("https://esm.sh/@stellar/varial-sdk") },
  { name: "Freighter", load: () => import("https://esm.sh/@stellar/freighter-api") },
  {
    name: "Freighter",
    load: async () => {
      await loadScript("https://cdn.jsdelivr.net/npm/@stellar/freighter-api/build/index.min.js");
      return window.freighterApi;
    },
  },
];

let api = null;
let walletName = "Varial";

function normalize(mod) {
  if (!mod) return null;
  if (typeof mod.requestAccess === "function") return mod;
  if (mod.default && typeof mod.default.requestAccess === "function") return mod.default;
  return null;
}

async function loadApi() {
  if (api) return api;
  const errors = [];
  for (const source of SOURCES) {
    try {
      const mod = normalize(await withTimeout(source.load(), 12000, `Tiempo agotado cargando ${source.name}`));
      if (mod) {
        api = mod;
        walletName = source.name;
        console.info(`[wallet] librería cargada: ${source.name}`);
        return api;
      }
      errors.push(`${source.name}: la librería no tiene requestAccess`);
    } catch (err) {
      console.warn(`[wallet] falló ${source.name}`, err);
      errors.push(`${source.name}: ${err.message}`);
    }
  }
  throw new Error(`No pude cargar la librería de la wallet (${errors.join(" | ")}). Revisa tu conexión o desactiva el bloqueador de anuncios.`);
}

export function getWalletName() {
  return walletName;
}

/** ¿Está instalada la extensión? */
export async function isInstalled() {
  const w = await loadApi();
  try {
    const res = await withTimeout(w.isConnected(), 4000, "timeout");
    return Boolean(res?.isConnected ?? res);
  } catch {
    return false;
  }
}

/** Si la app ya tiene permiso, devuelve la dirección sin abrir popup. */
export async function getConnectedAddress() {
  const w = await loadApi();
  if (!(await isInstalled())) return null;
  const { address, error } = await withTimeout(w.getAddress(), 4000, "timeout");
  if (error || !address) return null;
  return address;
}

/** Pide acceso a la wallet (abre el popup) y devuelve { address, network }. */
export async function connect() {
  const w = await loadApi();
  if (!(await isInstalled())) {
    throw new Error(
      "No detecté la extensión de la wallet. Instala Varial (varialwallet.com), desbloquéala, recarga la página y asegúrate de abrirla por http://localhost (no como archivo)."
    );
  }
  // Sin timeout corto aquí: el usuario puede tardar en aceptar el popup.
  const { address, error } = await withTimeout(w.requestAccess(), 120000, "No respondiste al popup de la wallet a tiempo.");
  if (error) throw new Error(error.message || String(error));
  if (!address) throw new Error("La wallet no devolvió ninguna dirección. ¿Rechazaste la conexión?");
  const network = await getNetwork();
  return { address, network };
}

/** Devuelve { network, networkPassphrase } de la wallet. */
export async function getNetwork() {
  const w = await loadApi();
  const res = await withTimeout(w.getNetwork(), 6000, "La wallet no respondió qué red usa.");
  if (res?.error) throw new Error(res.error.message || String(res.error));
  return { network: res.network, networkPassphrase: res.networkPassphrase };
}

/** Firma un XDR con la wallet y devuelve el XDR firmado. */
export async function sign(xdr, networkPassphrase, address) {
  const w = await loadApi();
  const res = await withTimeout(
    w.signTransaction(xdr, { networkPassphrase, address }),
    180000,
    "No firmaste a tiempo en la wallet."
  );
  if (res?.error) {
    const msg = res.error.message || String(res.error);
    throw new Error(/reject|declin|denied/i.test(msg) ? "Rechazaste la firma en la wallet." : msg);
  }
  return res.signedTxXdr;
}
