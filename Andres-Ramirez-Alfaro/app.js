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
});