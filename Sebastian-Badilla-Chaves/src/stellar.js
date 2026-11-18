import {
  Horizon,
  TransactionBuilder,
  Operation,
  Asset,
  Memo,
  StrKey,
  BASE_FEE,
} from "@stellar/stellar-sdk";
import { HORIZON_URL, FRIENDBOT_URL, NETWORK_PASSPHRASE } from "./config.js";

const server = new Horizon.Server(HORIZON_URL);

// Devuelve el saldo de XLM, o null si la cuenta todavía no existe en la red.
export async function getXlmBalance(address) {
  try {
    const account = await server.loadAccount(address);
    const native = account.balances.find((b) => b.asset_type === "native");
    return native ? native.balance : "0";
  } catch (err) {
    if (err?.response?.status === 404) return null;
    throw err;
  }
}

// Friendbot crea y fondea la cuenta en Testnet con 10 000 XLM de prueba.
export async function fundWithFriendbot(address) {
  const res = await fetch(`${FRIENDBOT_URL}?addr=${encodeURIComponent(address)}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || "Friendbot no pudo fondear la cuenta.");
  }
  return res.json();
}

export function isValidAddress(address) {
  return StrKey.isValidEd25519PublicKey(address);
}

// Arma, firma (con la wallet) y envía un pago de XLM.
export async function sendPayment({ from, to, amount, memo, sign }) {
  if (!isValidAddress(to)) throw new Error("La dirección de destino no es válida.");
  const value = Number(amount);
  if (!(value > 0)) throw new Error("El monto debe ser mayor que 0.");

  // Si el destino no existe todavía, hay que crearlo con createAccount (mínimo 1 XLM).
  const destinationExists = (await getXlmBalance(to)) !== null;
  if (!destinationExists && value < 1) {
    throw new Error("La cuenta destino no existe: envía al menos 1 XLM para crearla.");
  }

  const source = await server.loadAccount(from);
  const op = destinationExists
    ? Operation.payment({ destination: to, asset: Asset.native(), amount: value.toFixed(7) })
    : Operation.createAccount({ destination: to, startingBalance: value.toFixed(7) });

  let builder = new TransactionBuilder(source, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(op)
    .setTimeout(180);
  if (memo) builder = builder.addMemo(Memo.text(memo.slice(0, 28)));

  const tx = builder.build();
  const signedXdr = await sign(tx.toXDR());
  const signedTx = TransactionBuilder.fromXDR(signedXdr, NETWORK_PASSPHRASE);

  try {
    return await server.submitTransaction(signedTx);
  } catch (err) {
    const codes = err?.response?.data?.extras?.result_codes;
    throw new Error(codes ? `Stellar rechazó la transacción: ${JSON.stringify(codes)}` : err.message);
  }
}
