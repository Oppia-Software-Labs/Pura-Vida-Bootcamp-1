// Traduce los errores de Freighter, Horizon y la validación a mensajes claros.

export class AppError extends Error {}

const INSUFFICIENT = new Set([
  "tx_insufficient_balance",
  "op_underfunded",
  "op_low_reserve",
  "tx_insufficient_fee",
]);

export function friendlyError(e) {
  if (e instanceof AppError) return e.message;

  const msg = String(e?.message ?? e ?? "");

  // Freighter (Varial) no está instalada o no responde.
  if (/not connected|not installed|not available/i.test(msg)) {
    return "No se encontró la wallet Freighter. Instala la extensión desde freighter.app, recarga la página y vuelve a intentarlo.";
  }

  // El usuario cerró o rechazó la ventana de firma.
  if (/reject|declin|denied|cancel/i.test(msg)) {
    return "Rechazaste la solicitud en Freighter. No se envió nada.";
  }

  // Códigos de resultado de Horizon.
  const codes = e?.resultCodes;
  if (codes) {
    const all = [codes.transaction, ...(codes.operations ?? [])].filter(Boolean);
    if (all.some((c) => INSUFFICIENT.has(c))) {
      return "Saldo insuficiente: no tienes XLM suficientes para el monto, la comisión y la reserva mínima de la cuenta.";
    }
    if (all.includes("op_no_trust")) return "La cuenta de destino no tiene trustline para este activo.";
    if (all.includes("tx_bad_seq")) return "La secuencia de la cuenta cambió. Pulsa Actualizar e inténtalo otra vez.";
    if (all.includes("tx_too_late")) return "La transacción expiró antes de enviarse. Vuelve a intentarlo.";
    return `La red rechazó la transacción (${all.join(", ")}).`;
  }

  if (/network|fetch|timeout/i.test(msg)) {
    return "No se pudo contactar con Horizon testnet. Revisa tu conexión e inténtalo de nuevo.";
  }

  return msg || "Ocurrió un error inesperado.";
}
