import { Horizon, Networks, NotFoundError } from "@stellar/stellar-sdk";

export const TESTNET_CONFIG = {
  horizonUrl: "https://horizon-testnet.stellar.org",
  friendbotUrl: "https://friendbot.stellar.org",
  networkPassphrase: Networks.TESTNET,
};

export const horizon = new Horizon.Server(TESTNET_CONFIG.horizonUrl);

function isNotFoundError(error) {
  return (
    error instanceof NotFoundError ||
    error?.name === "NotFoundError" ||
    error?.response?.status === 404
  );
}

export async function fetchTestnetXlmBalance(address) {
  try {
    const account = await horizon.loadAccount(address);
    const nativeBalance = account.balances.find(
      (entry) => entry.asset_type === "native"
    );

    return {
      funded: true,
      balance: nativeBalance?.balance ?? "0",
    };
  } catch (error) {
    if (isNotFoundError(error)) {
      return {
        funded: false,
        balance: "0",
      };
    }
    throw error;
  }
}

export async function fundTestnetAccount(address) {
  const url = `${TESTNET_CONFIG.friendbotUrl}?addr=${encodeURIComponent(
    address
  )}`;
  const response = await fetch(url);

  if (!response.ok) {
    let detail = "";
    try {
      const data = await response.json();
      detail = data?.detail || data?.title || "";
    } catch {
      // Si la respuesta no es JSON, usamos el código HTTP
    }
    throw new Error(
      detail ||
        `Friendbot devolvió un error (HTTP ${response.status}) al fondear la cuenta.`
    );
  }

  return response.json();
}
