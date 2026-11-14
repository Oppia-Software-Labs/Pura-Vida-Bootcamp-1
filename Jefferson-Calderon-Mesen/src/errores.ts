import { TransactionFailedError } from "@stellar/stellar-sdk";

export function mensajeDeError(error: unknown): string {
  // 1) Errores de Horizon: la red recibió la transacción pero la rechazó
  if (error instanceof TransactionFailedError) {
    const { transaction, operations } = error.getResultCodes();
    if (operations.includes("op_underfunded") || transaction === "tx_insufficient_balance") {
      return "Saldo insuficiente. Recuerda que tu cuenta debe guardar al menos 1 XLM de reserva.";
    }
    if (operations.includes("op_no_destination")) {
      return "La cuenta del creador no existe en Testnet.";
    }
    if (transaction === "tx_too_late") {
      return "La transacción venció (tardaste más de 3 minutos en firmar). Prueba otra vez.";
    }
    if (transaction === "tx_bad_seq") {
      return "Tu cuenta cambió mientras firmabas. Prueba otra vez.";
    }
    if (transaction === "tx_bad_auth") {
      return "La firma no sirve para Testnet. Tu wallet firmó en otra red: usa Freighter (Varial) en Testnet.";
    }
    return `Stellar rechazó la transacción (${transaction} ${operations.join(", ")}).`;
  }

  // 2) Errores de la wallet: el kit lanza objetos { code, message }, no un Error
  if (typeof error === "object" && error !== null && "code" in error) {
    if ((error as { code: number }).code === -4) {
      return "Cancelaste la firma en Freighter. No se envió nada.";
    }
  }

  // 3) Nuestros propios errores (por ejemplo, el de red equivocada)
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error !== null && "message" in error) {
    return String((error as { message: unknown }).message);
  }
  return "Algo salió mal. Prueba otra vez.";
}