import { fetchPayments } from "./horizon.js";
import {
  buildPaymentViewModel,
  formatLoadedStatus,
  formatOmittedNotice,
  formatShortAddress,
  getNextTheme,
  mapHorizonError,
  mapWalletError,
  resolveInitialTheme,
  selectSpanishVoice,
  validateCustomAddress,
  validateMovementCount,
  validateWalletConnection,
} from "./relata-ui.js";
import {
  Networks,
  StellarWalletsKit,
  SwkAppDarkTheme,
  SwkAppLightTheme,
  defaultModules,
} from "../vendor/stellar-wallets-kit/index.js";

const themeToggleBtn = document.getElementById("theme-toggle-btn");
const connectWalletBtn = document.getElementById("connect-wallet-btn");
const refreshWalletBtn = document.getElementById("refresh-wallet-btn");
const stopSpeechBtn = document.getElementById("stop-speech-btn");
const movementCountInput = document.getElementById("movement-count-input");
const customAddressForm = document.getElementById("custom-address-form");
const customAddressInput = document.getElementById("custom-address-input");
const queryAddressBtn = document.getElementById("query-address-btn");
const statusBanner = document.getElementById("status-banner");
const omittedBanner = document.getElementById("omitted-banner");
const voiceBanner = document.getElementById("voice-banner");
const accountMeta = document.getElementById("account-meta");
const paymentsList = document.getElementById("payments-list");

const THEME_STORAGE_KEY = "relata-theme";

let activeController = null;
let latestRequestId = 0;
let activeSpeechId = null;
let activeUtterance = null;
let walletKitReady = false;
let connectedWallet = null;
let activeTheme = "light";

function getKitTheme(theme) {
  return theme === "dark" ? SwkAppDarkTheme : SwkAppLightTheme;
}

function readSavedTheme() {
  try {
    return window.localStorage?.getItem(THEME_STORAGE_KEY);
  } catch {
    return null;
  }
}

function applyTheme(theme, { persist = false } = {}) {
  activeTheme = theme === "dark" ? "dark" : "light";
  document.documentElement.dataset.theme = activeTheme;
  const isDark = activeTheme === "dark";
  themeToggleBtn.setAttribute("aria-pressed", String(isDark));
  themeToggleBtn.setAttribute("aria-label", isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro");
  themeToggleBtn.textContent = isDark ? "☀ Claro" : "☾ Oscuro";

  if (walletKitReady) {
    StellarWalletsKit.setTheme(getKitTheme(activeTheme));
  }
  if (persist) {
    try {
      window.localStorage?.setItem(THEME_STORAGE_KEY, activeTheme);
    } catch {
      // Ignore storage failures in private/restricted browser contexts.
    }
  }
}

function ensureWalletKit() {
  if (walletKitReady) {
    return;
  }
  StellarWalletsKit.init({
    network: Networks.TESTNET,
    modules: defaultModules(),
    theme: getKitTheme(activeTheme),
  });
  walletKitReady = true;
}

function setBanner(element, message, tone = "info") {
  if (!message) {
    element.textContent = "";
    element.hidden = true;
    element.dataset.tone = "";
    return;
  }
  element.textContent = message;
  element.dataset.tone = tone;
  element.hidden = false;
}

function setBusy(busy, activeSource = "") {
  connectWalletBtn.disabled = busy;
  refreshWalletBtn.disabled = busy || !connectedWallet;
  queryAddressBtn.disabled = busy;
  movementCountInput.disabled = busy;
  connectWalletBtn.textContent = busy && activeSource === "wallet" ? "Conectando…" : "Conectar wallet";
  refreshWalletBtn.textContent = busy && activeSource === "refresh" ? "Consultando…" : "Nueva consulta";
  queryAddressBtn.textContent = busy && activeSource === "custom" ? "Consultando…" : "Consultar dirección";
}

function updateSpeechControls() {
  const speaking = activeSpeechId !== null;
  stopSpeechBtn.disabled = !speaking;
  for (const button of paymentsList.querySelectorAll("[data-speech-id]")) {
    const isCurrent = button.dataset.speechId === activeSpeechId;
    button.setAttribute("aria-pressed", String(isCurrent));
    button.textContent = isCurrent ? "Leyendo explicación…" : "Escuchar explicación";
  }
}

function stopSpeech({ userInitiated = false } = {}) {
  activeSpeechId = null;
  activeUtterance = null;
  if ("speechSynthesis" in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      if (userInitiated) {
        setBanner(voiceBanner, "No fue posible detener la lectura en este navegador.", "warning");
      }
    }
  }
  updateSpeechControls();
}

function speakExplanation(paymentId, text) {
  setBanner(voiceBanner, "");
  if (!("speechSynthesis" in window) || typeof window.SpeechSynthesisUtterance !== "function") {
    setBanner(
      voiceBanner,
      "Este navegador no admite lectura en voz alta. Conservamos la explicación escrita para que puedas leerla.",
      "warning",
    );
    return;
  }

  const voices = window.speechSynthesis.getVoices();
  const spanishVoice = selectSpanishVoice(voices);
  if (!spanishVoice) {
    setBanner(
      voiceBanner,
      "No encontramos una voz en español disponible en este navegador. Conservamos la explicación escrita.",
      "warning",
    );
    return;
  }

  stopSpeech({ userInitiated: false });

  try {
    const utterance = new window.SpeechSynthesisUtterance(text);
    utterance.voice = spanishVoice;
    utterance.lang = spanishVoice.lang || "es";
    activeSpeechId = paymentId;
    activeUtterance = utterance;
    updateSpeechControls();

    utterance.onend = () => {
      if (activeUtterance !== utterance) return;
      activeUtterance = null;
      activeSpeechId = null;
      updateSpeechControls();
    };

    utterance.onerror = () => {
      if (activeUtterance !== utterance) return;
      activeUtterance = null;
      activeSpeechId = null;
      updateSpeechControls();
      setBanner(
        voiceBanner,
        "No pudimos reproducir la lectura en voz alta. La explicación escrita sigue disponible.",
        "warning",
      );
    };

    window.speechSynthesis.speak(utterance);
  } catch {
    activeUtterance = null;
    activeSpeechId = null;
    updateSpeechControls();
    setBanner(
      voiceBanner,
      "No fue posible iniciar la lectura en voz alta. La explicación escrita sigue disponible.",
      "warning",
    );
  }
}

function createTextElement(tag, className, text) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  el.textContent = text;
  return el;
}

function renderPayments(payments, { account, sourceLabel, walletName = "" }) {
  paymentsList.replaceChildren();
  const pills = [];
  if (walletName) {
    pills.push(createTextElement("span", "meta-pill meta-pill-connected", `Conectado: ${walletName}`));
  }
  pills.push(
    createTextElement("span", "meta-pill", sourceLabel),
    createTextElement("span", "meta-pill", "Red: Stellar Testnet"),
    createTextElement("span", "meta-address", `Cuenta consultada: ${formatShortAddress(account)} (${account})`),
  );
  accountMeta.replaceChildren(...pills);
  accountMeta.hidden = false;

  setBanner(statusBanner, formatLoadedStatus({ address: account, count: payments.length, walletName }), "success");
  if (payments.length === 0) {
    return;
  }

  for (const rawPayment of payments) {
    const vm = buildPaymentViewModel(rawPayment);
    const item = document.createElement("li");
    item.className = "payment-card";

    const header = document.createElement("div");
    header.className = "payment-header";
    const directionBadge = createTextElement(
      "span",
      `badge badge-${vm.direction}`,
      vm.directionLabel,
    );
    const statusBadge = createTextElement("span", "badge badge-status", vm.statusLabel);
    header.append(directionBadge, statusBadge);

    const amountRow = createTextElement(
      "p",
      "payment-amount",
      `${vm.amount} ${vm.asset}`,
    );

    const details = document.createElement("dl");
    details.className = "payment-details";

    const rows = [
      ["Activo", vm.assetLabel],
      ["Fecha y hora", vm.formattedDate],
      [
        vm.direction === "sent" ? "Cuenta destino" : "Cuenta origen",
        `${vm.shortCounterparty} (${vm.counterparty})`,
      ],
    ];

    for (const [label, value] of rows) {
      const row = document.createElement("div");
      row.className = "detail-row";
      row.append(
        createTextElement("dt", "detail-term", label),
        createTextElement("dd", "detail-value", value),
      );
      details.append(row);
    }

    const explanation = createTextElement("p", "payment-explanation", vm.explanation);

    const actions = document.createElement("div");
    actions.className = "payment-actions";
    const listenBtn = document.createElement("button");
    listenBtn.type = "button";
    listenBtn.className = "btn btn-secondary";
    listenBtn.dataset.speechId = vm.id;
    listenBtn.setAttribute("aria-pressed", "false");
    listenBtn.textContent = "Escuchar explicación";
    listenBtn.addEventListener("click", () => {
      speakExplanation(vm.id, vm.explanation);
    });
    actions.append(listenBtn);

    item.append(header, amountRow, details, explanation, actions);
    paymentsList.append(item);
  }
}

function beginRequest() {
  latestRequestId += 1;
  activeController?.abort();
  activeController = new AbortController();
  stopSpeech({ userInitiated: true });
  setBanner(voiceBanner, "");
  setBanner(omittedBanner, "");
  return { requestId: latestRequestId, signal: activeController.signal };
}

function readMovementLimit() {
  const result = validateMovementCount(movementCountInput.value);
  if (!result.ok) {
    paymentsList.replaceChildren();
    accountMeta.hidden = true;
    setBanner(statusBanner, result.message, "error");
    setBusy(false);
    return null;
  }
  movementCountInput.value = String(result.limit);
  return result.limit;
}

async function loadAccountPayments(
  account,
  sourceLabel,
  { requestId, signal, limit, walletName = "", busySource = "" },
) {
  const noun = limit === 1 ? "pago compatible más reciente" : "pagos compatibles más recientes";
  const prefix = walletName ? `Conectado con ${walletName}. ` : "";
  setBanner(statusBanner, `${prefix}Consultando hasta ${limit} ${noun} en Stellar Testnet…`, "loading");
  setBusy(true, busySource || (walletName ? "wallet" : "custom"));

  try {
    const result = await fetchPayments(account, { signal, limit });
    if (requestId !== latestRequestId || signal.aborted) {
      return;
    }

    setBanner(omittedBanner, formatOmittedNotice(result.omitted), "info");
    renderPayments(result.payments, { account, sourceLabel, walletName });
  } catch (error) {
    if (error?.name === "AbortError" || requestId !== latestRequestId || signal.aborted) {
      return;
    }
    paymentsList.replaceChildren();
    accountMeta.hidden = true;
    setBanner(statusBanner, mapHorizonError(error), "error");
  } finally {
    if (requestId === latestRequestId) {
      setBusy(false);
    }
  }
}

function getSelectedWalletName() {
  try {
    return StellarWalletsKit.selectedModule?.productName || "la wallet";
  } catch {
    return "la wallet";
  }
}

async function verifyAndLoadConnectedWallet(address, walletName, { requestId, signal, limit, busySource }) {
  let networkDetails;
  let networkError;
  try {
    networkDetails = await StellarWalletsKit.getNetwork();
  } catch (error) {
    networkError = error;
  }
  if (requestId !== latestRequestId || signal.aborted) return;

  const state = validateWalletConnection({
    address,
    walletName,
    networkDetails,
    networkError,
  });

  if (!state.ok) {
    connectedWallet = null;
    StellarWalletsKit.disconnect().catch(() => {});
    setBanner(statusBanner, state.message, "error");
    return;
  }

  connectedWallet = { address: state.address, walletName: state.walletName };
  const sourceLabel = state.networkVerified
    ? `Modo: ${state.walletName} (solo lectura · Testnet verificada)`
    : `Modo: ${state.walletName} (solo lectura · consulta en Testnet; esta wallet no informa su red activa)`;

  await loadAccountPayments(state.address, sourceLabel, {
    requestId,
    signal,
    limit,
    walletName: state.walletName,
    busySource,
  });
}

async function handleConnectWallet() {
  const { requestId, signal } = beginRequest();
  const limit = readMovementLimit();
  if (limit === null) return;
  paymentsList.replaceChildren();
  accountMeta.hidden = true;
  setBanner(statusBanner, "Conectando con tu wallet… Elige una opción en la ventana emergente.", "loading");
  setBusy(true, "wallet");

  try {
    ensureWalletKit();
    const { address } = await StellarWalletsKit.authModal();
    if (requestId !== latestRequestId || signal.aborted) return;

    await verifyAndLoadConnectedWallet(address, getSelectedWalletName(), {
      requestId,
      signal,
      limit,
      busySource: "wallet",
    });
  } catch (error) {
    if (requestId === latestRequestId && !signal.aborted) {
      const mapped = mapWalletError(error, getSelectedWalletName());
      if (mapped.code !== "modal_closed") {
        connectedWallet = null;
      }
      setBanner(statusBanner, mapped.message, mapped.tone);
    }
  } finally {
    if (requestId === latestRequestId) {
      setBusy(false);
    }
  }
}

async function handleRefreshWallet() {
  const { requestId, signal } = beginRequest();
  if (!connectedWallet) {
    setBanner(statusBanner, "Primero conecta una wallet para consultar sus movimientos.", "error");
    setBusy(false);
    return;
  }
  const limit = readMovementLimit();
  if (limit === null) return;
  paymentsList.replaceChildren();
  accountMeta.hidden = true;
  setBusy(true, "refresh");

  try {
    await verifyAndLoadConnectedWallet(connectedWallet.address, connectedWallet.walletName, {
      requestId,
      signal,
      limit,
      busySource: "refresh",
    });
  } catch {
    if (requestId === latestRequestId && !signal.aborted) {
      setBanner(
        statusBanner,
        "No pudimos actualizar la consulta de la wallet conectada. Inténtalo de nuevo.",
        "error",
      );
    }
  } finally {
    if (requestId === latestRequestId) {
      setBusy(false);
    }
  }
}

async function handleCustomAddress(event) {
  event.preventDefault();
  const { requestId, signal } = beginRequest();
  const validation = validateCustomAddress(customAddressInput.value);
  if (!validation.ok) {
    if (validation.code === "secret_key_rejected") {
      customAddressInput.value = "";
    }
    paymentsList.replaceChildren();
    accountMeta.hidden = true;
    setBanner(statusBanner, validation.message, "error");
    setBusy(false);
    return;
  }
  const limit = readMovementLimit();
  if (limit === null) return;
  customAddressInput.value = validation.address;
  await loadAccountPayments(validation.address, "Modo: Dirección pública consultada", { requestId, signal, limit });
}

applyTheme(
  resolveInitialTheme({
    savedTheme: readSavedTheme(),
    prefersDark: window.matchMedia?.("(prefers-color-scheme: dark)")?.matches === true,
  }),
);

themeToggleBtn.addEventListener("click", () => {
  applyTheme(getNextTheme(activeTheme), { persist: true });
});
connectWalletBtn.addEventListener("click", handleConnectWallet);
refreshWalletBtn.addEventListener("click", handleRefreshWallet);
customAddressForm.addEventListener("submit", handleCustomAddress);
stopSpeechBtn.addEventListener("click", () => stopSpeech({ userInitiated: true }));

if ("speechSynthesis" in window && typeof window.speechSynthesis.addEventListener === "function") {
  window.speechSynthesis.addEventListener("voiceschanged", () => {
    if (selectSpanishVoice(window.speechSynthesis.getVoices()) && voiceBanner.dataset.tone === "warning") {
      setBanner(voiceBanner, "");
    }
  });
}
