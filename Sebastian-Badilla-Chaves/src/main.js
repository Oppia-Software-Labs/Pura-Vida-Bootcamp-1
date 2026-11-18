import { connectWallet, getConnectedAddress, getWalletNetwork } from "./wallet.js";
import { NETWORK_PASSPHRASE } from "./config.js";

const app = document.querySelector("#app");

const state = {
  address: null,
  networkOk: true,
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
  `;

  document.querySelector("#connect")?.addEventListener("click", onConnect);
  document.querySelector("#disconnect")?.addEventListener("click", onDisconnect);
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
  } catch (err) {
    setMessage("wallet-msg", err.message, "error");
  }
}

function onDisconnect() {
  // Freighter no expone un "logout": olvidamos la dirección en la app.
  state.address = null;
  render();
}

async function init() {
  render();
  const addr = await getConnectedAddress();
  if (addr) {
    state.address = addr;
    await checkNetwork();
    render();
  }
}

init();
