import { describePayment } from "./payments.js";

export const TESTNET_PASSPHRASE = "Test SDF Network ; September 2015";
export const WRONG_NETWORK_MESSAGE =
  "Relata funciona con la red de pruebas en esta versión. Cambia tu wallet a Testnet para continuar.";
export const DEFAULT_MOVEMENT_LIMIT = 5;
export const MIN_MOVEMENT_LIMIT = 1;
export const MAX_MOVEMENT_LIMIT = 50;

const STELLAR_ADDRESS_RE = /^G[A-Z2-7]{55}$/;
const STELLAR_SECRET_RE = /^S[A-Z2-7]{55}$/;

export function isValidStellarAddress(address) {
  return typeof address === "string" && STELLAR_ADDRESS_RE.test(address);
}

export function validateMovementCount(rawValue) {
  if (typeof rawValue === "number") {
    if (Number.isInteger(rawValue) && rawValue >= MIN_MOVEMENT_LIMIT && rawValue <= MAX_MOVEMENT_LIMIT) {
      return { ok: true, limit: rawValue };
    }
    return {
      ok: false,
      code: "invalid_limit",
      message: `Ingresa una cantidad entera de movimientos entre ${MIN_MOVEMENT_LIMIT} y ${MAX_MOVEMENT_LIMIT}.`,
    };
  }
  if (typeof rawValue !== "string") {
    return {
      ok: false,
      code: "invalid_limit",
      message: `Ingresa una cantidad entera de movimientos entre ${MIN_MOVEMENT_LIMIT} y ${MAX_MOVEMENT_LIMIT}.`,
    };
  }
  const trimmed = rawValue.trim();
  if (trimmed === "") {
    return { ok: true, limit: DEFAULT_MOVEMENT_LIMIT };
  }
  if (!/^\d+$/.test(trimmed)) {
    return {
      ok: false,
      code: "invalid_limit",
      message: `Ingresa una cantidad entera de movimientos entre ${MIN_MOVEMENT_LIMIT} y ${MAX_MOVEMENT_LIMIT}.`,
    };
  }
  const parsed = Number(trimmed);
  if (parsed < MIN_MOVEMENT_LIMIT || parsed > MAX_MOVEMENT_LIMIT) {
    return {
      ok: false,
      code: "invalid_limit",
      message: `Ingresa una cantidad entera de movimientos entre ${MIN_MOVEMENT_LIMIT} y ${MAX_MOVEMENT_LIMIT}.`,
    };
  }
  return { ok: true, limit: parsed };
}

export function validateCustomAddress(rawInput) {
  if (typeof rawInput !== "string") {
    return {
      ok: false,
      code: "invalid_account",
      message: "La dirección pública debe empezar por G y tener 56 caracteres válidos de Stellar.",
    };
  }
  const address = rawInput.trim();
  if (address.length === 0) {
    return {
      ok: false,
      code: "empty_account",
      message: "Ingresa una dirección pública de Stellar Testnet (empieza por G).",
    };
  }
  if (STELLAR_SECRET_RE.test(address)) {
    return {
      ok: false,
      code: "secret_key_rejected",
      message:
        "Parece una clave secreta (empieza por S). Por seguridad, nunca la ingreses aquí; usa solo tu dirección pública (empieza por G).",
    };
  }
  if (!isValidStellarAddress(address)) {
    return {
      ok: false,
      code: "invalid_account",
      message: "La dirección pública debe empezar por G y tener 56 caracteres válidos de Stellar.",
    };
  }
  return { ok: true, address };
}

export function formatAccountSuffix(address, length = 4) {
  if (!isValidStellarAddress(address) || !Number.isInteger(length) || length < 1) {
    return "";
  }
  return address.slice(-length);
}

export function formatShortAddress(address, prefix = 4, suffix = 4) {
  if (!isValidStellarAddress(address)) {
    return "";
  }
  return `${address.slice(0, prefix)}…${address.slice(-suffix)}`;
}

export function formatPaymentDate(isoString, { locale = "es", timeZone } = {}) {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) {
    return String(isoString ?? "");
  }
  const options = {
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  };
  if (timeZone) {
    options.timeZone = timeZone;
  }
  return new Intl.DateTimeFormat(locale, options).format(date);
}

function isUnsupportedGetNetworkError(error) {
  if (!error) {
    return false;
  }
  const message = typeof error === "string" ? error : String(error?.message ?? "");
  return /does not support the ["']?getNetwork["']?/i.test(message)
    || (error?.code === -3 && /getNetwork/i.test(message));
}

export function validateWalletConnection({
  address,
  walletName = "la wallet",
  networkDetails,
  networkError,
} = {}) {
  const label = typeof walletName === "string" && walletName.trim() ? walletName.trim() : "la wallet";
  if (!address) {
    return {
      ok: false,
      code: "wallet_missing_address",
      message: `No recibimos ninguna dirección pública desde ${label}. Puedes intentarlo de nuevo o escribir una dirección pública.`,
    };
  }
  if (!isValidStellarAddress(address)) {
    return {
      ok: false,
      code: "invalid_account",
      message: `La dirección pública devuelta por ${label} no tiene un formato Stellar válido.`,
    };
  }
  if (networkError) {
    if (isUnsupportedGetNetworkError(networkError)) {
      return { ok: true, address, walletName: label, networkVerified: false };
    }
    return {
      ok: false,
      code: "network_details_error",
      message: `No pudimos comprobar la red activa en ${label}. Revisa la extensión e inténtalo de nuevo.`,
    };
  }
  if (networkDetails?.error) {
    return {
      ok: false,
      code: "network_details_error",
      message: `No pudimos comprobar la red activa en ${label}. Revisa la extensión e inténtalo de nuevo.`,
    };
  }
  if (networkDetails?.networkPassphrase !== TESTNET_PASSPHRASE) {
    return {
      ok: false,
      code: "wrong_network",
      message: WRONG_NETWORK_MESSAGE,
    };
  }
  return { ok: true, address, walletName: label, networkVerified: true };
}

export function mapWalletError(error, walletName = "la wallet") {
  const label = typeof walletName === "string" && walletName.trim() ? walletName.trim() : "la wallet";
  const rawMessage = typeof error === "string" ? error : String(error?.message ?? "");

  if (/closed the modal/i.test(rawMessage)) {
    return {
      code: "modal_closed",
      tone: "info",
      message: "Selección de wallet cancelada. Puedes volver a intentarlo o escribir una dirección pública.",
    };
  }
  if (/declined|rejected|denied|cancel/i.test(rawMessage)) {
    return {
      code: "access_rejected",
      tone: "error",
      message: `No concediste acceso a tu dirección pública en ${label}. Puedes intentarlo de nuevo o escribir otra dirección pública.`,
    };
  }
  if (/not connected|not installed|unavailable|not found/i.test(rawMessage)) {
    return {
      code: "wallet_unavailable",
      tone: "error",
      message: `No detectamos ${label} lista en este navegador. Verifica que la extensión esté instalada y desbloqueada, o escribe una dirección pública de Testnet.`,
    };
  }
  return {
    code: "wallet_error",
    tone: "error",
    message: `No pudimos completar la conexión con ${label}. Comprueba que esté desbloqueada e inténtalo de nuevo, o escribe una dirección pública de Testnet.`,
  };
}

export function mapHorizonError(error) {
  switch (error?.code) {
    case "invalid_limit":
      return `Ingresa una cantidad entera de movimientos entre ${MIN_MOVEMENT_LIMIT} y ${MAX_MOVEMENT_LIMIT}.`;
    case "invalid_account":
      return "La dirección pública indicada no es válida para consultar Stellar Testnet.";
    case "account_not_found":
      return "Esta cuenta todavía no existe en Testnet o no tiene historial registrado en la red de pruebas.";
    case "rate_limited":
      return "Horizon Testnet alcanzó su límite de consultas temporalmente. Espera unos segundos e inténtalo de nuevo.";
    case "invalid_response":
      return "Stellar Testnet devolvió una respuesta inesperada que Relata no pudo interpretar con seguridad.";
    case "network_error":
    default:
      return "No pudimos consultar Stellar Testnet en este momento. Verifica tu conexión e inténtalo de nuevo.";
  }
}

export function formatOmittedNotice(omitted) {
  if (!Number.isInteger(omitted) || omitted <= 0) {
    return "";
  }
  if (omitted === 1) {
    return "Se omitió 1 operación que Relata todavía no sabe explicar en los registros revisados.";
  }
  return `Se omitieron ${omitted} operaciones que Relata todavía no sabe explicar en los registros revisados.`;
}

export function getNextTheme(currentTheme) {
  return currentTheme === "dark" ? "light" : "dark";
}

export function resolveInitialTheme({ savedTheme, prefersDark = false } = {}) {
  if (savedTheme === "dark" || savedTheme === "light") {
    return savedTheme;
  }
  return prefersDark ? "dark" : "light";
}

export function formatLoadedStatus({ address, count = 0, walletName = "" } = {}) {
  const short = formatShortAddress(address) || "cuenta";
  const prefix = typeof walletName === "string" && walletName.trim()
    ? `Wallet conectada (${walletName.trim()} · ${short}).`
    : `Consulta completada (${short}).`;
  if (!Number.isInteger(count) || count <= 0) {
    return `${prefix} No encontramos pagos compatibles recientes (XLM, USDC o EURC verificado de Testnet en operaciones simples completadas).`;
  }
  const noun = count === 1 ? "pago compatible" : "pagos compatibles";
  return `${prefix} Mostrando ${count} ${noun}.`;
}

export function selectSpanishVoice(voices) {
  if (!Array.isArray(voices) || voices.length === 0) {
    return null;
  }
  const spanish = voices.filter(
    (voice) => typeof voice?.lang === "string" && voice.lang.toLowerCase().startsWith("es"),
  );
  if (spanish.length === 0) {
    return null;
  }
  const localSpanish = spanish.find((voice) => voice.localService === true);
  return localSpanish ?? spanish[0];
}

export function buildPaymentViewModel(payment, { timeZone } = {}) {
  const date = formatPaymentDate(payment.createdAt, { timeZone });
  const accountSuffix = formatAccountSuffix(payment.counterparty);
  const shortCounterparty = formatShortAddress(payment.counterparty);
  const directionLabel = payment.direction === "sent" ? "Enviado" : "Recibido";
  const assetLabel = payment.asset === "USDC"
    ? "USDC de Testnet verificado"
    : payment.asset === "EURC"
      ? "EURC de Testnet verificado"
      : "XLM";

  return {
    id: payment.id,
    direction: payment.direction,
    directionLabel,
    amount: payment.amount,
    asset: payment.asset,
    assetLabel,
    createdAt: payment.createdAt,
    formattedDate: date,
    counterparty: payment.counterparty,
    shortCounterparty,
    accountSuffix,
    statusLabel: "Completado",
    explanation: describePayment(payment, { date, accountSuffix }),
  };
}
