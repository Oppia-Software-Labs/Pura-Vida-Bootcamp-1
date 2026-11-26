import { Horizon, StrKey } from "@stellar/stellar-sdk";
import { testnetConfig } from "./config.ts";
import { StellarError } from "./errors.ts";

export function assertPublicAddress(address: string) {
  if (!StrKey.isValidEd25519PublicKey(address)) {
    throw new StellarError("address", "La dirección pública de Stellar no es válida.");
  }
}

export async function verifiedTestnetServer() {
  const { horizonUrl, networkPassphrase } = testnetConfig();
  const response = await fetch(horizonUrl, {
    redirect: "error",
    signal: AbortSignal.timeout(8000),
    cache: "no-store",
  });
  if (!response.ok) {
    throw new StellarError("network", "Horizon no está disponible. Volvé a intentar en un momento.");
  }

  const root = await response.json() as { network_passphrase?: string };
  if (root.network_passphrase !== networkPassphrase) {
    throw new StellarError("wrong-network", "Horizon respondió desde otra red o no pudo confirmar Testnet. La operación se detuvo.");
  }

  return new Horizon.Server(horizonUrl);
}
