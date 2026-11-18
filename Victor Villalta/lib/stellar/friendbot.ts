import { testnetConfig } from "./config.ts";
import { StellarError, horizonFailure } from "./errors.ts";
import { assertPublicAddress, verifiedTestnetServer } from "./server.ts";

export async function fundTestAccount(address: string) {
  assertPublicAddress(address);
  const server = await verifiedTestnetServer();

  try {
    await server.loadAccount(address);
    return false;
  } catch (error) {
    if (horizonFailure(error).status !== 404) throw error;
  }

  const url = new URL(testnetConfig().friendbotUrl);
  url.searchParams.set("addr", address);
  const response = await fetch(url, {
    cache: "no-store",
    redirect: "error",
    signal: AbortSignal.timeout(15000),
  });

  if (!response.ok) {
    // Otra pestaña o un intento previo puede haber creado la cuenta.
    try {
      await server.loadAccount(address);
      return false;
    } catch {
      throw new StellarError("network", "Friendbot no pudo fondear la cuenta. Esperá un momento y volvé a intentar.");
    }
  }
  return true;
}
