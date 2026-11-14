import {
    Horizon,
    NotFoundError,
    TransactionBuilder,
    Operation,
    Asset,
    Memo,
    Networks,
    BASE_FEE,
  } from "@stellar/stellar-sdk";

// Servidor Horizon de la red de prueba (Testnet)
export const horizon = new Horizon.Server("https://horizon-testnet.stellar.org");

const FRIENDBOT_URL = "https://friendbot.stellar.org";

// Devuelve el saldo de XLM como texto (ej: "10000.0000000"),
// o null si la cuenta todavía no existe en la red (no está fondeada).
export async function getBalance(address: string): Promise<string | null> {
  try {
    const account = await horizon.loadAccount(address);
    // "native" = XLM, la moneda propia de Stellar
    const xlm = account.balances.find((b) => b.asset_type === "native");
    return xlm?.balance ?? "0";
  } catch (error) {
    if (error instanceof NotFoundError) {
      return null; // La cuenta no existe todavía
    }
    throw error; // Cualquier otro error sí lo dejamos pasar
  }
}

// Le pide a Friendbot que le regale XLM de prueba a esta cuenta
export async function fundWithFriendbot(address: string) {
  const respuesta = await fetch(`${FRIENDBOT_URL}?addr=${encodeURIComponent(address)}`);
  if (!respuesta.ok) {
    throw new Error("Friendbot no pudo fondear la cuenta");
  }
}

// Cuenta del creador que recibe las propinas
export const CREATOR_ADDRESS = "GCVUQLZ23Z62PRRBLOTO5SVN3BT2MACOYLPHWNB56W2KYPVQTJMNZG74";

// Arma la transacción de pago (todavía SIN firmar) y la devuelve como texto XDR
export async function buildTipTransaction(from: string, amount: string) {
  // Necesitamos la cuenta actual para saber su "número de secuencia"
  // (un contador que evita que la misma transacción se use dos veces)
  const account = await horizon.loadAccount(from);

  const tx = new TransactionBuilder(account, {
    fee: BASE_FEE, // comisión máxima: 100 stroops = 0.00001 XLM
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(
      Operation.payment({
        destination: CREATOR_ADDRESS,
        asset: Asset.native(), // XLM
        amount, // texto: "1", "5" o "10"
      })
    )
    .addMemo(Memo.text("Pura Vida Tips")) // nota visible en el explorador (máx. 28 caracteres)
    .setTimeout(180) // si no se envía en 3 minutos, vence
    .build();

  return tx.toXDR();
}

// Recibe la transacción YA FIRMADA, la envía a Horizon y devuelve el hash
export async function submitSignedTransaction(signedXdr: string) {
  const tx = TransactionBuilder.fromXDR(signedXdr, Networks.TESTNET);
  const result = await horizon.submitTransaction(tx);
  return result.hash;
}

// Link a la transacción en el explorador de Testnet
export function explorerTxUrl(hash: string) {
  return `https://stellar.expert/explorer/testnet/tx/${hash}`;
}