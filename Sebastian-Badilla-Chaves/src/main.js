import {
  connectWallet,
  getConnectedAddress,
  getWalletNetwork,
  signWithWallet,
} from "./wallet.js";
import { getXlmBalance, fundWithFriendbot, sendPayment } from "./stellar.js";
import { NETWORK_PASSPHRASE, EXPLORER_ACCOUNT_URL, EXPLORER_TX_URL } from "./config.js";

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
    ${state.address && state.balance ? renderSend() : ""}
  `;

  document.querySelector("#connect")?.addEventListener("click", onConnect);
  document.querySelector("#disconnect")?.addEventListener("click", onDisconnect);
  document.querySelector("#refresh")?.addEventListener("click", loadBalance);
  document.querySelector("#fund")?.addEventListener("click", onFund);
  document.querySelector("#send-form")?.addEventListener("submit", onSend);
}

function renderSend() {
  return `
    <section class="card">
      <h2>3 · Enviar XLM</h2>
      <form id="send-form">
        <label>Destino
          <input name="to" placeholder="G…" required autocomplete="off" />
        </label>
        <label>Monto (XLM)
          <input name="amount" type="number" min="0.0000001" step="0.0000001" placeholder="10" required />
        </label>
        <label>Memo (opcional)
          <input name="memo" maxlength="28" placeholder="¡Pura vida!" />
        </label>
        <button type="submit" id="send-btn">Firmar con Freighter y enviar</button>
      </form>
      <p id="send-msg" class="msg"></p>
    </section>
  `;
}

async function onSend(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const data = new FormData(form);
  const btn = form.querySelector("#send-btn");
  btn.disabled = true;
  setMessage("send-msg", "Esperando tu firma en Freighter…");
  try {
    const result = await sendPayment({
      from: state.address,
      to: data.get("to").trim(),
      amount: data.get("amount"),
      memo: data.get("memo").trim(),
      sign: (xdr) => signWithWallet(xdr, NETWORK_PASSPHRASE, state.address),
    });
    await loadBalance();
    const msg = document.querySelector("#send-msg");
    msg.className = "msg ok";
    msg.innerHTML = `✅ ¡Enviado! <a href="${EXPLORER_TX_URL}${result.hash}" target="_blank" rel="noopener">Ver transacción ↗</a>`;
  } catch (err) {
    setMessage("send-msg", err.message, "error");
    btn.disabled = false;
  }
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
