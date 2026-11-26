import {
  Asset,
  BASE_FEE,
  Horizon,
  Keypair,
  Memo,
  Networks,
  NotFoundError,
  Operation,
  StrKey,
  TransactionBuilder,
} from "@stellar/stellar-sdk";

// Toda la app trabaja en Testnet
export const HORIZON_URL = "https://horizon-testnet.stellar.org";
export const NETWORK_PASSPHRASE = Networks.TESTNET;
export const server = new Horizon.Server(HORIZON_URL);

export const txExplorerUrl = (hash: string) =>
  `https://stellar.expert/explorer/testnet/tx/${hash}`;

export const ledgerExplorerUrl = (sequence: number) =>
  `https://stellar.expert/explorer/testnet/ledger/${sequence}`;

/**
 * Dirección pública nueva y aleatoria, para enviarle un pago de prueba.
 * Su clave secreta se descarta: nadie podrá gastar lo que reciba.
 */
export const randomTestAddress = () => Keypair.random().publicKey();

export type LedgerInfo = {
  sequence: number;
  closedAt: string;
  txCount: number;
};

/** El último ledger cerrado por la red. */
export async function getLatestLedger(): Promise<LedgerInfo> {
  const page = await server.ledgers().order("desc").limit(1).call();
  const l = page.records[0];
  return {
    sequence: l.sequence,
    closedAt: l.closed_at,
    txCount: l.successful_transaction_count,
  };
}

/**
 * Devuelve el saldo de XLM de una cuenta.
 * `null` significa que la cuenta todavía no existe en la red (sin fondos).
 */
export async function getXlmBalance(address: string): Promise<string | null> {
  try {
    const account = await server.loadAccount(address);
    const native = account.balances.find((b) => b.asset_type === "native");
    return native?.balance ?? "0";
  } catch (e) {
    if (e instanceof NotFoundError) return null;
    throw e;
  }
}

/**
 * Pide a Friendbot que cree y fondee la cuenta con 10 000 XLM de prueba.
 * Friendbot solo funciona con cuentas que todavía no existen.
 */
export async function fundWithFriendbot(address: string): Promise<void> {
  const res = await fetch(
    `https://friendbot.stellar.org?addr=${encodeURIComponent(address)}`,
  );
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.detail ?? `Friendbot respondió ${res.status}`);
  }
}

export const formatXlm = (amount: string) =>
  Number(amount).toLocaleString("es-CR", { maximumFractionDigits: 7 });

/** Revisa los datos del formulario de envío. Devuelve un mensaje de error o `null`. */
export function validatePayment(
  from: string,
  to: string,
  amount: string,
  memo: string,
): string | null {
  if (!StrKey.isValidEd25519PublicKey(to)) {
    return "La dirección de destino no es válida (debe empezar con G).";
  }
  if (to === from) return "No puedes enviarte XLM a ti mismo.";
  if (!/^\d+(\.\d{1,7})?$/.test(amount) || Number(amount) <= 0) {
    return "El monto debe ser un número mayor que 0, con hasta 7 decimales.";
  }
  if (new TextEncoder().encode(memo).length > 28) {
    return "El memo puede tener como máximo 28 caracteres.";
  }
  return null;
}

/**
 * Construye (sin firmar) una transacción que envía XLM de `from` a `to`.
 * Si la cuenta destino aún no existe, la crea con ese monto (mínimo 1 XLM).
 * Devuelve la transacción en formato XDR para firmarla con Varial.
 */
export async function buildPaymentXdr(
  from: string,
  to: string,
  amount: string,
  memo: string,
): Promise<string> {
  const source = await server.loadAccount(from);
  const destinationExists = (await getXlmBalance(to)) !== null;

  const operation = destinationExists
    ? Operation.payment({ destination: to, asset: Asset.native(), amount })
    : Operation.createAccount({ destination: to, startingBalance: amount });

  const builder = new TransactionBuilder(source, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(operation)
    .setTimeout(180);
  if (memo) builder.addMemo(Memo.text(memo));

  return builder.build().toXDR();
}

/** Envía a la red una transacción ya firmada. Devuelve su hash y el ledger que la confirmó. */
export async function submitSignedXdr(signedXdr: string): Promise<{ hash: string; ledger: number }> {
  const tx = TransactionBuilder.fromXDR(signedXdr, NETWORK_PASSPHRASE);
  const result = await server.submitTransaction(tx);
  return { hash: result.hash, ledger: result.ledger };
}

const RESULT_MESSAGES: Record<string, string> = {
  op_underfunded: "Saldo insuficiente.",
  op_low_reserve:
    "El monto no alcanza la reserva mínima: para crear una cuenta nueva hay que enviar al menos 1 XLM.",
  tx_insufficient_balance: "Saldo insuficiente para el monto más la comisión.",
  tx_bad_seq: "La transacción quedó desactualizada. Inténtalo otra vez.",
  tx_too_late: "La transacción expiró antes de enviarse. Inténtalo otra vez.",
};

/** Traduce un error de Horizon a un mensaje legible. */
export function describeTxError(e: unknown): string {
  const codes = (
    e as {
      response?: {
        data?: { extras?: { result_codes?: { transaction?: string; operations?: string[] } } };
      };
    }
  )?.response?.data?.extras?.result_codes;
  if (codes) {
    const all = [...(codes.operations ?? []), codes.transaction ?? ""];
    const known = all.find((c) => RESULT_MESSAGES[c]);
    if (known) return RESULT_MESSAGES[known];
    return `La red rechazó la transacción (${all.filter(Boolean).join(", ")}).`;
  }
  return (e as Error)?.message ?? "Error desconocido.";
}
