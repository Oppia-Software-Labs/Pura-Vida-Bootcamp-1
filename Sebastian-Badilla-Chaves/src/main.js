import { connectWallet, getConnectedAddress, getWalletNetwork } from "./wallet.js";
import { getXlmBalance, fundWithFriendbot } from "./stellar.js";
import { NETWORK_PASSPHRASE, EXPLORER_ACCOUNT_URL } from "./config.js";

const app = document.querySelector("#app");

const state = {
  address: null,
  networkOk: true,
  balance: undefined, // undefined = cargando, null = cuenta sin fondear
};

function shortAddress(addr) {
  return `${addr.slice(0, 6)}…${addr.slice(-6)}`;
}

function render() {
  app.innerHTML = `
    <section class="card" id="wallet-section">
      <h2>1 · Conecta tu wallet</h2>
      ${
        state.address
          ? `
        <p class="ok">✅ Wallet conectada</p>
        <p class="mono" title="${state.address}">${shortAddress(state.address)}</p>
        ${
          state.networkOk
            ? ""
            : `<p class="warn">⚠️ Tu Freighter no está en Testnet. Cámbiala a Testnet en la extensión.</p>`
        }
        <button id="disconnect" class="secondary">Desconectar</button>
      `
          : `
        <p>Conecta tu wallet <strong>Freighter</strong> para ver tu saldo y enviar XLM en Testnet.</p>
        <button id="connect">Conectar wallet</button>
        <p class="hint">¿No tienes Freighter? Instálala en <a href="https://www.freighter.app" target="_blank" rel="noopener">freighter.app</a>.</p>
      `
      }
      <p id="wallet-msg" class="msg"></p>
    </section>
    ${state.address ? renderBalance() : ""}
  `;

  document.querySelector("#connect")?.addEventListener("click", onConnect);
  document.querySelector("#disconnect")?.addEventListener("click", onDisconnect);
  document.querySelector("#refresh")?.addEventListener("click", loadBalance);
  document.querySelector("#fund")?.addEventListener("click", onFund);
}

function renderBalance() {
  let body;
  if (state.balance === undefined) {
    body = `<p class="balance">Cargando…</p>`;
  } else if (state.balance === null) {
    body = `
      <p>Esta cuenta todavía no existe en Testnet.</p>
      <button id="fund">Fondear con Friendbot (10 000 XLM de prueba)</button>
    `;
  } else {
    body = `
      <p class="balance">${Number(state.balance).toLocaleString("es-CR", { maximumFractionDigits: 7 })} <span>XLM</span></p>
      <div class="row">
        <button id="refresh" class="secondary">Actualizar saldo</button>
        <a class="link" href="${EXPLORER_ACCOUNT_URL}${state.address}" target="_blank" rel="noopener">Ver en Stellar Expert ↗</a>
      </div>
    `;
  }
  return `
    <section class="card">
      <h2>2 · Tu saldo</h2>
      ${body}
      <p id="balance-msg" class="msg"></p>
    </section>
  `;
}

async function loadBalance() {
  if (!state.address) return;
  try {
    state.balance = await getXlmBalance(state.address);
    render();
  } catch (err) {
    setMessage("balance-msg", `No se pudo leer el saldo: ${err.message}`, "error");
  }
}

async function onFund() {
  setMessage("balance-msg", "Pidiendo XLM a Friendbot…");
  try {
    await fundWithFriendbot(state.address);
    await loadBalance();
  } catch (err) {
    setMessage("balance-msg", err.message, "error");
  }
}

function setMessage(id, text, type = "") {
  const el = document.querySelector(`#${id}`);
  if (!el) return;
  el.textContent = text;
  el.className = `msg ${type}`;
}

async function checkNetwork() {
  try {
    const net = await getWalletNetwork();
    state.networkOk = net.networkPassphrase === NETWORK_PASSPHRASE;
  } catch {
    state.networkOk = true;
  }
}

async function onConnect() {
  setMessage("wallet-msg", "Abriendo Freighter…");
  try {
    state.address = await connectWallet();
    await checkNetwork();
    render();
    await loadBalance();
  } catch (err) {
    setMessage("wallet-msg", err.message, "error");
  }
}

function onDisconnect() {
  // Freighter no expone un "logout": olvidamos la dirección en la app.
  state.address = null;
  state.balance = undefined;
  render();
}

async function init() {
  render();
  const addr = await getConnectedAddress();
  if (addr) {
    state.address = addr;
    await checkNetwork();
    render();
    await loadBalance();
  }
}

init();
