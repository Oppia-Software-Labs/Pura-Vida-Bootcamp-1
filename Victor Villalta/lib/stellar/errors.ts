export type StellarErrorKind =
  | "missing-wallet" | "wallet-rejected" | "wrong-network" | "wallet-changed"
  | "address" | "destination" | "balance" | "network" | "signature"
  | "expired" | "rebuild" | "pending";

export class StellarError extends Error {
  readonly kind: StellarErrorKind;

  constructor(kind: StellarErrorKind, message: string) {
    super(message);
    this.kind = kind;
    this.name = "StellarError";
  }
}

export function errorMessage(error: unknown) {
  return error instanceof StellarError
    ? error.message
    : "No pudimos comunicarnos con Testnet. Revisá tu conexión e intentá de nuevo.";
}

export function horizonFailure(error: unknown) {
  type Problem = {
    status?: number;
    extras?: { result_codes?: { transaction?: string; operations?: string[] } };
  };
  const failure = error as { name?: string; response?: Problem & { data?: Problem } } | null;
  const response = failure?.response;
  const codes = (response?.data ?? response)?.extras?.result_codes;
  return {
    status: response?.status ?? response?.data?.status ?? (failure?.name === "NotFoundError" ? 404 : undefined),
    transaction: codes?.transaction,
    operations: codes?.operations ?? [],
  };
}
