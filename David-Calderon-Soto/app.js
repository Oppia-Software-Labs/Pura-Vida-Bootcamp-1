import * as freighter from "https://esm.sh/@stellar/freighter-api";

// Horizon Testnet endpoints
const HORIZON_TESTNET_URL = "https://horizon-testnet.stellar.org";
const FRIENDBOT_URL = "https://friendbot.stellar.org";

// DOM Elements
const btnFreighter = document.getElementById("btnFreighter");
const btnAlbedo = document.getElementById("btnAlbedo");
const btnGenerateKeypair = document.getElementById("btnGenerateKeypair");
const btnLookup = document.getElementById("btnLookup");
const manualInput = document.getElementById("manualInput");
const accountArea = document.getElementById("accountArea");
const accountAddressDisplay = document.getElementById("accountAddressDisplay");
const walletProviderBadge = document.getElementById("walletProviderBadge");
const mainBalance = document.getElementById("mainBalance");
const accountStatusText = document.getElementById("accountStatusText");
const accountSequence = document.getElementById("accountSequence");
const accountSubentries = document.getElementById("accountSubentries");
const btnFriendbot = document.getElementById("btnFriendbot");
const btnRefresh = document.getElementById("btnRefresh");
const linkExplorer = document.getElementById("linkExplorer");
const txListContainer = document.getElementById("txListContainer");
const alertBox = document.getElementById("alertBox");
const alertMsg = document.getElementById("alertMsg");

let activePublicKey = null;

// Helpers: Notifications
function showAlert(message, type = "success") {
  alertBox.className = `alert-box alert-${type} show`;
  alertMsg.textContent = message;
  setTimeout(() => {
    alertBox.className = "alert-box";
  }, 6000);
}

// Format balance
function formatAmount(amount) {
  const num = parseFloat(amount);
  return isNaN(num) ? "0.00" : num.toLocaleString("es-CR", { minimumFractionDigits: 2, maximumFractionDigits: 7 });
}

// Truncate public key
function truncateKey(key) {
  if (!key || key.length < 12) return key;
  return `${key.slice(0, 6)}...${key.slice(-6)}`;
}

// Animate the hero balance counting up to its fetched value
function animateBalanceTo(targetAmount) {
  const targetNum = parseFloat(targetAmount);
  if (isNaN(targetNum)) {
    mainBalance.textContent = "0.00";
    return;
  }

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    mainBalance.textContent = formatAmount(targetNum);
    return;
  }

  const startNum = 0;
  const durationMs = 700;
  const startTime = performance.now();

  function step(now) {
    const progress = Math.min((now - startTime) / durationMs, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    mainBalance.textContent = formatAmount(startNum + (targetNum - startNum) * eased);
    if (progress < 1) requestAnimationFrame(step);
  }

  requestAnimationFrame(step);
}

// 1. Connect Freighter Wallet
async function connectFreighter() {
  try {
    showAlert("Conectando con Freighter...", "warning");

    const { isConnected } = await freighter.isConnected();
    if (!isConnected) {
      showAlert("La extensión Freighter no está instalada o no está activa en tu navegador.", "error");
      return;
    }

    const { address: publicKey, error } = await freighter.requestAccess();
    if (error || !publicKey) {
      showAlert(error ? `Freighter rechazó la conexión: ${error}` : "No se concedió acceso a la billetera Freighter.", "warning");
      return;
    }

    setConnectedAccount(publicKey, "Freighter");
    showAlert(`Conectado exitosamente con Freighter (${truncateKey(publicKey)})`, "success");
    await fetchAccountData(publicKey);
  } catch (error) {
    console.error("Error conectando con Freighter:", error);
    showAlert(`Error al conectar Freighter: ${error.message || error}`, "error");
  }
}

// 2. Connect Albedo Wallet (Universal popup)
async function connectAlbedo() {
  try {
    showAlert("Abriendo ventana de Albedo...", "warning");
    if (!window.albedo) {
      showAlert("El módulo de Albedo no cargó correctamente.", "error");
      return;
    }

    const res = await window.albedo.publicKey({
      token: "pura-vida-bootcamp"
    });

    if (res && res.pubkey) {
      setConnectedAccount(res.pubkey, "Albedo");
      showAlert(`Conectado con Albedo: ${truncateKey(res.pubkey)}`, "success");
      await fetchAccountData(res.pubkey);
    }
  } catch (error) {
    console.error("Error conectando Albedo:", error);
    showAlert("Conexión con Albedo cancelada o fallida.", "warning");
  }
}

// 3. Generate Random Testnet Keypair
function generateTestnetKeypair() {
  try {
    if (!window.StellarSdk) {
      showAlert("Stellar SDK no está listo.", "error");
      return;
    }
    const pair = window.StellarSdk.Keypair.random();
    const publicKey = pair.publicKey();
    const secretKey = pair.secret();

    setConnectedAccount(publicKey, "Keypair Demo");
    manualInput.value = publicKey;
    showAlert(`Nuevo par de claves generado. Clave Secreta: ${secretKey}`, "success");
    fetchAccountData(publicKey);
  } catch (err) {
    console.error(err);
    showAlert("Error al generar claves de prueba.", "error");
  }
}

// Set Account in UI
function setConnectedAccount(publicKey, provider) {
  activePublicKey = publicKey;
  accountArea.hidden = false;
  accountAddressDisplay.textContent = publicKey;
  walletProviderBadge.textContent = provider;
  linkExplorer.href = `https://stellar.expert/explorer/testnet/account/${publicKey}`;
}

// 4. Fetch Account Data from Horizon Testnet
async function fetchAccountData(publicKey) {
  if (!publicKey) return;

  accountStatusText.textContent = "Consultando datos en Horizon Testnet...";
  mainBalance.textContent = "...";

  try {
    const res = await fetch(`${HORIZON_TESTNET_URL}/accounts/${publicKey}`);

    if (res.status === 404) {
      mainBalance.textContent = "0.00";
      accountStatusText.textContent = "La cuenta aún no existe en Testnet. Usa Recargar con Friendbot para activarla con 10,000 XLM de prueba.";
      accountSequence.textContent = "Sin inicializar";
      accountSubentries.textContent = "0";
      renderEmptyTxState("Cuenta sin transacciones aún. Fondea la cuenta para comenzar.");
      return;
    }

    if (!res.ok) {
      throw new Error(`Horizon respondió con status ${res.status}`);
    }

    const data = await res.json();

    // Extract native XLM balance
    const nativeBal = data.balances.find(b => b.asset_type === "native");
    const xlmAmount = nativeBal ? nativeBal.balance : "0.00";

    animateBalanceTo(xlmAmount);
    accountStatusText.textContent = `Cuenta activa en Stellar Testnet (${data.balances.length} activos)`;
    accountSequence.textContent = data.sequence || "—";
    accountSubentries.textContent = data.subentry_count || "0";

    // Load recent transactions
    loadRecentTransactions(publicKey);
  } catch (err) {
    console.error("Error al consultar Horizon:", err);
    mainBalance.textContent = "0.00";
    accountStatusText.textContent = "Error al conectar con Horizon Testnet.";
    showAlert("No se pudo obtener información de la cuenta en Horizon.", "error");
  }
}

// 5. Request Funds from Friendbot
async function requestFriendbot() {
  if (!activePublicKey) {
    showAlert("Primero conecta o ingresa una clave pública.", "warning");
    return;
  }

  showAlert(`Solicitando 10,000 XLM a Friendbot para ${truncateKey(activePublicKey)}...`, "warning");
  btnFriendbot.disabled = true;

  try {
    const res = await fetch(`${FRIENDBOT_URL}?addr=${encodeURIComponent(activePublicKey)}`);
    if (res.ok) {
      showAlert("¡Fondos de prueba recibidos exitosamente (+10,000 XLM)!", "success");
      await fetchAccountData(activePublicKey);
    } else {
      const errData = await res.text();
      showAlert(`Friendbot no pudo fondear la cuenta: ${errData}`, "error");
    }
  } catch (error) {
    console.error("Error en Friendbot:", error);
    showAlert("Error al conectar con el servicio Friendbot.", "error");
  } finally {
    btnFriendbot.disabled = false;
  }
}

// Render an empty-state message inside the transaction log
function renderEmptyTxState(message) {
  txListContainer.replaceChildren();
  const empty = document.createElement("p");
  empty.className = "tx-empty";
  empty.textContent = message;
  txListContainer.appendChild(empty);
}

// 6. Load Recent Transactions
async function loadRecentTransactions(publicKey) {
  try {
    const res = await fetch(`${HORIZON_TESTNET_URL}/accounts/${publicKey}/transactions?order=desc&limit=5`);
    if (!res.ok) return;

    const data = await res.json();
    const records = data._embedded?.records || [];

    if (records.length === 0) {
      renderEmptyTxState("Sin transacciones recientes registradas.");
      return;
    }

    txListContainer.replaceChildren();
    records.forEach(tx => {
      txListContainer.appendChild(buildTxEntry(tx));
    });
  } catch (err) {
    console.error("Error cargando transacciones:", err);
  }
}

// Build one transaction-log row as real DOM nodes (no innerHTML)
function buildTxEntry(tx) {
  const entry = document.createElement("div");
  entry.className = "tx-entry";

  const main = document.createElement("div");
  main.className = "tx-main";

  const hashLink = document.createElement("a");
  hashLink.className = "tx-hash";
  hashLink.href = tx._links?.self?.href || "#";
  hashLink.target = "_blank";
  hashLink.rel = "noopener";
  hashLink.textContent = truncateKey(tx.id);

  const detail = document.createElement("span");
  detail.className = "tx-detail";
  detail.textContent = `${tx.operation_count} ops, ${tx.fee_charged} stroops`;

  main.append(hashLink, detail);

  const time = document.createElement("span");
  time.className = "tx-time";
  time.textContent = new Date(tx.created_at).toLocaleTimeString("es-CR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });

  entry.append(main, time);
  return entry;
}

// Event Listeners
btnFreighter.addEventListener("click", connectFreighter);
btnAlbedo.addEventListener("click", connectAlbedo);
btnGenerateKeypair.addEventListener("click", generateTestnetKeypair);
btnFriendbot.addEventListener("click", requestFriendbot);
btnRefresh.addEventListener("click", () => fetchAccountData(activePublicKey));

function lookupAccount(candidateKey) {
  if (!candidateKey.startsWith("G") || candidateKey.length !== 56) {
    showAlert("Ingresa una clave pública Stellar válida (debe empezar con 'G' y tener 56 caracteres).", "error");
    return;
  }
  setConnectedAccount(candidateKey, "Manual Lookup");
  fetchAccountData(candidateKey);
}

btnLookup.addEventListener("click", () => lookupAccount(manualInput.value.trim()));

// Allow sharing a direct link to a given account, e.g. ?cuenta=G...
const sharedAccount = new URLSearchParams(window.location.search).get("cuenta");
if (sharedAccount) {
  manualInput.value = sharedAccount;
  lookupAccount(sharedAccount.trim());
}
