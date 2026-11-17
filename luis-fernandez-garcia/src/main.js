import { EVENTS } from './events.js';
import { connectWallet, currentAddress, short } from './wallet.js';
import { buyTicket } from './stellar.js';

let address = null;
const $ = (id) => document.getElementById(id);
const tickets = JSON.parse(localStorage.getItem('tickets') || '[]');

const status = (msg, err = false) => {
  $('status').textContent = msg;
  $('status').className = err ? 'error' : 'ok';
};

function renderWallet() {
  $('wallet-info').textContent = address ? `Conectada: ${short(address)}` : 'Wallet no conectada';
  $('connect-btn').textContent = address ? 'Reconectar' : 'Conectar wallet';
}

function renderEvents() {
  $('events').innerHTML = EVENTS.map((e) => `
    <article class="card">
      <div class="emoji">${e.emoji}</div>
      <h3>${e.name}</h3>
      <p>${e.place} · ${e.date}</p>
      <strong>${e.price} XLM</strong>
      <button data-id="${e.id}">Comprar entrada</button>
    </article>`).join('');
}

function renderTickets() {
  const mine = tickets.filter((t) => t.buyer === address);
  $('my-tickets').innerHTML = mine.length
    ? mine.map((t) => `<li>${t.name} — <a target="_blank" href="https://stellar.expert/explorer/testnet/tx/${t.hash}">ver transacción</a></li>`).join('')
    : '<li>Aún no tienes entradas.</li>';
}

$('connect-btn').onclick = async () => {
  try {
    address = await connectWallet();
    status('Wallet conectada correctamente');
  } catch (e) { status(e.message, true); }
  renderWallet(); renderTickets();
};

$('events').onclick = async (ev) => {
  const id = ev.target.dataset?.id;
  if (!id) return;
  if (!address) return status('Conecta tu wallet primero', true);
  const event = EVENTS.find((e) => e.id === Number(id));
  try {
    status('Firma la transacción en Freighter…');
    const hash = await buyTicket(address, event);
    tickets.push({ buyer: address, name: event.name, hash });
    localStorage.setItem('tickets', JSON.stringify(tickets));
    status(`¡Entrada comprada! Tx: ${hash.slice(0, 12)}…`);
    renderTickets();
  } catch (e) {
    status(e?.response?.data?.extras?.result_codes ? JSON.stringify(e.response.data.extras.result_codes) : e.message, true);
  }
};

renderEvents(); renderWallet(); renderTickets();
currentAddress().then((a) => { if (a) { address = a; renderWallet(); renderTickets(); } }).catch(() => {});
