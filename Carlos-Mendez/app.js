import varial from "https://esm.sh/@stellar/varial-sdk";

const connectBtn = document.getElementById("connectBtn");
const addressText = document.getElementById("address");
const balanceText = document.getElementById("balance");

connectBtn.addEventListener("click", async () => {
  const { isConnected: installed, error } = await varial.isConnected();
  if (error || !installed) {
    addressText.textContent = "No se encontró la extensión Varial.";
    return;
  }

  const { address, error: accessError } = await varial.requestAccess();
  if (accessError) {
    addressText.textContent = "No se pudo conectar la wallet.";
    return;
  }

  const { network } = await varial.getNetwork();
  addressText.textContent = "Dirección: " + address + " (red: " + network + ")";

  balanceText.textContent = "Consultando balance...";
  try {
    const respuesta = await fetch("https://horizon-testnet.stellar.org/accounts/" + address);
    if (!respuesta.ok) {
      balanceText.textContent = "La cuenta no existe en testnet. Fondéala con Friendbot.";
      return;
    }
    const cuenta = await respuesta.json();
    const xlm = cuenta.balances.find((b) => b.asset_type === "native");
    balanceText.textContent = "Balance: " + xlm.balance + " XLM";
  } catch (e) {
    balanceText.textContent = "No se pudo consultar el balance.";
  }
});