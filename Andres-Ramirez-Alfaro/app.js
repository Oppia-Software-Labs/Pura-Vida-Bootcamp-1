import * as mod from "https://esm.sh/@stellar/freighter-api";

// esm.sh a veces envuelve las funciones dentro de "default"
const freighter = mod.default ?? mod;
console.log("Freighter exports:", Object.keys(freighter));

const btn = document.getElementById("connect");
const statusEl = document.getElementById("status");
const addressEl = document.getElementById("address");

btn.addEventListener("click", async () => {
  try {
    const conn = await freighter.isConnected();
    const connected = typeof conn === "boolean" ? conn : conn.isConnected;
    if (!connected) {
      statusEl.textContent = "Freighter no está instalada. Instálala en freighter.app";
      return;
    }

    const access = await freighter.requestAccess();
    if (access && access.error) {
      statusEl.textContent = "Error: " + (access.error.message || access.error);
      return;
    }

    const address = typeof access === "string" ? access : access.address;
    statusEl.textContent = "Conectada ✅";
    addressEl.textContent = address;
    showBalance(address);
  } catch (e) {
    statusEl.textContent = "Error: " + e.message;
  }
});

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