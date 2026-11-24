// Funciones que hablan con la red Stellar (Horizon + Friendbot) usando el SDK oficial.
// El SDK se carga desde index.html y queda disponible como window.StellarSdk.
import { RED, RESERVA_MINIMA_XLM } from "./config.js";

const Sdk = window.StellarSdk;
// Si el SDK no cargó (sin internet), no rompemos el módulo: app.js muestra el aviso.
const servidor = Sdk ? new Sdk.Horizon.Server(RED.horizonUrl) : null;

/** ¿Es una dirección pública válida? (empieza con G y tiene 56 caracteres) */
export function direccionValida(direccion) {
  return Sdk.StrKey.isValidEd25519PublicKey((direccion || "").trim());
}

/** Lee la cuenta. Devuelve null si todavía no existe en la red (no ha sido fondeada). */
export async function cargarCuenta(direccion) {
  try {
    return await servidor.loadAccount(direccion);
  } catch (e) {
    if (e?.response?.status === 404 || e?.name === "NotFoundError") return null;
    throw e;
  }
}

/** Saldos de la cuenta en un formato simple. */
export async function obtenerSaldos(direccion) {
  const cuenta = await cargarCuenta(direccion);
  if (!cuenta) return null;
  return cuenta.balances.map((b) => ({
    activo: b.asset_type === "native" ? "XLM" : `${b.asset_code} (${b.asset_issuer.slice(0, 6)}…)`,
    saldo: b.balance,
  }));
}

/** Pide XLM de prueba a Friendbot (solo funciona en testnet). */
export async function fondearConFriendbot(direccion) {
  const resp = await fetch(`${RED.friendbotUrl}?addr=${encodeURIComponent(direccion)}`);
  const datos = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    const detalle = datos?.detail || datos?.title || `HTTP ${resp.status}`;
    if (/already ?funded|AlreadyExist/i.test(String(detalle))) {
      throw new Error("Esta cuenta ya fue fondeada antes. Friendbot solo regala XLM una vez por cuenta.");
    }
    throw new Error(`Friendbot falló: ${detalle}`);
  }
  return datos.hash || datos.id;
}

/** Valida el monto: número positivo con máximo 7 decimales (límite de Stellar). */
export function validarMonto(monto) {
  const texto = String(monto ?? "").trim();
  if (!/^\d+(\.\d{1,7})?$/.test(texto) || Number(texto) <= 0) {
    throw new Error("El monto debe ser un número mayor que 0 con máximo 7 decimales (ej. 10 o 2.5).");
  }
  return texto;
}

/** El memo de texto admite máximo 28 BYTES (una tilde ocupa 2 y un emoji hasta 4 u 8). */
export function validarMemo(memo) {
  const texto = (memo || "").trim();
  if (new TextEncoder().encode(texto).length > 28) {
    throw new Error("El memo es muy largo: máximo 28 bytes (las tildes y emojis cuentan doble o más).");
  }
  return texto;
}

/**
 * Construye (sin firmar) una transacción que envía XLM.
 * Si el destino aún no existe, usa la operación createAccount (necesita mínimo 1 XLM).
 * Devuelve el XDR: la transacción codificada como texto, lista para que la wallet la firme.
 */
export async function construirPago({ origen, destino, monto, memo }) {
  monto = validarMonto(monto);
  memo = validarMemo(memo);
  const cuentaOrigen = await cargarCuenta(origen);
  if (!cuentaOrigen) throw new Error("Tu cuenta aún no existe en testnet. Fondéala primero con Friendbot.");
  const destinoExiste = (await cargarCuenta(destino)) !== null;
  if (!destinoExiste && Number(monto) < RESERVA_MINIMA_XLM) {
    throw new Error(`El destino todavía no existe: para crearlo debes enviar al menos ${RESERVA_MINIMA_XLM} XLM.`);
  }

  const operacion = destinoExiste
    ? Sdk.Operation.payment({ destination: destino, asset: Sdk.Asset.native(), amount: String(monto) })
    : Sdk.Operation.createAccount({ destination: destino, startingBalance: String(monto) });

  const builder = new Sdk.TransactionBuilder(cuentaOrigen, {
    fee: Sdk.BASE_FEE, // 100 stroops = 0.00001 XLM
    networkPassphrase: RED.passphrase,
  })
    .addOperation(operacion)
    .setTimeout(180); // la transacción caduca en 3 minutos si no se envía

  if (memo) builder.addMemo(Sdk.Memo.text(memo));

  return { xdr: builder.build().toXDR(), tipo: destinoExiste ? "payment" : "createAccount" };
}

/** Envía a la red una transacción ya firmada (en XDR). */
export async function enviarTransaccion(xdrFirmado) {
  const tx = Sdk.TransactionBuilder.fromXDR(xdrFirmado, RED.passphrase);
  try {
    return await servidor.submitTransaction(tx);
  } catch (e) {
    const codigos = e?.response?.data?.extras?.result_codes;
    throw new Error(codigos ? `La red rechazó la transacción: ${JSON.stringify(codigos)}` : e.message);
  }
}

/** Últimos pagos (entrantes y salientes) de la cuenta. */
export async function ultimosPagos(direccion, limite = 10) {
  try {
    const pag = await servidor.payments().forAccount(direccion).order("desc").limit(limite).call();
    return pag.records.map((p) => ({
      tipo: p.type,
      fecha: p.created_at,
      de: p.from || p.funder || p.source_account,
      para: p.to || p.account,
      monto: p.amount || p.starting_balance,
      activo: p.asset_type === "native" || p.type === "create_account" ? "XLM" : p.asset_code,
      hash: p.transaction_hash,
    }));
  } catch (e) {
    if (e?.response?.status === 404) return [];
    throw e;
  }
}
