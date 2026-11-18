// Configuración de red y helpers de Horizon.
// Basado en la sección "SDK Initialization" / "Transaction Building" del skill
// stellar-dev.dapp que devolvió Stellar Raven.
import * as StellarSdk from "https://esm.sh/@stellar/stellar-sdk@16";

export { StellarSdk };

export const config = {
  network: "TESTNET",
  horizonUrl: "https://horizon-testnet.stellar.org",
  networkPassphrase: StellarSdk.Networks.TESTNET,
  friendbotUrl: "https://friendbot.stellar.org",
  explorerTx: (hash) => `https://stellar.expert/explorer/testnet/tx/${hash}`,
};

export const horizon = new StellarSdk.Horizon.Server(config.horizonUrl);

/** Devuelve el balance nativo (XLM) o null si la cuenta no existe todavía. */
export async function getXlmBalance(address) {
  try {
    const account = await horizon.loadAccount(address);
    const native = account.balances.find((b) => b.asset_type === "native");
    return native ? native.balance : "0";
  } catch (err) {
    if (err?.response?.status === 404 || err?.name === "NotFoundError") return null;
    throw err;
  }
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

export function isValidAddress(address) {
  return StellarSdk.StrKey.isValidEd25519PublicKey(address);
}

/** Arma una transacción de pago en XLM y devuelve el XDR sin firmar. */
export async function buildPaymentXdr(source, destination, amount, memoText) {
  const account = await horizon.loadAccount(source);
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
  const tx = StellarSdk.TransactionBuilder.fromXDR(signedXdr, config.networkPassphrase);
  return horizon.submitTransaction(tx);
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
