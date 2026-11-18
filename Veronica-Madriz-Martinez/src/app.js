import {
  config,
  getXlmBalance,
  fundWithFriendbot,
  isValidAddress,
  buildPaymentXdr,
  submitSignedXdr,
  explainHorizonError,
} from "./stellar.js";
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

// --- Friendbot -------------------------------------------------------------
$("fund-btn").addEventListener("click", async () => {
  const btn = $("fund-btn");
  btn.disabled = true;
  btn.textContent = "Fondeando…";
  showStatus("Pidiendo XLM de prueba a Friendbot…", "info");
  try {
    await fundWithFriendbot(state.address);
    showStatus("¡Cuenta fondeada con XLM de Testnet!", "success");
    await refreshBalance();
  } catch (err) {
    showStatus(`Friendbot: ${err.message}`, "error");
  } finally {
    btn.disabled = false;
    btn.textContent = "Fondear con Friendbot";
  }
});

// --- Envío de propinas -----------------------------------------------------
document.querySelectorAll(".chip").forEach((chip) =>
  chip.addEventListener("click", () => ($("amount").value = chip.dataset.amount))
);

let sending = false;
$("send-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  if (sending) return; // evita doble envío

  const dest = $("dest").value.trim();
  const amount = Number($("amount").value);
  const memo = $("memo").value.trim();

  if (!isValidAddress(dest)) return showStatus("La dirección destino no es una cuenta Stellar válida (G…).", "error");
  if (dest === state.address) return showStatus("No puedes enviarte una propina a ti misma/o.", "error");
  if (!(amount > 0)) return showStatus("Escribe un monto mayor a 0.", "error");
  // Reserva mínima de 1 XLM + comisión.
  if (Number(state.balance) - amount < 1) return showStatus("Ese monto dejaría tu cuenta bajo la reserva mínima (1 XLM).", "error");

  if (!confirm(`¿Enviar ${amount} XLM a ${shortAddress(dest)}?`)) return;

  sending = true;
  $("send-btn").disabled = true;
  try {
    // Verifica la red justo antes de firmar.
    const { network, networkPassphrase } = await wallet.getNetwork();
    if (networkPassphrase && networkPassphrase !== config.networkPassphrase) {
      state.network = network;
      render();
      throw new Error("Tu wallet no está en Testnet. Cámbiala y vuelve a intentar.");
    }

    showStatus("Armando la transacción…", "info");
    const xdr = await buildPaymentXdr(state.address, dest, amount, memo);

    showStatus(`Confirma la firma en ${wallet.getWalletName()}…`, "info");
    const signed = await wallet.sign(xdr, config.networkPassphrase, state.address);

    showStatus("Enviando a la red…", "info");
    const res = await submitSignedXdr(signed);

    showStatus(
      `¡Propina enviada! 🎉 <a href="${config.explorerTx(res.hash)}" target="_blank" rel="noopener">Ver transacción</a><br><code>${res.hash}</code>`,
      "success"
    );
    $("send-form").reset();
    await refreshBalance();
  } catch (err) {
    showStatus(explainHorizonError(err), "error");
  } finally {
    sending = false;
    updateSendButton();
  }
});

render();
restoreSession();
