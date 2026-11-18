const HORIZON = "https://horizon-testnet.stellar.org";

// Devuelve el balance en XLM, o null si la cuenta aún no existe en testnet.
export async function getXlmBalance(address) {
  const res = await fetch(`${HORIZON}/accounts/${address}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("No se pudo consultar la red de Stellar");
  const data = await res.json();
  const native = data.balances.find((b) => b.asset_type === "native");
  return native ? native.balance : "0";
}
