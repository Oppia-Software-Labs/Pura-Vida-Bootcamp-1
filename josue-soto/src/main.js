import { connectWallet, restoreWallet } from "./wallet.js";
import { describeOrder, executeProposal, fundWithFriendbot } from "./trade.js";

const $ = (id) => document.getElementById(id);
const state = { network: "testnet", address: null, history: [], config: null, busy: false };

const explorer = (hash, network) => `https://stellar.expert/explorer/${network === "mainnet" ? "public" : "testnet"}/tx/${hash}`;
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

/** Tiny, safe markdown: escape first, then headings, bold, code, bullets. */
function md(text) {
  const lines = esc(text).split("\n");
  let html = "", inList = false;
  for (const raw of lines) {
    let l = raw.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/`([^`]+)`/g, "<code>$1</code>");
    const bullet = /^\s*[-*•]\s+(.*)/.exec(l);
    if (bullet) { if (!inList) { html += "<ul>"; inList = true; } html += `<li>${bullet[1]}</li>`; continue; }
    if (inList) { html += "</ul>"; inList = false; }
    const h = /^#{1,4}\s+(.*)/.exec(l);
    if (h) html += `<h4>${h[1]}</h4>`;
    else if (l.trim()) html += `<p>${l}</p>`;
  }
  return html + (inList ? "</ul>" : "");
}

function addMsg(role, html) {
  const div = document.createElement("div");
  div.className = `msg ${role}`;
  div.innerHTML = html;
  $("log").append(div);
  $("log").scrollTop = $("log").scrollHeight;
  return div;
}

// ---------- network & wallet ----------
document.querySelectorAll(".seg button").forEach((btn) =>
  btn.addEventListener("click", () => {
    if (btn.dataset.net === "mainnet" && !confirm("Switch to MAINNET? Orders there use real funds.")) return;
    state.network = btn.dataset.net;
    document.querySelectorAll(".seg button").forEach((b) => b.classList.toggle("active", b === btn));
    $("mainnetWarn").hidden = state.network !== "mainnet";
    $("fundBtn").hidden = state.network !== "testnet";
    loadMarket();
  }),
);

function renderWallet() {
  const a = state.address;
  $("walletBtn").textContent = a ? `${a.slice(0, 4)}…${a.slice(-4)}` : "Connect wallet";
  $("walletBtn").classList.toggle("connected", !!a);
  $("walletBox").hidden = !a;
  $("addr").textContent = a ?? "";
}

$("walletBtn").addEventListener("click", async () => {
  if (state.address) {
    if (confirm("Disconnect wallet from this page?")) { state.address = null; renderWallet(); }
    return;
  }
  try {
    state.address = await connectWallet();
    renderWallet();
  } catch (e) {
    addMsg("error", `<p>${esc(e.message)}</p>`);
  }
});

$("fundBtn").addEventListener("click", async () => {
  $("fundBtn").disabled = true;
  try {
    await fundWithFriendbot(state.address);
    addMsg("system", "<p>Testnet account funded with 10,000 XLM.</p>");
  } catch (e) {
    addMsg("error", `<p>${esc(e.message)}</p>`);
  } finally {
    $("fundBtn").disabled = false;
  }
});

// ---------- market panel ----------
let marketTimer;
let marketGen = 0; // bumped per request; late responses from older requests are dropped
async function loadMarket() {
  clearTimeout(marketTimer);
  const gen = ++marketGen;
  const base = $("base").value.trim() || "XLM";
  const counter = $("counter").value.trim() || "USDC";
  try {
    const r = await fetch(`/api/market?network=${state.network}&base=${encodeURIComponent(base)}&counter=${encodeURIComponent(counter)}`);
    const d = await r.json();
    if (gen !== marketGen) return;
    if (!r.ok) throw new Error(d.error);
    const ob = d.order_book;
    const stat = (k, v) => `<div><span>${k}</span><strong>${v ?? "–"}</strong></div>`;
    $("stats").innerHTML =
      stat("Bid", ob.best_bid) + stat("Ask", ob.best_ask) + stat("Mid", ob.mid) + stat("Spread", ob.spread_pct != null ? `${ob.spread_pct}%` : null) +
      stat("Depth ±1% (bid/ask)", ob.depth_base ? `${ob.depth_base.bids_within_1pct} / ${ob.depth_base.asks_within_1pct}` : null) +
      stat("Slippage 100 buy", d.market_order_simulation.buy.slippage_vs_mid_pct != null ? `${d.market_order_simulation.buy.slippage_vs_mid_pct}%` : null);
    const rows = (lv) => lv.map((l) => `<tr><td>${l.price}</td><td>${l.base_amount}</td></tr>`).join("") || "<tr><td colspan=2 class=muted>empty</td></tr>";
    $("bids").innerHTML = rows(ob.top_bids);
    $("asks").innerHTML = rows(ob.top_asks);
    const p = d.liquidity_pool;
    $("pool").innerHTML = p
      ? `<h3>AMM pool</h3><p>Price <strong>${p.amm_price}</strong> (${p.amm_vs_book_mid_pct ?? "–"}% vs book) · fee ${p.fee_bp / 100}% · reserves ${Object.entries(p.reserves).map(([k, v]) => `${v.toLocaleString()} ${esc(k.split(":")[0])}`).join(" / ")}</p>`
      : `<h3>AMM pool</h3><p class="muted">No liquidity pool for this pair.</p>`;
    $("updated").textContent = `${d.pair} · ${d.price_unit} · ${new Date().toLocaleTimeString()}`;
  } catch (e) {
    if (gen !== marketGen) return;
    $("stats").innerHTML = `<p class="muted">${esc(e.message)}</p>`;
    $("bids").innerHTML = $("asks").innerHTML = $("pool").innerHTML = "";
  }
  if (gen === marketGen) marketTimer = setTimeout(loadMarket, 15000);
}
$("pairForm").addEventListener("submit", (e) => { e.preventDefault(); loadMarket(); });

// ---------- proposals ----------
function renderProposal(p) {
  const card = addMsg("proposal", `
    <div class="prop-head"><strong>${esc(p.strategy)}</strong><span class="tag ${p.network}">${p.network}</span></div>
    <p class="muted">${esc(p.rationale)}</p>
    <ol>${p.orders.map((o) => `<li><code>${esc(describeOrder(o))}</code></li>`).join("")}</ol>
    <div class="prop-actions">
      <button class="primary sign">Review &amp; sign in wallet</button>
      <button class="ghost dismiss">Dismiss</button>
    </div>
    <div class="prop-status"></div>`);
  const status = card.querySelector(".prop-status");
  card.querySelector(".dismiss").onclick = () => card.classList.add("dismissed");
  card.querySelector(".sign").onclick = async (ev) => {
    if (!state.address) return (status.textContent = "Connect your wallet first.");
    if (p.network !== state.network) return (status.textContent = `This proposal was made for ${p.network}; switch networks first.`);
    ev.target.disabled = true;
    status.textContent = "Waiting for wallet signature…";
    try {
      const { hash } = await executeProposal(p, state.config[p.network], state.address);
      status.innerHTML = `✅ Submitted · <a href="${explorer(hash, p.network)}" target="_blank" rel="noopener">${hash.slice(0, 12)}…</a>`;
      state.history.push({ role: "user", text: `[system note] I signed and submitted the "${p.strategy}" proposal (tx ${hash}).` });
      loadMarket();
    } catch (e) {
      status.textContent = `❌ ${e.message}`;
      ev.target.disabled = false;
    }
  };
}

// ---------- chat ----------
async function send(text) {
  if (state.busy || !text.trim()) return;
  state.busy = true;
  $("sendBtn").disabled = true;
  $("chips").hidden = true;
  addMsg("user", md(text));
  const pending = addMsg("assistant thinking", "<p>Analysing the DEX…</p>");
  try {
    const r = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ network: state.network, address: state.address, history: state.history, message: text }),
    });
    const d = await r.json();
    pending.remove();
    if (!r.ok) throw new Error(d.error);
    addMsg("assistant", md(d.reply));
    state.history.push({ role: "user", text }, { role: "assistant", text: d.reply });
    d.proposals.forEach(renderProposal);
  } catch (e) {
    pending.remove();
    addMsg("error", `<p>${esc(e.message)}</p>`);
  } finally {
    state.busy = false;
    $("sendBtn").disabled = false;
  }
}

$("chatForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const t = $("input").value;
  $("input").value = "";
  send(t);
});
$("input").addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); $("chatForm").requestSubmit(); }
});
$("chips").addEventListener("click", (e) => { if (e.target.tagName === "BUTTON") send(e.target.textContent); });

// ---------- boot ----------
(async () => {
  state.config = await (await fetch("/api/config")).json();
  state.address = await restoreWallet().catch(() => null);
  renderWallet();
  loadMarket();
})();
