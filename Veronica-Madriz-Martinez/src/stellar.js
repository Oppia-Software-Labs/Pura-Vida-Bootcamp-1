// Configuración de red y helpers de Horizon.
// Basado en la sección "SDK Initialization" / "Transaction Building" del skill
// stellar-dev.dapp que devolvió Stellar Raven.
//
// El SDK se carga "perezosamente" (cuando se necesita) y con varios CDN de
// respaldo. Así, si un CDN falla, la página igual carga y los botones funcionan.
import { loadScript } from "./loader.js";

export const config = {
  network: "TESTNET",
  horizonUrl: "https://horizon-testnet.stellar.org",
  // Igual a StellarSdk.Networks.TESTNET; escrito aquí para no depender del SDK.
  networkPassphrase: "Test SDF Network ; September 2015",
  friendbotUrl: "https://friendbot.stellar.org",
  explorerTx: (hash) => `https://stellar.expert/explorer/testnet/tx/${hash}`,
};

let sdkPromise = null;

/** Carga el SDK de Stellar (bundle oficial para navegador) una sola vez. */
export function getSdk() {
  if (!sdkPromise) {
    sdkPromise = (async () => {
      const sources = [
        "https://cdn.jsdelivr.net/npm/@stellar/stellar-sdk/dist/stellar-sdk.min.js",
        "https://unpkg.com/@stellar/stellar-sdk/dist/stellar-sdk.min.js",
      ];
      for (const src of sources) {
        try {
          await loadScript(src);
          if (window.StellarSdk) return window.StellarSdk;
        } catch (err) {
          console.warn("[stellar] no cargó", src, err);
        }
      }
      // Último recurso: versión ES module.
      const mod = await import("https://esm.sh/@stellar/stellar-sdk");
      return mod.default?.Horizon ? mod.default : mod;
    })().catch((err) => {
      sdkPromise = null; // permite reintentar
      throw new Error("No pude cargar el SDK de Stellar. Revisa tu conexión o bloqueadores de anuncios.", { cause: err });
    });
  }
  return sdkPromise;
}

let horizonServer = null;
async function horizon() {
  if (!horizonServer) {
    const StellarSdk = await getSdk();
    horizonServer = new StellarSdk.Horizon.Server(config.horizonUrl);
  }
  return horizonServer;
}

/** Devuelve el balance nativo (XLM) o null si la cuenta no existe todavía. */
export async function getXlmBalance(address) {
  // Fetch directo a Horizon: no necesita el SDK.
  const res = await fetch(`${config.horizonUrl}/accounts/${address}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Horizon respondió ${res.status}`);
  const account = await res.json();
  const native = account.balances.find((b) => b.asset_type === "native");
  return native ? native.balance : "0";
}

/** Fondea una cuenta de Testnet con Friendbot. */
export async function fundWithFriendbot(address) {
  const res = await fetch(`${config.friendbotUrl}?addr=${encodeURIComponent(address)}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    // Friendbot responde 400 si la cuenta ya fue fondeada.
    throw new Error(body.detail || `Friendbot respondió ${res.status}`);
  }
  return res.json();
}

/** Valida una dirección G... (usa el SDK; si no cargó, revisa el formato). */
export async function isValidAddress(address) {
  try {
    const StellarSdk = await getSdk();
    return StellarSdk.StrKey.isValidEd25519PublicKey(address);
  } catch {
    return /^G[A-Z2-7]{55}$/.test(address);
  }
}

/** Arma una transacción de pago en XLM y devuelve el XDR sin firmar. */
export async function buildPaymentXdr(source, destination, amount, memoText) {
  const StellarSdk = await getSdk();
  const account = await (await horizon()).loadAccount(source);
  const builder = new StellarSdk.TransactionBuilder(account, {
    fee: StellarSdk.BASE_FEE,
    networkPassphrase: config.networkPassphrase,
  })
    .addOperation(
      StellarSdk.Operation.payment({
        destination,
        asset: StellarSdk.Asset.native(),
        amount: String(amount),
      })
    )
    .setTimeout(180);

  if (memoText) builder.addMemo(StellarSdk.Memo.text(memoText.slice(0, 28)));
  return builder.build().toXDR();
}

/** Envía un XDR firmado a Horizon (pago clásico, no Soroban). */
export async function submitSignedXdr(signedXdr) {
  const StellarSdk = await getSdk();
  const tx = StellarSdk.TransactionBuilder.fromXDR(signedXdr, config.networkPassphrase);
  return (await horizon()).submitTransaction(tx);
}

/** Traduce errores de Horizon a mensajes entendibles. */
export function explainHorizonError(err) {
  const codes = err?.response?.data?.extras?.result_codes;
  if (!codes) return err?.message || String(err);
  const op = codes.operations?.[0];
  const map = {
    op_underfunded: "No tienes suficiente XLM para ese monto.",
    op_no_destination: "La cuenta destino no existe en Testnet (debe fondearse primero).",
    op_low_reserve: "El monto dejaría la cuenta por debajo de la reserva mínima.",
    tx_bad_seq: "Número de secuencia inválido; intenta de nuevo.",
    tx_insufficient_fee: "Comisión insuficiente; intenta de nuevo.",
  };
  return map[op] || map[codes.transaction] || `Error de Horizon: ${codes.transaction} ${op || ""}`;
}
