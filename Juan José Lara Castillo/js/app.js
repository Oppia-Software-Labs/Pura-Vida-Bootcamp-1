/**
 * Main Application Orchestrator
 * StellarCalc - Juan José Lara Castillo
 */
document.addEventListener('DOMContentLoaded', () => {
  // Initialize services
  const calc = new window.StandardCalculator();
  const stellarCalc = new window.StellarCalculator();
  const walletService = new window.StellarWalletService();

  // DOM Elements - Calculator
  const calcExpression = document.getElementById('calcExpression');
  const calcCurrent = document.getElementById('calcCurrent');
  const historyList = document.getElementById('historyList');
  const btnClearHistory = document.getElementById('btnClearHistory');
  const btnUseResultInStellar = document.getElementById('btnUseResultInStellar');

  // DOM Elements - Wallet Section
  const btnOpenWalletModal = document.getElementById('btnOpenWalletModal');
  const btnQuickDemo = document.getElementById('btnQuickDemo');
  const btnFundFriendbot = document.getElementById('btnFundFriendbot');
  const walletBtnText = document.getElementById('walletBtnText');
  const walletBtnIcon = document.getElementById('walletBtnIcon');
  const walletStatusText = document.getElementById('walletStatusText');
  const walletAddress = document.getElementById('walletAddress');
  const walletBalance = document.getElementById('walletBalance');
  const walletReserve = document.getElementById('walletReserve');

  // DOM Elements - Wallet Modal
  const walletModal = document.getElementById('walletModal');
  const btnCloseWalletModal = document.getElementById('btnCloseWalletModal');
  const optionAlbedo = document.getElementById('optionAlbedo');
  const optionFreighter = document.getElementById('optionFreighter');
  const optionVarial = document.getElementById('optionVarial');
  const inputCustomPublicKey = document.getElementById('inputCustomPublicKey');
  const btnConnectCustomKey = document.getElementById('btnConnectCustomKey');

  // DOM Elements - Tabs
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  // DOM Elements - Reserve Tool
  const inputTrustlines = document.getElementById('inputTrustlines');
  const inputSigners = document.getElementById('inputSigners');
  const inputOffers = document.getElementById('inputOffers');
  const inputDataEntries = document.getElementById('inputDataEntries');
  const btnCalcReserve = document.getElementById('btnCalcReserve');
  const reserveResult = document.getElementById('reserveResult');
  const subentriesBreakdown = document.getElementById('subentriesBreakdown');

  // DOM Elements - Converter
  const inputXlm = document.getElementById('inputXlm');
  const inputStroops = document.getElementById('inputStroops');
  const converterResult = document.getElementById('converterResult');

  // DOM Elements - Fee Estimator
  const inputNumOps = document.getElementById('inputNumOps');
  const selectFeeRate = document.getElementById('selectFeeRate');
  const feeTotalStroops = document.getElementById('feeTotalStroops');
  const feeTotalXlm = document.getElementById('feeTotalXlm');

  // ----------------------------------------------------
  // 1. Calculator UI Integration
  // ----------------------------------------------------
  calc.setCallbacks(
    (state) => {
      calcExpression.textContent = state.expression;
      calcCurrent.textContent = state.current;
    },
    (history) => {
      if (history.length === 0) {
        historyList.innerHTML = `
          <p style="color: var(--text-muted); font-size: 0.85rem; text-align: center; margin-top: 30px;">
            No hay operaciones recientes
          </p>`;
        return;
      }
      historyList.innerHTML = history.map((item) => `
        <div class="history-item" data-res="${item.result}">
          <div class="history-expr">${item.expression} =</div>
          <div class="history-res">${item.result}</div>
        </div>
      `).join('');

      // Add click listener to history items
      historyList.querySelectorAll('.history-item').forEach((elem) => {
        elem.addEventListener('click', () => {
          const res = elem.getAttribute('data-res');
          calc.setCurrentValue(res);
        });
      });
    }
  );

  // Keypad clicks
  document.querySelectorAll('.calc-key').forEach((btn) => {
    btn.addEventListener('click', () => {
      const num = btn.getAttribute('data-num');
      const op = btn.getAttribute('data-op');
      const action = btn.getAttribute('data-action');

      if (num !== null) {
        calc.appendNumber(num);
      } else if (op !== null) {
        calc.setOperation(op);
      } else if (action === 'clear') {
        calc.clear();
      } else if (action === 'delete') {
        calc.deleteLastDigit();
      } else if (action === 'percent') {
        calc.applyPercent();
      } else if (action === 'decimal') {
        calc.appendNumber('.');
      } else if (action === 'calculate') {
        calc.calculate();
      }
    });
  });

  // Keyboard navigation
  window.addEventListener('keydown', (e) => {
    if (['INPUT', 'SELECT', 'TEXTAREA'].includes(e.target.tagName)) {
      return;
    }

    if (e.key >= '0' && e.key <= '9') {
      calc.appendNumber(e.key);
    } else if (e.key === '.') {
      calc.appendNumber('.');
    } else if (['+', '-', '*', '/'].includes(e.key)) {
      calc.setOperation(e.key);
    } else if (e.key === 'Enter' || e.key === '=') {
      e.preventDefault();
      calc.calculate();
    } else if (e.key === 'Backspace') {
      calc.deleteLastDigit();
    } else if (e.key === 'Escape') {
      calc.clear();
    } else if (e.key === '%') {
      calc.applyPercent();
    }
  });

  btnClearHistory.addEventListener('click', () => {
    calc.clearHistory();
  });

  // Send calculator result to Stellar tools
  btnUseResultInStellar.addEventListener('click', () => {
    const val = calc.getCurrentValue();
    const num = parseFloat(val);
    if (!isNaN(num) && num >= 0) {
      inputXlm.value = num;
      inputXlm.dispatchEvent(new Event('input'));

      // Switch to converter tab
      document.querySelector('[data-tab="tab-converter"]').click();
    }
  });

  // ----------------------------------------------------
  // 2. Tab Navigation
  // ----------------------------------------------------
  tabButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      tabButtons.forEach((b) => b.classList.remove('active'));
      tabContents.forEach((c) => c.classList.remove('active'));

      btn.classList.add('active');
      const target = btn.getAttribute('data-tab');
      const targetElement = document.getElementById(target);
      if (targetElement) {
        targetElement.classList.add('active');
      }
    });
  });

  // ----------------------------------------------------
  // 3. Stellar Base Reserve Tool
  // ----------------------------------------------------
  function updateReserveCalculation() {
    const res = stellarCalc.calculateAccountReserve({
      trustlines: inputTrustlines.value,
      signers: inputSigners.value,
      offers: inputOffers.value,
      dataEntries: inputDataEntries.value
    });

    reserveResult.textContent = `${res.reserveXlm} XLM`;
    subentriesBreakdown.textContent = `${res.baseAccountEntries} entradas base + ${res.subentries.total} subentries = ${res.totalEntries} entradas × 0.5 XLM = ${res.reserveXlm} XLM (${res.reserveStroops.toLocaleString()} Stroops).`;
  }

  [inputTrustlines, inputSigners, inputOffers, inputDataEntries].forEach((input) => {
    input.addEventListener('input', updateReserveCalculation);
  });
  btnCalcReserve.addEventListener('click', updateReserveCalculation);
  updateReserveCalculation();

  // ----------------------------------------------------
  // 4. Stroops <-> XLM Converter
  // ----------------------------------------------------
  inputXlm.addEventListener('input', () => {
    const val = inputXlm.value;
    if (val === '' || isNaN(val)) {
      inputStroops.value = '';
      converterResult.textContent = 'Introduce un valor para convertir';
      return;
    }
    const stroops = stellarCalc.xlmToStroops(val);
    inputStroops.value = stroops;
    converterResult.textContent = `${val} XLM = ${stroops.toLocaleString()} Stroops`;
  });

  inputStroops.addEventListener('input', () => {
    const val = inputStroops.value;
    if (val === '' || isNaN(val)) {
      inputXlm.value = '';
      converterResult.textContent = 'Introduce un valor para convertir';
      return;
    }
    const xlm = stellarCalc.stroopsToXlm(val);
    inputXlm.value = xlm;
    converterResult.textContent = `${parseInt(val, 10).toLocaleString()} Stroops = ${xlm} XLM`;
  });

  // ----------------------------------------------------
  // 5. Fee Estimator
  // ----------------------------------------------------
  function updateFeeEstimation() {
    const ops = inputNumOps.value;
    const rate = selectFeeRate.value;
    const fee = stellarCalc.calculateTransactionFee(ops, rate);

    feeTotalStroops.textContent = `${fee.totalStroops.toLocaleString()} Stroops`;
    feeTotalXlm.textContent = `= ${fee.totalXlm} XLM (Permite ~${fee.transactionsPerXlm.toLocaleString()} txs con 1 XLM)`;
  }

  inputNumOps.addEventListener('input', updateFeeEstimation);
  selectFeeRate.addEventListener('change', updateFeeEstimation);
  updateFeeEstimation();

  // ----------------------------------------------------
  // 6. Modal de Wallets
  // ----------------------------------------------------
  function openModal() {
    walletModal.classList.add('open');
  }

  function closeModal() {
    walletModal.classList.remove('open');
  }

  btnCloseWalletModal.addEventListener('click', closeModal);
  walletModal.addEventListener('click', (e) => {
    if (e.target === walletModal) closeModal();
  });

  // ----------------------------------------------------
  // 7. Stellar Wallet Subscriptions & Connection Handlers
  // ----------------------------------------------------
  walletService.subscribe((walletState) => {
    if (walletState.isConnected) {
      closeModal();
      walletStatusText.innerHTML = `<span style="color: var(--stellar-green);">● Conectado (${walletState.walletType.toUpperCase()})</span>`;
      walletAddress.textContent = `${walletState.publicKey.substring(0, 6)}...${walletState.publicKey.substring(walletState.publicKey.length - 6)}`;
      walletAddress.title = walletState.publicKey;

      const nativeBal = walletService.getNativeBalance();
      walletBalance.textContent = `${nativeBal} XLM`;

      const subentries = walletService.getSubentryCount();
      const accountReserve = ((2 + subentries) * 0.5).toFixed(7);
      walletReserve.textContent = `${accountReserve} XLM (${subentries} subentries)`;

      walletBtnText.textContent = 'Desconectar';
      walletBtnIcon.textContent = '🔌';
      btnOpenWalletModal.classList.replace('btn-primary', 'btn-secondary');
      btnFundFriendbot.style.display = 'inline-flex';

      // Auto-populate subentries in reserve tab
      inputTrustlines.value = subentries;
      updateReserveCalculation();
    } else {
      walletStatusText.innerHTML = '<span style="color: var(--text-muted);">○ Desconectado</span>';
      walletAddress.textContent = '--';
      walletAddress.title = '';
      walletBalance.textContent = '0.0000000 XLM';
      walletReserve.textContent = '-- XLM';
      walletBtnText.textContent = 'Conectar Wallet';
      walletBtnIcon.textContent = '🔗';
      btnOpenWalletModal.classList.replace('btn-secondary', 'btn-primary');
      btnFundFriendbot.style.display = 'none';
    }
  });

  // Botón Principal de Wallet: si está conectado desconecta; si no, abre el modal
  btnOpenWalletModal.addEventListener('click', () => {
    if (walletService.isConnected) {
      walletService.disconnect();
    } else {
      openModal();
    }
  });

  // Opción 1: Albedo (Web - Sin extensión)
  optionAlbedo.addEventListener('click', async () => {
    const res = await walletService.connectAlbedo();
    if (!res.success) {
      alert(res.error);
    }
  });

  // Opción 2: Freighter (Extensión)
  optionFreighter.addEventListener('click', async () => {
    const res = await walletService.connectFreighter();
    if (!res.success) {
      alert(res.error);
    }
  });

  // Opción 3: Varial (Extensión)
  optionVarial.addEventListener('click', async () => {
    const res = await walletService.connectVarial();
    if (!res.success) {
      alert(res.error);
    }
  });

  // Opción 4: Clave Pública Manual
  btnConnectCustomKey.addEventListener('click', async () => {
    const key = inputCustomPublicKey.value;
    const res = await walletService.connectCustomKey(key);
    if (!res.success) {
      alert(res.error);
    }
  });

  // Modo Demo Rápido
  btnQuickDemo.addEventListener('click', async () => {
    await walletService.connectDemoWallet();
  });

  // Friendbot Fondeo
  btnFundFriendbot.addEventListener('click', async () => {
    btnFundFriendbot.textContent = '⏳ Fondeando...';
    btnFundFriendbot.disabled = true;
    try {
      const res = await walletService.fundWithFriendbot();
      alert(res.message);
    } catch (e) {
      alert(`Error al fondear: ${e.message}`);
    } finally {
      btnFundFriendbot.textContent = '💧 Recargar con Friendbot';
      btnFundFriendbot.disabled = false;
    }
  });
});
