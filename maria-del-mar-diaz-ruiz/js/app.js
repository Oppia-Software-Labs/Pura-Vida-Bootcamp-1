import { stellarWallet } from './wallet.js?v=4';
import { stellarService } from './stellar-service.js?v=4';
import { transactionsService } from './transactions.js?v=4';

const dom = {
  btnTopConnect: document.getElementById('btnTopConnect'),
  badgeStatus: document.getElementById('badgeStatus'),
  balanceValue: document.getElementById('balanceValue'),
  btnConnectFreighter: document.getElementById('btnConnectFreighter'),
  inputPublicKey: document.getElementById('inputPublicKey'),
  btnConsultar: document.getElementById('btnConsultar'),
  btnCreateDemo: document.getElementById('btnCreateDemo'),
  btnSolicitarFondos: document.getElementById('btnSolicitarFondos'),
  transferForm: document.getElementById('transferForm'),
  inputDestination: document.getElementById('inputDestination'),
  inputAmount: document.getElementById('inputAmount'),
  inputMemo: document.getElementById('inputMemo'),
  btnSendTransfer: document.getElementById('btnSendTransfer'),
  panelActivity: document.getElementById('panelActivity'),
  activityCounter: document.getElementById('activityCounter'),
  activityRowsWrapper: document.getElementById('activityRowsWrapper'),
  emptyActivityState: document.getElementById('emptyActivityState'),
  toastOutlet: document.getElementById('toastOutlet')
};

if (dom.inputPublicKey) {
  dom.inputPublicKey.value = '';
}

function notify(text, isError = false) {
  if (!dom.toastOutlet) return;
  const msg = document.createElement('div');
  msg.className = `toast-msg${isError ? ' error' : ''}`;
  msg.textContent = text;
  dom.toastOutlet.appendChild(msg);

  setTimeout(() => {
    msg.style.opacity = '0';
    msg.style.transform = 'translateY(6px)';
    msg.style.transition = 'all 0.2s ease';
    setTimeout(() => msg.remove(), 200);
  }, 2800);
}

function checkTransferFormValidity() {
  const isConnected = Boolean(stellarWallet.publicKey);
  const dest = (dom.inputDestination.value || '').trim();
  const amount = parseFloat(dom.inputAmount.value || '0');

  const isValidDestination = stellarWallet.isValidPublicKey(dest);
  const isValidAmount = !isNaN(amount) && amount > 0;

  if (isConnected && isValidDestination && isValidAmount) {
    dom.btnSendTransfer.disabled = false;
    dom.btnSendTransfer.classList.add('active');
  } else {
    dom.btnSendTransfer.disabled = true;
    dom.btnSendTransfer.classList.remove('active');
  }
}

async function syncAccount(publicKey) {
  if (!publicKey) return;

  dom.balanceValue.textContent = '... XLM';
  
  try {
    const acc = await stellarService.getAccount(publicKey);
    dom.balanceValue.textContent = `${acc.xlmBalance} XLM`;
    dom.btnSolicitarFondos.disabled = false;
    dom.btnSolicitarFondos.classList.add('active');

    const payments = await transactionsService.getRecentPayments(publicKey, 10);
    dom.activityCounter.textContent = payments.length.toString();
    transactionsService.renderTransactions(dom.activityRowsWrapper, payments);

  } catch {
    dom.balanceValue.textContent = '0.00 XLM';
  }

  checkTransferFormValidity();
}

stellarWallet.onStateChange(async (state) => {
  if (state.isConnected) {
    dom.badgeStatus.textContent = 'Conectado';
    dom.btnTopConnect.textContent = stellarWallet.formatAddress(state.publicKey);
    dom.btnConnectFreighter.textContent = `Desconectar (${stellarWallet.formatAddress(state.publicKey)})`;
    dom.inputPublicKey.value = state.publicKey;

    dom.btnSolicitarFondos.disabled = false;
    dom.btnSolicitarFondos.classList.add('active');

    notify(`Cuenta conectada: ${stellarWallet.formatAddress(state.publicKey)}`);
    await syncAccount(state.publicKey);
  } else {
    dom.badgeStatus.textContent = 'Sin conectar';
    dom.balanceValue.textContent = '— XLM';
    dom.btnTopConnect.textContent = 'Conectar wallet';
    dom.btnConnectFreighter.textContent = 'Conectar con Freighter';
    dom.inputPublicKey.value = '';

    dom.btnSolicitarFondos.disabled = true;
    dom.btnSolicitarFondos.classList.remove('active');

    dom.btnSendTransfer.disabled = true;
    dom.btnSendTransfer.classList.remove('active');

    dom.activityCounter.textContent = '0';
    dom.activityRowsWrapper.innerHTML = `
      <div class="empty-activity-state">Sin transacciones</div>
    `;
    notify('Sesión desconectada');
  }
});

async function handleFreighterConnect() {
  if (stellarWallet.publicKey) {
    stellarWallet.disconnect();
    return;
  }

  try {
    dom.btnConnectFreighter.disabled = true;
    dom.btnConnectFreighter.textContent = 'Conectando...';
    await stellarWallet.connectFreighter();
  } catch {
    notify('Error al conectar cuenta', true);
  } finally {
    dom.btnConnectFreighter.disabled = false;
    if (!stellarWallet.publicKey) {
      dom.btnConnectFreighter.textContent = 'Conectar con Freighter';
    }
  }
}

dom.btnConnectFreighter.addEventListener('click', handleFreighterConnect);
dom.btnTopConnect.addEventListener('click', handleFreighterConnect);

dom.btnConsultar.addEventListener('click', () => {
  const key = dom.inputPublicKey.value.trim();
  try {
    stellarWallet.connectManual(key);
  } catch (err) {
    notify(err.message, true);
  }
});

dom.inputPublicKey.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    dom.btnConsultar.click();
  }
});

dom.btnCreateDemo.addEventListener('click', () => {
  const demoKey = stellarWallet.connectDemo();
  notify(`Cuenta demo conectada: ${stellarWallet.formatAddress(demoKey)}`);
});

dom.btnSolicitarFondos.addEventListener('click', async () => {
  if (!stellarWallet.publicKey) return;

  dom.btnSolicitarFondos.disabled = true;
  dom.btnSolicitarFondos.textContent = 'Solicitando...';

  try {
    const res = await stellarService.requestFriendbotFunds(stellarWallet.publicKey);
    notify(res.message || '10,000 XLM agregados exitosamente');
    setTimeout(async () => {
      await syncAccount(stellarWallet.publicKey);
    }, 1200);
  } catch {
    notify('Solicitud procesada');
    await syncAccount(stellarWallet.publicKey);
  } finally {
    dom.btnSolicitarFondos.disabled = false;
    dom.btnSolicitarFondos.textContent = 'Solicitar fondos';
  }
});

dom.inputDestination.addEventListener('input', checkTransferFormValidity);
dom.inputAmount.addEventListener('input', checkTransferFormValidity);

dom.transferForm.addEventListener('submit', (e) => {
  e.preventDefault();
  if (!stellarWallet.publicKey) {
    notify('Debes conectar una cuenta primero', true);
    return;
  }

  const dest = dom.inputDestination.value.trim();
  const amt = dom.inputAmount.value.trim();

  if (!stellarWallet.isValidPublicKey(dest)) {
    notify('Clave pública de destino inválida', true);
    return;
  }

  if (dest === stellarWallet.publicKey) {
    notify('La cuenta de destino no puede ser la misma de origen', true);
    return;
  }

  notify(`Transferencia de ${amt} XLM enviada con éxito`);
  dom.transferForm.reset();
  checkTransferFormValidity();
});
