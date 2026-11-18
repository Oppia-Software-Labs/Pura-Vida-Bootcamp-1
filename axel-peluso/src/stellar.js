import {
  Asset,
  BASE_FEE,
  Horizon,
  Networks,
  NotFoundError,
  Operation,
  StrKey,
  TransactionBuilder,
} from "@stellar/stellar-sdk";
import { StellarWalletsKit, Networks as KitNetworks } from "@creit-tech/stellar-wallets-kit";
import { VarialModule, VARIAL_ID } from "@creit-tech/stellar-wallets-kit/modules/varial";
import { AppError } from "./errors.js";

export const HORIZON_URL = "https://horizon-testnet.stellar.org";
export const NETWORK_PASSPHRASE = Networks.TESTNET;
// USDC de Circle en testnet
export const USDC_ISSUER = "GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5";

export const USDC = new Asset("USDC", USDC_ISSUER);

export const horizon = new Horizon.Server(HORIZON_URL);

// Stellar Wallets Kit v2 es un singleton estático: se inicializa una sola vez.
// Freighter ahora se llama Varial; su módulo en el kit es VarialModule.
const varial = new VarialModule();

StellarWalletsKit.init({
  modules: [varial],
  network: KitNetworks.TESTNET,
  selectedWalletId: VARIAL_ID,
});

export async function connectFreighter() {
  if (!(await varial.isAvailable())) {
    throw new AppError(
      "No se encontró la wallet Freighter. Instala la extensión desde freighter.app, recarga la página y vuelve a intentarlo."
    );
  }
  StellarWalletsKit.setWallet(VARIAL_ID);
  // fetchAddress pide permiso a la extensión y devuelve la dirección.
  const { address } = await StellarWalletsKit.fetchAddress();
  if (!address) throw new AppError("Freighter no devolvió ninguna dirección. Desbloquea la wallet e inténtalo de nuevo.");
  return address;
}

// Devuelve true si la wallet está en Testnet (compara el passphrase de la red).
export async function isWalletOnTestnet() {
  const { networkPassphrase } = await StellarWalletsKit.getNetwork();
  return networkPassphrase === NETWORK_PASSPHRASE;
}

export async function disconnectWallet() {
  await StellarWalletsKit.disconnect();
}

export async function getBalances(address) {
  try {
    const account = await horizon.loadAccount(address);
    const xlm = account.balances.find((b) => b.asset_type === "native");
    const usdc = account.balances.find(
      (b) => b.asset_code === USDC.getCode() && b.asset_issuer === USDC.getIssuer()
    );
    return {
      funded: true,
      xlm: xlm?.balance ?? "0",
      usdc: usdc ? usdc.balance : null, // null = sin trustline a USDC
    };
  } catch (err) {
    if (err instanceof NotFoundError) return { funded: false, xlm: "0", usdc: null };
    throw err;
  }
}

const TYPE_LABELS = {
  payment: "Pago",
  create_account: "Creación de cuenta",
  account_merge: "Fusión de cuenta",
  path_payment_strict_send: "Pago con conversión",
  path_payment_strict_receive: "Pago con conversión",
};

// Últimos pagos de la cuenta (endpoint /accounts/{id}/payments de Horizon).
export async function getRecentPayments(address, limit = 5) {
  try {
    const page = await horizon.payments().forAccount(address).order("desc").limit(limit).call();
    return page.records.map((r) => {
      const isCreate = r.type === "create_account";
      const destination = isCreate ? r.account : r.type === "account_merge" ? r.into : r.to;
      const asset = r.asset_type === "native" || isCreate || r.type === "account_merge" ? "XLM" : r.asset_code;
      return {
        id: r.id,
        date: new Date(r.created_at),
        type: TYPE_LABELS[r.type] ?? r.type,
        amount: isCreate ? r.starting_balance : r.amount ?? null,
        asset,
        destination: destination ?? null,
        outgoing: destination ? destination !== address : false,
        txHash: r.transaction_hash,
      };
    });
  } catch (err) {
    if (err instanceof NotFoundError) return [];
    throw err;
  }
}

// Firma con Freighter y envía a Horizon una transacción ya construida.
async function signAndSubmit(tx, address) {
  const { signedTxXdr } = await StellarWalletsKit.signTransaction(tx.toXDR(), {
    networkPassphrase: NETWORK_PASSPHRASE,
    address,
  });
  const signed = TransactionBuilder.fromXDR(signedTxXdr, NETWORK_PASSPHRASE);
  try {
    const res = await horizon.submitTransaction(signed);
    return res.hash;
  } catch (err) {
    const codes = err?.response?.data?.extras?.result_codes;
    if (codes) {
      const e = new Error(`Transacción rechazada: ${JSON.stringify(codes)}`);
      e.resultCodes = codes;
      throw e;
    }
    throw err;
  }
}

// Agrega la trustline de USDC (changeTrust sin límite = límite máximo).
export async function addUsdcTrustline(address) {
  const account = await horizon.loadAccount(address);
  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(Operation.changeTrust({ asset: USDC }))
    .setTimeout(180)
    .build();
  return signAndSubmit(tx, address);
}

// Reserva base de Stellar: cada cuenta debe mantener 1 XLM (2 × 0,5) más 0,5 por subentrada.
const BASE_RESERVE = 0.5;

export async function sendXlm(source, destination, amount) {
  if (!StrKey.isValidEd25519PublicKey(destination)) {
    throw new AppError("Dirección de destino inválida: debe ser una clave pública de Stellar que empiece por «G» y tenga 56 caracteres.");
  }
  if (destination === source) {
    throw new AppError("La dirección de destino es tu propia cuenta.");
  }
  const account = await horizon.loadAccount(source);

  const xlm = Number(account.balances.find((b) => b.asset_type === "native")?.balance ?? 0);
  const minBalance = (2 + account.subentry_count) * BASE_RESERVE;
  const available = xlm - minBalance - Number(BASE_FEE) / 1e7;
  if (Number(amount) > available) {
    throw new AppError(
      `Saldo insuficiente: puedes enviar como máximo ${Math.max(available, 0).toFixed(7).replace(/\.?0+$/, "")} XLM (debes mantener ${minBalance} XLM de reserva mínima).`
    );
  }

  // Si el destino no existe en testnet hay que crearlo (createAccount, mínimo 1 XLM).
  let destExists = true;
  try {
    await horizon.loadAccount(destination);
  } catch (err) {
    if (err instanceof NotFoundError) destExists = false;
    else throw err;
  }

  if (!destExists && Number(amount) < 1) {
    throw new AppError("La cuenta de destino no existe todavía: para crearla debes enviar al menos 1 XLM.");
  }

  const op = destExists
    ? Operation.payment({ destination, asset: Asset.native(), amount })
    : Operation.createAccount({ destination, startingBalance: amount });

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(op)
    .setTimeout(180)
    .build();

  return signAndSubmit(tx, source);
}
