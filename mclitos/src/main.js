import * as sdk from '@stellar/varial-sdk';
import { createWalletClient } from './wallet.js';
import { createDashboard } from './dashboard.js';
import './style.css';

const elements = Object.fromEntries([
  'connect', 'disconnect', 'connection-badge', 'status', 'error', 'empty',
  'account', 'address', 'explorer', 'refresh', 'copy', 'balances', 'updated',
].map(id => [id, document.getElementById(id)]));
let currentAddress = '';
let lastPhase = '';

function render(state) {
  const busy = ['connecting', 'loading'].includes(state.phase);
  currentAddress = state.address;
  elements.connect.hidden = Boolean(state.address);
  elements.connect.disabled = busy;
  elements.connect.textContent = state.phase === 'connecting' ? 'Esperando a tu wallet…' : 'Conectar wallet ↗';
  elements.disconnect.hidden = state.phase === 'idle';
  elements.account.hidden = !state.address;
  elements.empty.hidden = Boolean(state.address);
  elements.refresh.disabled = busy;
  elements.error.hidden = !state.error;
  elements.error.textContent = state.error;
  elements['connection-badge'].textContent = state.address ? 'Conectada' : 'Sin conectar';
  elements['connection-badge'].classList.toggle('connected', Boolean(state.address));
  elements.status.textContent = {
    idle: 'Todo listo para conectar.',
    connecting: 'Aprobá el acceso a tu dirección pública en la extensión.',
    loading: 'Consultando tu cuenta en Testnet…',
    ready: 'Saldo actualizado desde Stellar Testnet.',
    error: 'No pudimos completar la consulta.',
  }[state.phase];
  elements.account.setAttribute('aria-busy', String(state.phase === 'loading'));
  elements.address.textContent = state.address;
  if (state.address) elements.explorer.href = 'https://stellar.expert/explorer/testnet/account/' + encodeURIComponent(state.address);
  else elements.explorer.removeAttribute('href');
  elements.balances.replaceChildren();
  for (const balance of state.balances) {
    const item = document.createElement('li');
    const identity = document.createElement('div');
    const code = document.createElement('strong');
    code.textContent = balance.code;
    const issuer = document.createElement('small');
    issuer.textContent = balance.issuer ? 'Emisor: ' + balance.issuer : 'Activo nativo de Stellar';
    const amount = document.createElement('span');
    // Se conserva la precisión de siete decimales que devuelve Horizon.
    amount.className = 'amount';
    amount.textContent = balance.amount;
    identity.append(code, issuer);
    item.append(identity, amount);
    elements.balances.append(item);
  }
  if (state.phase === 'ready' && !state.balances.length) {
    const item = document.createElement('li');
    item.textContent = 'Esta cuenta no tiene activos para mostrar.';
    elements.balances.append(item);
  }
  elements.updated.textContent = state.phase === 'ready'
    ? 'Última consulta: ' + new Date().toLocaleTimeString('es') + ' · Valores de prueba, sin valor monetario.'
    : '';
  if (state.phase !== lastPhase) elements.copy.textContent = 'Copiar';
  lastPhase = state.phase;
}

const dashboard = createDashboard(createWalletClient(sdk), render);
elements.connect.addEventListener('click', () => dashboard.connect());
elements.disconnect.addEventListener('click', () => dashboard.disconnect());
elements.refresh.addEventListener('click', () => dashboard.refresh());
elements.copy.addEventListener('click', async () => {
  if (!currentAddress) return;
  const copiedAddress = currentAddress;
  try {
    await navigator.clipboard.writeText(copiedAddress);
    if (currentAddress === copiedAddress) elements.copy.textContent = 'Copiada ✓';
  } catch {
    if (currentAddress === copiedAddress) elements.copy.textContent = 'Seleccioná la dirección para copiarla';
  }
});
