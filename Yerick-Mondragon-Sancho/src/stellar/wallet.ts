import {
  disconnect,
  getAddress,
  getNetwork,
  isConnected,
  requestAccess,
} from "@stellar/varial-sdk";

export const TESTNET_PASSPHRASE = "Test SDF Network ; September 2015";
export const HORIZON_TESTNET = "https://horizon-testnet.stellar.org";
export type WalletIdentity = {
  address: string;
  network: string;
  networkPassphrase: string;
};
export type AccountBalance =
  { kind: "funded"; balance: string } | { kind: "unfunded" };
export type WalletErrorCode =
  | "missing-wallet"
  | "rejected"
  | "wallet"
  | "timeout"
  | "network"
  | "horizon"
  | "invalid-data";

export class WalletError extends Error {
  code: WalletErrorCode;
  constructor(code: WalletErrorCode, message: string) {
    super(message);
    this.name = "WalletError";
    this.code = code;
  }
}

async function withTimeout<T>(
  promise: Promise<T>,
  milliseconds = 12000,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timer = setTimeout(
          () =>
            reject(
              new WalletError(
                "timeout",
                "La wallet tardó demasiado. Revise la extensión y vuelva a intentarlo.",
              ),
            ),
          milliseconds,
        );
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

export async function detectWallet(): Promise<boolean> {
  const result = await withTimeout(isConnected());
  if (result.error)
    throw new WalletError(
      "wallet",
      "No pudimos revisar la extensión. Desbloquee Varial y vuelva a intentarlo.",
    );
  return result.isConnected;
}

export async function authorizeWallet(): Promise<void> {
  // Pedimos permiso solamente cuando la persona presiona Conecte su wallet.
  const result = await withTimeout(requestAccess(), 90000);
  if (result.error || !result.address) {
    throw new WalletError(
      "rejected",
      "La conexión no fue autorizada. Puede volver a intentarlo cuando lo desee.",
    );
  }
}

export async function readWalletIdentity(): Promise<WalletIdentity> {
  const [account, network] = await Promise.all([
    withTimeout(getAddress()),
    withTimeout(getNetwork()),
  ]);
  if (account.error || network.error || !account.address) {
    throw new WalletError(
      "wallet",
      "No pudimos leer la wallet. Revise que esté desbloqueada y que el sitio siga autorizado.",
    );
  }
  if (!/^G[A-Z2-7]{55}$/.test(account.address)) {
    throw new WalletError(
      "invalid-data",
      "La wallet no devolvió una dirección pública válida de Stellar.",
    );
  }
  return {
    address: account.address,
    network: network.network,
    networkPassphrase: network.networkPassphrase,
  };
}

export function isTestnet(identity: WalletIdentity): boolean {
  // El nombre no alcanza: también comprobamos la passphrase oficial de la red.
  return (
    identity.network === "TESTNET" &&
    identity.networkPassphrase === TESTNET_PASSPHRASE
  );
}

export async function loadTestnetBalance(
  identity: WalletIdentity,
  signal?: AbortSignal,
): Promise<AccountBalance> {
  if (!isTestnet(identity))
    throw new WalletError(
      "network",
      "Seleccione Testnet en Varial para continuar.",
    );
  if (!/^G[A-Z2-7]{55}$/.test(identity.address))
    throw new WalletError("invalid-data", "La dirección pública no es válida.");
  let response: Response;
  try {
    // Usamos siempre nuestro endpoint de Testnet, nunca una URL enviada por la wallet.
    response = await fetch(
      `${HORIZON_TESTNET}/accounts/${encodeURIComponent(identity.address)}`,
      {
        signal: signal
          ? AbortSignal.any([signal, AbortSignal.timeout(15000)])
          : AbortSignal.timeout(15000),
        headers: { Accept: "application/json" },
      },
    );
  } catch (error) {
    if (signal?.aborted) throw error;
    throw new WalletError(
      "horizon",
      "No pudimos consultar Stellar Testnet. Revise su conexión a internet y vuelva a intentarlo.",
    );
  }
  // Una dirección todavía sin activar no equivale a un saldo confirmado de cero.
  if (response.status === 404) return { kind: "unfunded" };
  if (!response.ok)
    throw new WalletError(
      "horizon",
      response.status === 429
        ? "Testnet recibió muchas consultas. Espere un momento y actualice el saldo."
        : "Stellar Testnet no respondió correctamente. Vuelva a intentarlo en un momento.",
    );
  let data: { balances?: { asset_type?: string; balance?: string }[] };
  try {
    data = await response.json();
  } catch {
    throw new WalletError(
      "invalid-data",
      "Testnet devolvió una respuesta que no pudimos interpretar.",
    );
  }
  const nativeBalance = Array.isArray(data?.balances)
    ? data.balances.find((entry) => entry?.asset_type === "native")?.balance
    : undefined;
  if (
    typeof nativeBalance !== "string" ||
    !/^\d+\.\d{7}$/.test(nativeBalance)
  ) {
    throw new WalletError(
      "invalid-data",
      "La respuesta de Testnet no incluye un saldo XLM válido.",
    );
  }
  return { kind: "funded", balance: nativeBalance };
}

export async function revokeWalletAccess(): Promise<void> {
  const result = await withTimeout(disconnect());
  if (result.error)
    throw new WalletError(
      "wallet",
      "Cerramos la sesión local. Para revocar el permiso, quite este sitio de las conexiones de Varial.",
    );
}

export function errorMessage(error: unknown): string {
  return error instanceof WalletError
    ? error.message
    : "Ocurrió un error inesperado. Revise su wallet y vuelva a intentarlo.";
}

export function formatXlm(balance: string): string {
  // Conservamos los siete decimales sin convertir el saldo a un número de punto flotante.
  const [whole, decimals] = balance.split(".");
  return `${whole.replace(/\B(?=(\d{3})+(?!\d))/g, " ")}.${decimals}`;
}
