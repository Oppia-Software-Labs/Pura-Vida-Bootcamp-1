import { Horizon, NotFoundError } from "@stellar/stellar-sdk";

// Servidor Horizon de la red de prueba (Testnet)
export const horizon = new Horizon.Server("https://horizon-testnet.stellar.org");

const FRIENDBOT_URL = "https://friendbot.stellar.org";

// Devuelve el saldo de XLM como texto (ej: "10000.0000000"),
// o null si la cuenta todavía no existe en la red (no está fondeada).
export async function getBalance(address: string): Promise<string | null> {
  try {
    const account = await horizon.loadAccount(address);
    // "native" = XLM, la moneda propia de Stellar
    const xlm = account.balances.find((b) => b.asset_type === "native");
    return xlm?.balance ?? "0";
  } catch (error) {
    if (error instanceof NotFoundError) {
      return null; // La cuenta no existe todavía
    }
    throw error; // Cualquier otro error sí lo dejamos pasar
  }
}

// Le pide a Friendbot que le regale XLM de prueba a esta cuenta
export async function fundWithFriendbot(address: string) {
  const respuesta = await fetch(`${FRIENDBOT_URL}?addr=${encodeURIComponent(address)}`);
  if (!respuesta.ok) {
    throw new Error("Friendbot no pudo fondear la cuenta");
  }
}