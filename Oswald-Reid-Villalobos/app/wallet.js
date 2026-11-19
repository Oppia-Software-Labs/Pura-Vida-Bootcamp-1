// Conexión con la wallet Freighter (Stellar) y lectura de saldos en Testnet.
import * as freighter from "https://esm.sh/@stellar/freighter-api";

const HORIZON = "https://horizon-testnet.stellar.org";

// Las versiones de freighter-api devuelven a veces un valor y a veces un objeto.
const valor = (r, campo) => (r && typeof r === "object" ? r[campo] : r);

export async function conectarWallet() {
  const conectado = valor(await freighter.isConnected(), "isConnected");
  if (!conectado) {
    throw new Error("No encontré Freighter. Instalala desde freighter.app y recargá la página.");
  }

  const acceso = await freighter.requestAccess();
  if (acceso?.error) throw new Error(acceso.error.message || String(acceso.error));
  const direccion = valor(acceso, "address");
  if (!direccion) throw new Error("Freighter no compartió la dirección.");

  const red = await freighter.getNetwork();
  return { direccion, red: valor(red, "network") || "desconocida" };
}

export async function leerSaldos(direccion) {
  const r = await fetch(`${HORIZON}/accounts/${direccion}`);
  if (r.status === 404) return { cuentaNueva: true, xlm: 0, usdc: 0 };
  if (!r.ok) throw new Error(`Horizon respondió ${r.status}`);
  const cuenta = await r.json();
  const xlm = cuenta.balances.find((b) => b.asset_type === "native");
  const usdc = cuenta.balances.find((b) => b.asset_code === "USDC");
  return {
    cuentaNueva: false,
    xlm: Number(xlm?.balance ?? 0),
    usdc: Number(usdc?.balance ?? 0),
  };
}

export const corta = (d) => `${d.slice(0, 5)}…${d.slice(-4)}`;
