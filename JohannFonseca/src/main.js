import { PRESET_BILLS } from "./config.js";
import {
  connectFreighterWallet,
  connectInstantTestnetWallet,
  restoreWalletSession,
  disconnectWalletSession,
  shortenAddress,
} from "./wallet.js";
import {
  fetchAccountStatus,
  fundWithFriendbot,
  sendSplitPayment,
  fetchIncomingSplitPayments,
  buildShareablePaymentLinks,
} from "./stellar.js";

// Estado global de la dApp
const state = {
  walletAddress: null,
  walletMode: null, // "freighter" | "instant-testnet"
  funded: false,
  xlmBalance: "0.00",
  friends: ["Kevin", "Cryz", "Adrian"],
  activeSplit: null,
  payerParams: null,
};

// Elementos del DOM
const el = {
  walletDisconnected: document.getElementById("wallet-disconnected"),
  walletConnected: document.getElementById("wallet-connected"),
  walletModeLabel: document.getElementById("wallet-mode-label"),
  walletAddressShort: document.getElementById("wallet-address-short"),
  walletBalance: document.getElementById("wallet-balance"),
  btnConnectFreighter: document.getElementById("btn-connect-freighter"),
  btnConnectInstant: document.getElementById("btn-connect-instant"),
  btnCopyAddress: document.getElementById("btn-copy-address"),
  btnFundFriendbot: document.getElementById("btn-fund-friendbot"),
  btnRefreshBalance: document.getElementById("btn-refresh-balance"),
  btnDisconnectWallet: document.getElementById("btn-disconnect-wallet"),

  statusBanner: document.getElementById("status-banner"),
  tabHostMode: document.getElementById("tab-host-mode"),
  tabPayerMode: document.getElementById("tab-payer-mode"),
  viewHost: document.getElementById("view-host"),
  viewPayer: document.getElementById("view-payer"),

  formCreateSplit: document.getElementById("form-create-split"),
  inputBillTitle: document.getElementById("input-bill-title"),
  inputBillTotal: document.getElementById("input-bill-total"),
  inputIncludeMe: document.getElementById("input-include-me"),
  liveMathPreview: document.getElementById("live-math-preview"),
  inputFriendName: document.getElementById("input-friend-name"),
  btnAddFriend: document.getElementById("btn-add-friend"),
  friendsTagsList: document.getElementById("friends-tags-list"),

  splitResultsEmpty: document.getElementById("split-results-empty"),
  splitResultsContent: document.getElementById("split-results-content"),
  summaryBillTitle: document.getElementById("summary-bill-title"),
  summaryHostWallet: document.getElementById("summary-host-wallet"),
  summaryShareAmount: document.getElementById("summary-share-amount"),
  friendLinksList: document.getElementById("friend-links-list"),
  btnVerifyOnchain: document.getElementById("btn-verify-onchain"),

  payerGreeting: document.getElementById("payer-greeting"),
  payerBillTitle: document.getElementById("payer-bill-title"),
  payerFriendName: document.getElementById("payer-friend-name"),
  payerDestination: document.getElementById("payer-destination"),
  payerMemo: document.getElementById("payer-memo"),
  payerAmountDisplay: document.getElementById("payer-amount-display"),
  btnExecuteSplitPayment: document.getElementById("btn-execute-split-payment"),
  btnSep7WalletUri: document.getElementById("btn-sep7-wallet-uri"),
  paymentReceiptBox: document.getElementById("payment-receipt-box"),
  receiptTxHash: document.getElementById("receipt-tx-hash"),
  receiptExplorerLink: document.getElementById("receipt-explorer-link"),
};

function showStatus(message, type = "info") {
  el.statusBanner.textContent = message;
  el.statusBanner.className = `status-banner ${type}`;
  el.statusBanner.classList.remove("hidden");
}

function hideStatus() {
  el.statusBanner.classList.add("hidden");
}

function switchTab(mode) {
  if (mode === "payer") {
    el.tabPayerMode.classList.add("active");
    el.tabHostMode.classList.remove("active");
    el.viewPayer.classList.remove("hidden");
    el.viewHost.classList.add("hidden");
  } else {
    el.tabHostMode.classList.add("active");
    el.tabPayerMode.classList.remove("active");
    el.viewHost.classList.remove("hidden");
    el.viewPayer.classList.add("hidden");
  }
}

async function refreshWalletStatus() {
  if (!state.walletAddress) {
    el.walletDisconnected.classList.remove("hidden");
    el.walletConnected.classList.add("hidden");
    return;
  }

  el.walletDisconnected.classList.add("hidden");
  el.walletConnected.classList.remove("hidden");
  el.walletModeLabel.textContent =
    state.walletMode === "freighter" ? "Freighter" : "Testnet Instant";
  el.walletAddressShort.textContent = shortenAddress(state.walletAddress);

  try {
    const accountInfo = await fetchAccountStatus(state.walletAddress);
    state.funded = accountInfo.funded;
    state.xlmBalance = accountInfo.xlmBalance;
    el.walletBalance.textContent = accountInfo.funded
      ? `${accountInfo.xlmBalance} XLM`
      : "Sin fondear (0 XLM)";
  } catch (err) {
    showStatus(`Error consultando Horizon Testnet: ${err.message}`, "error");
  }
}

function renderFriendsTags() {
  el.friendsTagsList.innerHTML = "";
  state.friends.forEach((friend, index) => {
    const tag = document.createElement("span");
    tag.className = "friend-tag";
    tag.innerHTML = `
      <span>👤 ${friend}</span>
      <button type="button" data-remove-index="${index}" title="Quitar">×</button>
    `;
    el.friendsTagsList.appendChild(tag);
  });
  updateLiveMathPreview();
}

function calculateSplitShare() {
  const total = parseFloat(el.inputBillTotal.value) || 0;
  const includeMe = el.inputIncludeMe.checked;
  const totalParticipants = state.friends.length + (includeMe ? 1 : 0);
  if (totalParticipants <= 0) return { totalParticipants: 0, share: 0 };
  return {
    totalParticipants,
    share: total / totalParticipants,
  };
}

function updateLiveMathPreview() {
  const { totalParticipants, share } = calculateSplitShare();
  if (totalParticipants === 0) {
    el.liveMathPreview.textContent = "Agrega al menos 1 participante";
    return;
  }
  el.liveMathPreview.textContent = `${totalParticipants} personas → ${share.toFixed(
    2
  )} XLM c/u`;
}

async function renderGeneratedLinks(onchainTxs = []) {
  const split = state.activeSplit;
  if (!split) {
    el.splitResultsEmpty.classList.remove("hidden");
    el.splitResultsContent.classList.add("hidden");
    return;
  }

  el.splitResultsEmpty.classList.add("hidden");
  el.splitResultsContent.classList.remove("hidden");

  el.summaryBillTitle.textContent = split.billTitle;
  el.summaryHostWallet.textContent = shortenAddress(split.hostAddress);
  el.summaryShareAmount.textContent = `${split.shareAmount.toFixed(2)} XLM`;

  el.friendLinksList.innerHTML = "";

  split.entries.forEach((entry) => {
    const matchedTx = onchainTxs.find(
      (tx) => tx.successful && tx.memo.trim() === entry.memoTag
    );

    const card = document.createElement("div");
    card.className = "friend-link-card";

    const statusBadge = matchedTx
      ? `<span class="badge-status badge-paid">✅ PAGADO ON-CHAIN</span>`
      : `<span class="badge-status badge-pending">⏳ PENDIENTE (${split.shareAmount.toFixed(
          2
        )} XLM)</span>`;

    const txExplorerButton = matchedTx
      ? `<a href="${matchedTx.explorerUrl}" target="_blank" rel="noopener noreferrer" class="btn btn-accent btn-xs">🔍 Ver Recibo en Stellar.expert ↗</a>`
      : "";

    card.innerHTML = `
      <div class="friend-link-header">
        <div>
          <span class="friend-name-title">👤 ${entry.friendName}</span>
          <small style="display:block; color: var(--text-muted); font-size: 0.76rem;">
            Memo: <code>${entry.memoTag}</code>
          </small>
        </div>
        ${statusBadge}
      </div>
      <div class="friend-link-actions">
        <button type="button" class="btn btn-secondary btn-xs" data-copy-link="${encodeURIComponent(
          entry.magicLink
        )}">
          📋 Copiar Link para ${entry.friendName}
        </button>
        <button type="button" class="btn btn-primary btn-xs" data-simulate-friend="${encodeURIComponent(
          entry.magicLink
        )}">
          💸 Abrir Link como ${entry.friendName}
        </button>
        ${txExplorerButton}
      </div>
    `;

    el.friendLinksList.appendChild(card);
  });
}

function loadPayerViewFromParams(params) {
  state.payerParams = params;
  el.payerGreeting.textContent = `¡Hola ${params.friend}! Tienes un cobro compartido`;
  el.payerBillTitle.textContent = params.bill;
  el.payerFriendName.textContent = params.friend;
  el.payerDestination.textContent = shortenAddress(params.payTo);
  el.payerDestination.title = params.payTo;
  el.payerMemo.textContent = params.memo;
  el.payerAmountDisplay.textContent = `${Number(params.amount).toFixed(2)} XLM`;

  const sep7 = `web+stellar:pay?destination=${encodeURIComponent(
    params.payTo
  )}&amount=${encodeURIComponent(params.amount)}&memo=${encodeURIComponent(
    params.memo
  )}&memo_type=MEMO_TEXT`;
  el.btnSep7WalletUri.href = sep7;
  el.paymentReceiptBox.classList.add("hidden");

  switchTab("payer");
}

function checkUrlForMagicPaymentLink() {
  const url = new URL(window.location.href);
  const payTo = url.searchParams.get("pay_to");
  const amount = url.searchParams.get("amount");
  const friend = url.searchParams.get("friend") || "Amigo";
  const bill = url.searchParams.get("bill") || "Cuenta Compartida SplitXLM";
  const memo = url.searchParams.get("memo") || `SPLIT:101:${friend}`;

  if (payTo && amount) {
    loadPayerViewFromParams({
      payTo,
      amount,
      friend,
      bill,
      memo,
    });
  }
}

// EVENT LISTENERS
el.btnConnectFreighter.addEventListener("click", async () => {
  hideStatus();
  try {
    const session = await connectFreighterWallet();
    state.walletAddress = session.address;
    state.walletMode = session.mode;
    await refreshWalletStatus();
    showStatus("¡Wallet Freighter conectada exitosamente en Stellar Testnet!", "success");
  } catch (err) {
    showStatus(err.message, "error");
  }
});

el.btnConnectInstant.addEventListener("click", async () => {
  hideStatus();
  try {
    const session = connectInstantTestnetWallet();
    state.walletAddress = session.address;
    state.walletMode = session.mode;
    await refreshWalletStatus();
    if (!state.funded) {
      showStatus(
        "Creando y fondeando automáticamente tu Wallet de Stellar Testnet con Friendbot (+10,000 XLM)...",
        "info"
      );
      await fundWithFriendbot(state.walletAddress);
      await refreshWalletStatus();
    }
    showStatus(
      "¡Wallet de Stellar Testnet conectada y fondeada con 10,000 XLM lista para usar!",
      "success"
    );
  } catch (err) {
    showStatus(err.message, "error");
  }
});

el.btnDisconnectWallet.addEventListener("click", () => {
  disconnectWalletSession();
  state.walletAddress = null;
  state.walletMode = null;
  refreshWalletStatus();
  showStatus("Sesión de wallet cerrada.", "info");
});

el.btnCopyAddress.addEventListener("click", async () => {
  if (!state.walletAddress) return;
  await navigator.clipboard.writeText(state.walletAddress);
  showStatus(`Dirección copiada al portapapeles: ${state.walletAddress}`, "success");
});

el.btnFundFriendbot.addEventListener("click", async () => {
  if (!state.walletAddress) return;
  try {
    showStatus("Solicitando 10,000 XLM a Friendbot en Stellar Testnet...", "info");
    await fundWithFriendbot(state.walletAddress);
    await refreshWalletStatus();
    showStatus("¡Cuenta fondeada con éxito por Friendbot (+10,000 XLM)!", "success");
  } catch (err) {
    showStatus(`Friendbot: ${err.message}`, "error");
  }
});

el.btnRefreshBalance.addEventListener("click", async () => {
  await refreshWalletStatus();
  showStatus("Balance actualizado desde Horizon Testnet.", "info");
});

el.tabHostMode.addEventListener("click", () => switchTab("host"));
el.tabPayerMode.addEventListener("click", () => switchTab("payer"));

el.inputBillTotal.addEventListener("input", updateLiveMathPreview);
el.inputIncludeMe.addEventListener("change", updateLiveMathPreview);

el.btnAddFriend.addEventListener("click", () => {
  const name = el.inputFriendName.value.trim();
  if (!name) return;
  state.friends.push(name);
  el.inputFriendName.value = "";
  renderFriendsTags();
});

el.inputFriendName.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    el.btnAddFriend.click();
  }
});

el.friendsTagsList.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-remove-index]");
  if (!btn) return;
  const idx = Number(btn.getAttribute("data-remove-index"));
  state.friends.splice(idx, 1);
  renderFriendsTags();
});

document.querySelectorAll("[data-preset]").forEach((chip) => {
  chip.addEventListener("click", () => {
    const preset = PRESET_BILLS[Number(chip.getAttribute("data-preset"))];
    if (!preset) return;
    el.inputBillTitle.value = preset.title;
    el.inputBillTotal.value = preset.total;
    el.inputIncludeMe.checked = preset.includeMe;
    state.friends = [...preset.friends];
    renderFriendsTags();
  });
});

el.formCreateSplit.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!state.walletAddress) {
    showStatus(
      "Primero conecta tu Wallet de Stellar arriba (Freighter o Wallet Testnet Instantánea) para recibir los pagos.",
      "error"
    );
    return;
  }

  if (state.friends.length === 0) {
    showStatus("Agrega al menos 1 amigo para dividir la cuenta.", "error");
    return;
  }

  const billTitle = el.inputBillTitle.value.trim() || "Cuenta SplitXLM";
  const { share } = calculateSplitShare();
  const splitId = Math.floor(100 + Math.random() * 900);
  const originUrl = window.location.origin + window.location.pathname;

  const entries = state.friends.map((friendName) => {
    const links = buildShareablePaymentLinks({
      originUrl,
      hostAddress: state.walletAddress,
      billTitle,
      friendName,
      shareAmount: share,
      splitId,
    });
    return {
      friendName,
      ...links,
    };
  });

  state.activeSplit = {
    splitId,
    billTitle,
    hostAddress: state.walletAddress,
    shareAmount: share,
    entries,
  };

  const txs = await fetchIncomingSplitPayments(state.walletAddress);
  await renderGeneratedLinks(txs);

  // Actualiza vista previa del Payer con el primer amigo
  if (entries.length > 0) {
    state.payerParams = {
      payTo: state.walletAddress,
      amount: share.toFixed(2),
      friend: entries[0].friendName,
      bill: billTitle,
      memo: entries[0].memoTag,
    };
    el.payerGreeting.textContent = `¡Hola ${entries[0].friendName}! Tienes un cobro compartido`;
    el.payerBillTitle.textContent = billTitle;
    el.payerFriendName.textContent = entries[0].friendName;
    el.payerDestination.textContent = shortenAddress(state.walletAddress);
    el.payerMemo.textContent = entries[0].memoTag;
    el.payerAmountDisplay.textContent = `${share.toFixed(2)} XLM`;
    el.btnSep7WalletUri.href = entries[0].sep7Uri;
  }

  showStatus(
    `¡Links automáticos generados! Cada amigo paga ${share.toFixed(
      2
    )} XLM y Horizon verifica su Memo en vivo.`,
    "success"
  );
});

el.friendLinksList.addEventListener("click", async (e) => {
  const copyBtn = e.target.closest("[data-copy-link]");
  if (copyBtn) {
    const link = decodeURIComponent(copyBtn.getAttribute("data-copy-link"));
    await navigator.clipboard.writeText(link);
    showStatus("¡Link mágico de cobro copiado! Envíalo por WhatsApp o Telegram.", "success");
    return;
  }

  const simBtn = e.target.closest("[data-simulate-friend]");
  if (simBtn) {
    const link = decodeURIComponent(simBtn.getAttribute("data-simulate-friend"));
    const url = new URL(link);
    loadPayerViewFromParams({
      payTo: url.searchParams.get("pay_to"),
      amount: url.searchParams.get("amount"),
      friend: url.searchParams.get("friend"),
      bill: url.searchParams.get("bill"),
      memo: url.searchParams.get("memo"),
    });
  }
});

el.btnVerifyOnchain.addEventListener("click", async () => {
  if (!state.activeSplit) return;
  showStatus("Consultando ledger de Stellar Testnet en Horizon...", "info");
  const txs = await fetchIncomingSplitPayments(state.activeSplit.hostAddress);
  await renderGeneratedLinks(txs);
  await refreshWalletStatus();
  showStatus("Estado de pagos sincronizado con Horizon Testnet.", "success");
});

el.btnExecuteSplitPayment.addEventListener("click", async () => {
  if (!state.walletAddress) {
    showStatus(
      "Conecta tu Wallet de Stellar arriba (Freighter o Wallet Testnet Instantánea) para firmar el pago.",
      "error"
    );
    return;
  }

  const params = state.payerParams || {
    payTo: state.walletAddress,
    amount: "25.00",
    friend: "Kevin",
    bill: "Pizza & Birras con el Squad",
    memo: "SPLIT:101:Kevin",
  };

  try {
    el.btnExecuteSplitPayment.disabled = true;
    el.btnExecuteSplitPayment.textContent = "⏳ Firmando y enviando a Stellar Testnet...";
    showStatus(
      `Enviando pago de ${params.amount} XLM con Memo "${params.memo}" a la red Stellar Testnet...`,
      "info"
    );

    const result = await sendSplitPayment({
      senderAddress: state.walletAddress,
      senderWalletMode: state.walletMode,
      destinationAddress: params.payTo,
      amountXlm: params.amount,
      memoText: params.memo,
    });

    el.receiptTxHash.textContent = shortenAddress(result.hash);
    el.receiptTxHash.title = result.hash;
    el.receiptExplorerLink.href = result.explorerUrl;
    el.paymentReceiptBox.classList.remove("hidden");

    await refreshWalletStatus();
    if (state.activeSplit) {
      const txs = await fetchIncomingSplitPayments(state.activeSplit.hostAddress);
      await renderGeneratedLinks(txs);
    }

    showStatus(
      `¡Pago de ${params.amount} XLM confirmado en el ledger #${result.ledger}!`,
      "success"
    );
  } catch (err) {
    showStatus(`Error al procesar el pago en Stellar: ${err.message}`, "error");
  } finally {
    el.btnExecuteSplitPayment.disabled = false;
    el.btnExecuteSplitPayment.textContent =
      "🚀 Firmar y Pagar Ahora en Stellar Testnet";
  }
});

// Inicializacion al cargar la pagina
async function initApp() {
  renderFriendsTags();
  checkUrlForMagicPaymentLink();

  const existingSession = await restoreWalletSession();
  if (existingSession) {
    state.walletAddress = existingSession.address;
    state.walletMode = existingSession.mode;
    await refreshWalletStatus();
  }
}

initApp();
