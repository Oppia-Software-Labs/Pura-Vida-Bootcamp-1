import { config, getXlmBalance } from "./stellar.js";
import * as wallet from "./wallet.js";

const $ = (id) => document.getElementById(id);

export const state = { address: null, network: null, balance: null };

export function showStatus(message, type = "info") {
  const el = $("status");
  el.hidden = false;
  el.className = `status ${type}`;
  el.innerHTML = message;
}

export function shortAddress(a) {
  return a ? `${a.slice(0, 6)}…${a.slice(-6)}` : "";
}

export async function refreshBalance() {
  if (!state.address) return;
  $("balance").textContent = "Cargando…";
  try {
    state.balance = await getXlmBalance(state.address);
    if (state.balance === null) {
      $("balance").textContent = "Cuenta sin fondear";
      $("fund-btn").hidden = false;
    } else {
      $("balance").textContent = `${Number(state.balance).toLocaleString("es-CR", { maximumFractionDigits: 7 })} XLM`;
      $("fund-btn").hidden = true;
    }
  } catch (err) {
    $("balance").textContent = "Error";
    showStatus(`No pude leer el balance: ${err.message}`, "error");
  }
  updateSendButton();
}

export function updateSendButton() {
  $("send-btn").disabled = !(state.address && state.balance !== null && state.network === config.network);
}

function render() {
  const connected = Boolean(state.address);
  $("wallet-disconnected").hidden = connected;
  $("wallet-connected").hidden = !connected;
  if (!connected) return updateSendButton();

  $("address").textContent = shortAddress(state.address);
  $("address").title = state.address;
  const ok = state.network === config.network;
  $("network").innerHTML = ok
    ? `<span class="ok">● ${state.network}</span>`
    : `<span class="warn">● ${state.network || "desconocida"} — cambia tu wallet a Testnet</span>`;
  updateSendButton();
}

async function onConnect() {
  const btn = $("connect-btn");
  btn.disabled = true;
  btn.textContent = "Conectando…";
  try {
    const { address, network } = await wallet.connect();
    state.address = address;
    state.network = network.network;
    render();
    await refreshBalance();
    showStatus(`Wallet ${wallet.getWalletName()} conectada.`, "success");
  } catch (err) {
    showStatus(err.message, "error");
  } finally {
    btn.disabled = false;
    btn.textContent = "Conectar wallet";
  }
}

function onDisconnect() {
  // Las extensiones no tienen "logout" desde la dApp: olvidamos la sesión local.
  Object.assign(state, { address: null, network: null, balance: null });
  render();
  showStatus("Wallet desconectada de la app.", "info");
}

async function restoreSession() {
  try {
    const address = await wallet.getConnectedAddress();
    if (!address) return;
    state.address = address;
    state.network = (await wallet.getNetwork()).network;
    render();
    await refreshBalance();
  } catch {
    /* sin extensión o sin permiso: queda desconectado */
  }
}

$("connect-btn").addEventListener("click", onConnect);
$("disconnect-btn").addEventListener("click", onDisconnect);
$("refresh-btn").addEventListener("click", refreshBalance);
$("copy-btn").addEventListener("click", async () => {
  await navigator.clipboard.writeText(state.address);
  showStatus("Dirección copiada.", "info");
});

render();
restoreSession();
