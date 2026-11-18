import type { PlanError } from "@bloc/entity/plan";

const rules: [pattern: string, message: string][] = [
  ["Varial extension not installed", "Instala la extensión Varial para continuar."],
  ["Wallet is not on testnet", "Cambia Varial a la red de prueba (testnet)."],
  ["Wallet signature failed", "La wallet no firmó. Verifica que esté en testnet."],
  ["Horizon request failed", "No se pudo conectar con la red. Intenta de nuevo en un momento."],
  ["RPC request failed", "No se pudo leer el depósito en la red. Intenta de nuevo."],
  ["op_underfunded", "Te falta XLM para cubrir el depósito y la reserva."],
  ["op_low_reserve", "Te falta XLM para cubrir el depósito y la reserva."],
  ["op_malformed", "Los datos del depósito no son válidos."],
  ["op_no_trust", "Falta habilitar el activo en tu cuenta."],
  ["op_cannot_claim", "Todavía no (o ya no) puedes reclamar este depósito."],
  ["op_does_not_exist", "Este depósito ya fue reclamado."],
  ["tx_bad_seq", "Intenta de nuevo."],
  ["tx_too_late", "La transacción expiró. Intenta de nuevo."],
];

export function friendlyError(error: unknown): string {
  const text = error instanceof Error ? error.message : String(error);
  return rules.find(([pattern]) => text.includes(pattern))?.[1] ?? "Algo salió mal. Intenta de nuevo.";
}

export const planErrorMessages: Record<PlanError, string> = {
  invalid_tenant: "Tu dirección no es válida.",
  invalid_landlord: "La dirección del arrendador no es válida.",
  same_account: "El arrendador debe ser una cuenta distinta a la tuya.",
  invalid_amount: "Ingresa un monto mayor a 0 con hasta 7 decimales.",
  end_not_in_future: "El fin del contrato debe estar en el futuro.",
  deadline_not_after_end: "El plazo debe ser posterior al fin del contrato.",
  insufficient_balance: "Tu saldo no alcanza para el depósito y las reservas de la red.",
  invalid_repair_cap: "El tope de reparaciones no es válido.",
};
