import {
  Horizon,
  TransactionBuilder,
  Operation,
  Asset,
  Memo,
  BASE_FEE,
  Keypair,
  StrKey,
} from "@stellar/stellar-sdk";
import { STELLAR_CONFIG } from "./config.js";
import { signStellarTransaction } from "./wallet.js";

const server = new Horizon.Server(STELLAR_CONFIG.HORIZON_URL);

/**
 * Consulta el balance de XLM y estado de la cuenta en Horizon Testnet.
 */
export async function fetchAccountStatus(publicKey) {
  if (!publicKey || !StrKey.isValidEd25519PublicKey(publicKey)) {
    throw new Error("Direccion de Stellar invalida.");
  }
  try {
    const account = await server.loadAccount(publicKey);
    const native = account.balances.find((b) => b.asset_type === "native");
    return {
      funded: true,
      xlmBalance: native ? parseFloat(native.balance).toFixed(2) : "0.00",
      sequence: account.sequence,
    };
  } catch (err) {
    if (err?.response?.status === 404) {
      return {
        funded: false,
        xlmBalance: "0.00",
        sequence: null,
      };
    }
    throw err;
  }
}

/**
 * Fondea una cuenta en Stellar Testnet usando Friendbot (+10,000 XLM de prueba).
 */
export async function fundWithFriendbot(publicKey) {
  const url = `${STELLAR_CONFIG.FRIENDBOT_URL}?addr=${encodeURIComponent(publicKey)}`;
  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Friendbot respondio con error: ${text}`);
  }
  return await res.json();
}

/**
 * Construye, firma y envia un pago en XLM en Stellar Testnet con Memo identificador del Split.
 */
export async function sendSplitPayment({
  senderAddress,
  senderWalletMode,
  destinationAddress,
  amountXlm,
  memoText,
}) {
  if (!StrKey.isValidEd25519PublicKey(destinationAddress)) {
    throw new Error("La direccion de destino no es una llave publica valida de Stellar.");
  }

  const numericAmount = parseFloat(amountXlm);
  if (isNaN(numericAmount) || numericAmount <= 0) {
    throw new Error("El monto en XLM debe ser mayor a 0.");
  }

  const sourceAccount = await server.loadAccount(senderAddress);
  const safeMemo = (memoText || "SplitXLM PuraVida").slice(0, 28);

  const tx = new TransactionBuilder(sourceAccount, {
    fee: BASE_FEE,
    networkPassphrase: STELLAR_CONFIG.NETWORK_PASSPHRASE,
  })
    .addOperation(
      Operation.payment({
        destination: destinationAddress,
        asset: Asset.native(),
        amount: numericAmount.toFixed(2),
      })
    )
    .addMemo(Memo.text(safeMemo))
    .setTimeout(60)
    .build();

  const signatureResult = await signStellarTransaction(
    tx.toXDR(),
    STELLAR_CONFIG.NETWORK_PASSPHRASE,
    senderAddress,
    senderWalletMode
  );

  let signedTransaction;
  if (signatureResult.mode === "local-secret") {
    const kp = Keypair.fromSecret(signatureResult.secret);
    tx.sign(kp);
    signedTransaction = tx;
  } else {
    signedTransaction = TransactionBuilder.fromXDR(
      signatureResult.signedTxXdr,
      STELLAR_CONFIG.NETWORK_PASSPHRASE
    );
  }

  const submitted = await server.submitTransaction(signedTransaction);
  return {
    hash: submitted.hash,
    ledger: submitted.ledger,
    explorerUrl: `${STELLAR_CONFIG.EXPLORER_TX_URL}/${submitted.hash}`,
  };
}

/**
 * Consulta las transacciones recientes recibidas por la cuenta para detectar automaticamente
 * que amigos ya pagaron su parte del SplitXLM usando el Memo on-chain.
 */
export async function fetchIncomingSplitPayments(accountAddress, limit = 25) {
  if (!accountAddress || !StrKey.isValidEd25519PublicKey(accountAddress)) {
    return [];
  }
  try {
    const txPage = await server
      .transactions()
      .forAccount(accountAddress)
      .order("desc")
      .limit(limit)
      .call();

    return txPage.records.map((tx) => ({
      hash: tx.hash,
      createdAt: tx.created_at,
      memo: tx.memo || "",
      sourceAccount: tx.source_account,
      successful: tx.successful,
      explorerUrl: `${STELLAR_CONFIG.EXPLORER_TX_URL}/${tx.hash}`,
    }));
  } catch {
    return [];
  }
}

/**
 * Genera el URI estandar SEP-0007 (web+stellar:pay) y el link magico web de SplitXLM.
 */
export function buildShareablePaymentLinks({
  originUrl,
  hostAddress,
  billTitle,
  friendName,
  shareAmount,
  splitId,
}) {
  const memoTag = `SPLIT:${splitId}:${friendName}`.slice(0, 28);

  const webUrl = new URL(originUrl);
  webUrl.searchParams.set("pay_to", hostAddress);
  webUrl.searchParams.set("amount", Number(shareAmount).toFixed(2));
  webUrl.searchParams.set("friend", friendName);
  webUrl.searchParams.set("bill", billTitle);
  webUrl.searchParams.set("memo", memoTag);

  const sep7Uri = `web+stellar:pay?destination=${encodeURIComponent(
    hostAddress
  )}&amount=${encodeURIComponent(
    Number(shareAmount).toFixed(2)
  )}&memo=${encodeURIComponent(memoTag)}&memo_type=MEMO_TEXT`;

  return {
    memoTag,
    magicLink: webUrl.toString(),
    sep7Uri,
  };
}
