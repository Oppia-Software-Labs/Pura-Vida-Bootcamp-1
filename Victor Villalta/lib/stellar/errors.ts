export type StellarErrorKind =
  | "missing-wallet" | "wallet-rejected" | "wrong-network" | "wallet-changed"
  | "address" | "destination" | "balance" | "network" | "signature"
  | "expired" | "rebuild" | "pending";

export class StellarError extends Error {
  constructor(readonly kind: StellarErrorKind, message: string) {
    super(message);
    this.name = "StellarError";
  }
}

export function errorMessage(error: unknown) {
  return error instanceof StellarError
    ? error.message
    : "No pudimos comunicarnos con Testnet. Revisá tu conexión e intentá de nuevo.";
}

export function horizonFailure(error: unknown) {
  const response = (error as { response?: {
    status?: number;
    data?: { extras?: { result_codes?: { transaction?: string; operations?: string[] } } };
  } } | null)?.response;
  const codes = response?.data?.extras?.result_codes;
  return {
    status: response?.status,
    transaction: codes?.transaction,
    operations: codes?.operations ?? [],
  };
}
