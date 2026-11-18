import { isConnected, requestAccess } from "https://esm.sh/@stellar/freighter-api";

const btn = document.getElementById("connect");
const statusEl = document.getElementById("status");
const addressEl = document.getElementById("address");

btn.addEventListener("click", async () => {
  const conn = await isConnected();
  if (!conn.isConnected) {
    statusEl.textContent = "Freighter no está instalada. Instálala en freighter.app";
    return;
  }
  const access = await requestAccess();
  if (access.error) {
    statusEl.textContent = "Error: " + access.error;
    return;
  }
  statusEl.textContent = "Conectada ✅";
  addressEl.textContent = access.address;
  showBalance(access.address);
  
async function showBalance(address) {
  const balanceEl = document.getElementById("balance");
  try {
    const res = await fetch("https://horizon-testnet.stellar.org/accounts/" + address);
    if (!res.ok) throw new Error("Cuenta no encontrada en testnet");
    const data = await res.json();
    const xlm = data.balances.find((b) => b.asset_type === "native");
    balanceEl.textContent = "Balance: " + xlm.balance + " XLM (testnet)";
  } catch (e) {
    balanceEl.textContent = "No se pudo leer el balance: " + e.message;
  }
}

});