const networks = new Map([
  ["PUBLIC", { label: "Mainnet", endpoint: "https://horizon.stellar.org" }],
  ["TESTNET", { label: "Testnet", endpoint: "https://horizon-testnet.stellar.org" }],
]);

export function lookupNetwork(network) {
  return networks.get(network);
}

export async function fetchBalance(endpoint, address) {
  const response = await fetch(`${endpoint}/accounts/${encodeURIComponent(address)}`, {
    signal: AbortSignal.timeout(10000),
    cache: "no-store",
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error("Horizon no respondió correctamente.");

  const account = await response.json();
  const balance = account.balances?.find(item => item.asset_type === "native");
  if (typeof balance?.balance !== "string") {
    throw new Error("Horizon no devolvió el saldo XLM.");
  }
  return balance.balance;
}
