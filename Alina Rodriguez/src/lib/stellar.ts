// Integración con Stellar (Testnet) y las wallets del ecosistema.
// Usa Stellar Wallets Kit (recomendado en la guía "stellar-dev.dapp" de Stellar Raven):
// un solo selector para LOBSTR, Varial (antes Freighter), xBull, Albedo, Hana, Rabet y más.
import { Networks as KitNetworks, StellarWalletsKit } from "@creit.tech/stellar-wallets-kit";
import { defaultModules } from "@creit.tech/stellar-wallets-kit/modules/utils";
import {
  Asset,
  BASE_FEE,
  Horizon,
  Memo,
  Networks,
  Operation,
  StrKey,
  TransactionBuilder,
} from "@stellar/stellar-sdk";
import { useSyncExternalStore } from "react";
import { actions, ME, getState } from "./store";

export const HORIZON_URL = "https://horizon-testnet.stellar.org";
export const NETWORK_PASSPHRASE = Networks.TESTNET;
export const WALLET_SITE = "https://lobstr.co";
const horizon = new Horizon.Server(HORIZON_URL);

export const explorerTx = (hash: string) => `https://stellar.expert/explorer/testnet/tx/${hash}`;
export const explorerAccount = (a: string) => `https://stellar.expert/explorer/testnet/account/${a}`;
export const shortAddr = (a?: string) => (a ? `${a.slice(0, 4)}…${a.slice(-4)}` : "");
export const isValidAddress = (a: string) => StrKey.isValidEd25519PublicKey(a.trim());

// ---------- Estado de la wallet (compartido en toda la app) ----------

export type WalletState = {
  checked: boolean;
  address: string | null;
  walletName: string | null;
  networkPassphrase: string | null;
  balance: string | null; // XLM; null = cuenta sin fondos
  connecting: boolean;
  error: string | null;
};

let wallet: WalletState = {
  checked: false,
  address: null,
  walletName: null,
  networkPassphrase: null,
  balance: null,
  connecting: false,
  error: null,
};
const listeners = new Set<() => void>();
function setWallet(patch: Partial<WalletState>) {
  wallet = { ...wallet, ...patch };
  listeners.forEach((l) => l());
}

export function useWallet(): WalletState {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => {
        listeners.delete(cb);
      };
    },
    () => wallet,
  );
}

export function getWallet() {
  return wallet;
}

const SAVED_KEY = "teja-a-teja:wallet-id";
let kitReady = false;

function initKit() {
  if (kitReady) return;
  StellarWalletsKit.init({
    modules: defaultModules(),
    network: KitNetworks.TESTNET,
    authModal: { showInstallLabel: true },
    theme: {
      background: "#f7faf8",
      "background-secondary": "#eef3f0",
      "foreground-strong": "#10231e",
      foreground: "#10231e",
      "foreground-secondary": "#4a5d57",
      primary: "#10231e",
      "primary-foreground": "#f7faf8",
      transparent: "rgba(0,0,0,0)",
      lighter: "#ffffff",
      light: "#eef3f0",
      "light-gray": "#d5dfdb",
      gray: "#8a9a94",
      danger: "#b3261e",
      border: "rgba(16,35,30,0.12)",
      shadow: "0 20px 60px rgba(16,35,30,0.18)",
      "border-radius": "18px",
      "font-family": "Inter, system-ui, sans-serif",
    },
  });
  kitReady = true;
}

function readSaved(): string | null {
  try {
    return localStorage.getItem(SAVED_KEY);
  } catch {
    return null;
  }
}

async function afterConnect(address: string) {
  let net: string | null = null;
  try {
    net = (await StellarWalletsKit.getNetwork()).networkPassphrase;
  } catch {
    /* algunas wallets no reportan la red */
  }
  let name: string | null = null;
  try {
    name = StellarWalletsKit.selectedModule.productName;
    localStorage.setItem(SAVED_KEY, StellarWalletsKit.selectedModule.productId);
  } catch {
    /* ignore */
  }
  setWallet({ address, walletName: name, networkPassphrase: net, error: null });
  actions.updatePerson(ME, { address });
  await refreshBalance();
}

/** Reconecta en silencio la última wallet usada (solo extensiones que ya dieron permiso). */
export async function initWallet() {
  try {
    initKit();
    const saved = readSaved();
    if (saved && !["albedo", "wallet_connect"].includes(saved)) {
      StellarWalletsKit.setWallet(saved);
      const { address } = await StellarWalletsKit.fetchAddress();
      if (address) await afterConnect(address);
    }
  } catch {
    /* sin sesión previa */
  } finally {
    setWallet({ checked: true });
  }
}

/** Abre el selector de wallets (LOBSTR, Varial, xBull, Albedo…). */
export async function connectWallet(): Promise<string | null> {
  initKit();
  setWallet({ connecting: true, error: null });
  try {
    // Vuelve a revisar qué wallets están instaladas (por si se instaló una después de abrir la página).
    await StellarWalletsKit.refreshSupportedWallets().catch(() => undefined);
    const { address } = await StellarWalletsKit.authModal();
    if (!address) throw new Error("No se otorgó acceso a la wallet");
    await afterConnect(address);
    return address;
  } catch (e) {
    const msg = (e as { message?: string })?.message ?? "";
    if (msg && !/close|cancel/i.test(msg)) setWallet({ error: msg });
    return null;
  } finally {
    setWallet({ connecting: false });
  }
}

export async function disconnectWallet() {
  try {
    localStorage.removeItem(SAVED_KEY);
    await StellarWalletsKit.disconnect();
  } catch {
    /* ignore */
  }
  setWallet({ address: null, balance: null, networkPassphrase: null, walletName: null });
}

export async function refreshBalance() {
  if (!wallet.address) return;
  setWallet({ balance: await getXlmBalance(wallet.address) });
}

export async function getXlmBalance(address: string): Promise<string | null> {
  try {
    const acc = await horizon.loadAccount(address);
    const native = acc.balances.find((b) => b.asset_type === "native");
    return native ? native.balance : "0";
  } catch {
    return null; // la cuenta aún no existe en Testnet
  }
}

async function accountExists(address: string) {
  try {
    await horizon.loadAccount(address);
    return true;
  } catch {
    return false;
  }
}

/** Fondea una cuenta de Testnet con 10 000 XLM de prueba. */
export async function fundWithFriendbot(address: string) {
  const res = await fetch(`https://friendbot.stellar.org/?addr=${encodeURIComponent(address)}`);
  if (!res.ok && !(await accountExists(address))) throw new Error("Friendbot no pudo fondear la cuenta");
  await refreshBalance();
}

function explainError(e: unknown): string {
  const err = e as { response?: { data?: { extras?: { result_codes?: { operations?: string[]; transaction?: string } } } }; message?: string };
  const codes = err.response?.data?.extras?.result_codes;
  const op = codes?.operations?.[0];
  if (op === "op_underfunded") return "No tienes suficientes XLM para este pago.";
  if (op === "op_low_reserve") return "El monto es muy bajo para crear la cuenta destino (mínimo 1 XLM).";
  if (op === "op_no_destination") return "La cuenta destino no existe en Testnet.";
  if (codes?.transaction === "tx_bad_seq") return "Error de secuencia, intenta de nuevo.";
  if (codes) return `Stellar rechazó la transacción (${codes.transaction ?? ""} ${op ?? ""}).`;
  const msg = err.message || String(e);
  if (/reject|declin|denied|cancel/i.test(msg)) return "Cancelaste la firma en la wallet.";
  return msg;
}

/** Envía un pago en XLM firmado con la wallet conectada. Devuelve el hash de la transacción. */
export async function payXlm(opts: { to: string; amount: string; memo: string }): Promise<string> {
  const from = wallet.address;
  if (!from) throw new Error("Conecta tu wallet primero.");
  if (wallet.networkPassphrase && wallet.networkPassphrase !== NETWORK_PASSPHRASE)
    throw new Error("Tu wallet no está en Testnet. Cámbiala a Testnet en tu wallet y vuelve a intentar.");
  if (from === opts.to) throw new Error("No puedes pagarte a ti misma/o.");
  try {
    const source = await horizon.loadAccount(from).catch(() => {
      throw new Error("Tu cuenta no tiene fondos en Testnet. Usa Friendbot en «Mi wallet».");
    });
    const destExists = await accountExists(opts.to);
    const op = destExists
      ? Operation.payment({ destination: opts.to, asset: Asset.native(), amount: opts.amount })
      : Operation.createAccount({ destination: opts.to, startingBalance: opts.amount });
    const tx = new TransactionBuilder(source, { fee: BASE_FEE, networkPassphrase: NETWORK_PASSPHRASE })
      .addOperation(op)
      .addMemo(Memo.text(opts.memo))
      .setTimeout(180)
      .build();
    const signed = await StellarWalletsKit.signTransaction(tx.toXDR(), { networkPassphrase: NETWORK_PASSPHRASE, address: from });
    const res = await horizon.submitTransaction(TransactionBuilder.fromXDR(signed.signedTxXdr, NETWORK_PASSPHRASE));
    await refreshBalance();
    return res.hash;
  } catch (e) {
    throw new Error(explainError(e));
  }
}

export type FoundPayment = { hash: string; amount: string; from: string; memo: string };

/** Busca pagos recibidos por `address` cuyo memo esté en `memos`. */
export async function findPaymentsByMemo(address: string, memos: Set<string>): Promise<Map<string, FoundPayment>> {
  const found = new Map<string, FoundPayment>();
  const res = await fetch(`${HORIZON_URL}/accounts/${address}/payments?order=desc&limit=200&join=transactions`);
  if (!res.ok) return found;
  const json = await res.json();
  for (const r of json?._embedded?.records ?? []) {
    const memo: string | undefined = r.transaction?.memo;
    if (!memo || !memos.has(memo)) continue;
    const to = r.type === "create_account" ? r.account : r.to;
    if (to !== address) continue;
    if (r.type === "payment" && r.asset_type !== "native") continue;
    found.set(memo, { hash: r.transaction_hash, amount: r.amount ?? r.starting_balance, from: r.from ?? r.funder, memo });
  }
  return found;
}

/** Revisa en la blockchain los cobros pendientes y marca como pagados los que ya llegaron. */
export async function checkPendingPayments(): Promise<number> {
  const s = getState();
  const pending = s.settlements.filter((x) => x.status === "pending" && x.method === "stellar" && x.memo);
  const byAddress = new Map<string, typeof pending>();
  for (const x of pending) {
    const addr = s.people.find((p) => p.id === x.toId)?.address;
    if (!addr) continue;
    byAddress.set(addr, [...(byAddress.get(addr) ?? []), x]);
  }
  let updated = 0;
  await Promise.all(
    [...byAddress.entries()].map(async ([addr, list]) => {
      try {
        const found = await findPaymentsByMemo(addr, new Set(list.map((x) => x.memo!)));
        for (const x of list) {
          const f = found.get(x.memo!);
          if (f) {
            actions.updateSettlement(x.id, { status: "paid", txHash: f.hash, xlmAmount: f.amount, paidAt: Date.now() });
            updated++;
          }
        }
      } catch {
        /* sin conexión: se reintenta luego */
      }
    }),
  );
  if (updated) await refreshBalance();
  return updated;
}
