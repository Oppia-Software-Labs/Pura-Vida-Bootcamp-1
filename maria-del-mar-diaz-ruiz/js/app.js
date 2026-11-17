/**
 * Controlador Principal de la Aplicacion Stellar Nova Portal
 * Autora: Maria del Mar Diaz Ruiz
 * Entregable 1 - Pura Vida Bootcamp
 */

import { stellarWallet } from './wallet.js';
import { stellarService } from './stellar-service.js';
import { transactionsService } from './transactions.js';

// Elementos de la interfaz
const dom = {
  btnConnectFreighter: document.getElementById('btnConnectFreighter'),
  btnConnectMain: document.getElementById('btnConnectMain'),
  btnConnectText: document.getElementById('btnConnectText'),
  btnDisconnect: document.getElementById('btnDisconnect'),
  btnLoadManualAddress: document.getElementById('btnLoadManualAddress'),
  manualAddressInput: document.getElementById('manualAddressInput'),
  btnGenerateDemoAccount: document.getElementById('btnGenerateDemoAccount'),
  btnCopyAddress: document.getElementById('btnCopyAddress'),
  btnFriendbotFaucet: document.getElementById('btnFriendbotFaucet'),
  btnRefreshBalance: document.getElementById('btnRefreshBalance'),
  btnStellarExpert: document.getElementById('btnStellarExpert'),
  
  disconnectedState: document.getElementById('disconnectedState'),
  connectedState: document.getElementById('connectedState'),
  walletStatusBadge: document.getElementById('walletStatusBadge'),
  displayPublicKey: document.getElementById('displayPublicKey'),
  displayXlmBalance: document.getElementById('displayXlmBalance'),
  accountStateNotice: document.getElementById('accountStateNotice'),
  
  txListContainer: document.getElementById('txListContainer'),
  txCountBadge: document.getElementById('txCountBadge'),
  paymentForm: document.getElementById('paymentForm'),
  recipientInput: document.getElementById('recipientInput'),
  amountInput: document.getElementById('amountInput'),
  memoInput: document.getElementById('memoInput'),
  toastContainer: document.getElementById('toastContainer')
};

// Sistema de Notificaciones Toast
function showToast(message, type = 'info') {
  if (!dom.toastContainer) return;
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
  toast.innerHTML = `<span>${icon}</span><span>${message}</span>`;
  
  dom.toastContainer.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// Actualiza los datos de la cuenta en vivo
async function syncAccountData(publicKey) {
  if (!publicKey) return;

  dom.displayPublicKey.textContent = stellarWallet.formatAddress(publicKey);
  dom.displayPublicKey.title = publicKey;
  dom.btnStellarExpert.href = `https://stellar.expert/explorer/testnet/account/${publicKey}`;

  try {
    dom.accountStateNotice.textContent = 'Consultando saldo en Horizon...';
    const accountInfo = await stellarService.getAccount(publicKey);

    dom.displayXlmBalance.textContent = accountInfo.xlmBalance;
    
    if (!accountInfo.exists) {
      dom.accountStateNotice.textContent = '⚠️ Cuenta no financiada aún en Testnet.';
      dom.accountStateNotice.style.color = 'var(--warning)';
    } else {
      dom.accountStateNotice.textContent = `Cuenta activa · Subentries: ${accountInfo.subentryCount || 0}`;
      dom.accountStateNotice.style.color = 'var(--text-dim)';
    }

    // Consulta transacciones recientes
    const payments = await transactionsService.getRecentPayments(publicKey, 8);
    dom.txCountBadge.textContent = `${payments.length} transacciones`;
    transactionsService.renderTransactions(dom.txListContainer, payments, publicKey);

  } catch (err) {
    console.error('Error sincronizando cuenta:', err);
    dom.accountStateNotice.textContent = 'Error consultando Horizon';
    showToast('No se pudo sincronizar con Horizon Testnet: ' + err.message, 'error');
  }
}

// Maneja cambios de estado de conexion
stellarWallet.onStateChange(async (state) => {
  if (state.isConnected) {
    dom.disconnectedState.style.display = 'none';
    dom.connectedState.style.display = 'flex';
    dom.btnConnectText.textContent = stellarWallet.formatAddress(state.publicKey);
    
    dom.walletStatusBadge.textContent = `Conectado (${state.walletType})`;
    dom.walletStatusBadge.style.background = 'rgba(52, 211, 153, 0.15)';
    dom.walletStatusBadge.style.color = 'var(--success)';
    dom.walletStatusBadge.style.borderColor = 'rgba(52, 211, 153, 0.3)';

    showToast(`Wallet conectada: ${stellarWallet.formatAddress(state.publicKey)}`, 'success');
    await syncAccountData(state.publicKey);
  } else {
    dom.disconnectedState.style.display = 'flex';
    dom.connectedState.style.display = 'none';
    dom.btnConnectText.textContent = 'Conectar Wallet';
    
    dom.walletStatusBadge.textContent = 'No conectada';
    dom.walletStatusBadge.style.background = 'rgba(239, 68, 68, 0.1)';
    dom.walletStatusBadge.style.color = 'var(--danger)';
    dom.walletStatusBadge.style.borderColor = 'rgba(239, 68, 68, 0.25)';

    dom.displayXlmBalance.textContent = '0.00';
    dom.txCountBadge.textContent = '0 registros';
    dom.txListContainer.innerHTML = `
      <div style="text-align: center; padding: 2.5rem 1rem; color: var(--text-dim);">
        <div style="font-size: 2rem; margin-bottom: 0.5rem;">🔭</div>
        <p>Conecta una cuenta para ver sus operaciones en Stellar Testnet.</p>
      </div>
    `;
  }
});

// Event Listeners
async function handleConnectFreighter() {
  try {
    dom.btnConnectFreighter.disabled = true;
    dom.btnConnectMain.disabled = true;
    await stellarWallet.connectFreighter();
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    dom.btnConnectFreighter.disabled = false;
    dom.btnConnectMain.disabled = false;
  }
}

dom.btnConnectFreighter.addEventListener('click', () => {
  if (stellarWallet.publicKey) {
    showToast(`Cuenta activa: ${stellarWallet.publicKey}`, 'info');
  } else {
    handleConnectFreighter();
  }
});

dom.btnConnectMain.addEventListener('click', handleConnectFreighter);

// Cargar clave manual
dom.btnLoadManualAddress.addEventListener('click', () => {
  const address = dom.manualAddressInput.value;
  try {
    stellarWallet.connectManual(address);
    dom.manualAddressInput.value = '';
  } catch (err) {
    showToast(err.message, 'error');
  }
});

// Generar cuenta demo de prueba
dom.btnGenerateDemoAccount.addEventListener('click', () => {
  const demoKey = stellarWallet.connectDemo();
  showToast('Cuenta de prueba generada. ¡Haz clic en "Pedir 10,000 XLM" para activarla en Testnet!', 'info');
});

// Copiar direccion al portapapeles
dom.btnCopyAddress.addEventListener('click', async () => {
  if (!stellarWallet.publicKey) return;
  const copied = await stellarWallet.copyToClipboard(stellarWallet.publicKey);
  if (copied) {
    dom.btnCopyAddress.textContent = '✓ ¡Copiado!';
    setTimeout(() => {
      dom.btnCopyAddress.textContent = '📋 Copiar';
    }, 2000);
    showToast('Clave pública copiada al portapapeles', 'info');
  }
});

// Pedir fondos a Friendbot
dom.btnFriendbotFaucet.addEventListener('click', async () => {
  if (!stellarWallet.publicKey) return;
  
  dom.btnFriendbotFaucet.disabled = true;
  dom.btnFriendbotFaucet.innerHTML = '<span class="spinner"></span> <span>Solicitando a Friendbot...</span>';

  try {
    const result = await stellarService.requestFriendbotFunds(stellarWallet.publicKey);
    showToast(result.message, 'success');
    // Espera 1.5s y sincroniza saldo
    setTimeout(async () => {
      await syncAccountData(stellarWallet.publicKey);
    }, 1500);
  } catch (err) {
    showToast('Error al solicitar fondos: ' + err.message, 'error');
  } finally {
    dom.btnFriendbotFaucet.disabled = false;
    dom.btnFriendbotFaucet.innerHTML = '<span>🚰 Pedir 10,000 XLM (Friendbot)</span>';
  }
});

// Actualizar saldo manualmente
dom.btnRefreshBalance.addEventListener('click', async () => {
  if (!stellarWallet.publicKey) return;
  dom.btnRefreshBalance.disabled = true;
  await syncAccountData(stellarWallet.publicKey);
  showToast('Datos sincronizados con Horizon Testnet', 'info');
  dom.btnRefreshBalance.disabled = false;
});

// Desconectar wallet
dom.btnDisconnect.addEventListener('click', () => {
  stellarWallet.disconnect();
  showToast('Sesión de wallet desconectada.', 'info');
});

// Envio de pago de prueba en Testnet
dom.paymentForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  if (!stellarWallet.publicKey) {
    showToast('Debes conectar una wallet antes de enviar una transacción.', 'error');
    return;
  }

  const recipient = dom.recipientInput.value.trim();
  const amount = dom.amountInput.value.trim();
  const memo = dom.memoInput.value.trim();

  if (!stellarWallet.isValidPublicKey(recipient)) {
    showToast('La dirección de destino no es válida (debe empezar con G y tener 56 caracteres).', 'error');
    return;
  }

  if (recipient === stellarWallet.publicKey) {
    showToast('No puedes enviarte una transferencia a ti mismo.', 'error');
    return;
  }

  showToast(`Simulando transferencia de ${amount} XLM a ${recipient.slice(0, 5)}... con memo "${memo || 'N/A'}"`, 'info');

  setTimeout(() => {
    showToast('✅ Pago simulado exitosamente en Stellar Testnet. ¡Excelente prueba!', 'success');
    dom.paymentForm.reset();
  }, 1200);
});

console.log('Stellar Nova Portal iniciado correctamente. Asistido por Stellar Raven MCP.');
