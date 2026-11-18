import * as StellarSdk from "@stellar/stellar-sdk";
import { horizon, isValidStellarAddress, STELLAR_CONFIG } from "./stellar";

export interface BuildPaymentParams {
  sourceAddress: string;
  destinationAddress: string;
  amountXlm: string;
  memo?: string;
}

export interface SubmittedTransactionResult {
  hash: string;
  ledger: number;
}

interface HorizonErrorShape {
  message?: string;
  response?: {
    data?: {
      extras?: {
        result_codes?: {
          transaction?: string;
          operations?: string[];
        };
      };
    };
  };
}

export function parseStellarError(error: unknown): string {
  const err = error as HorizonErrorShape | undefined;
  const codes = err?.response?.data?.extras?.result_codes;

  if (codes?.operations?.length) {
    const opCode = codes.operations[0];
    switch (opCode) {
      case "op_underfunded":
        return "Fondos insuficientes en XLM (recuerda mantener la reserva mínima de tu cuenta).";
      case "op_no_destination":
        return "La cuenta destino aún no existe en Stellar Testnet. Fondea primero esa cuenta con Friendbot.";
      case "op_no_trust":
        return "La cuenta destino no tiene una trustline activa para ese asset.";
      case "op_line_full":
        return "La cuenta destino superó el límite de su trustline.";
      default:
        return `La operación fue rechazada por Horizon (${opCode}).`;
    }
  }

  if (codes?.transaction) {
    switch (codes.transaction) {
      case "tx_bad_seq":
        return "Número de secuencia desactualizado. Recarga el balance e intenta de nuevo.";
      case "tx_insufficient_balance":
        return "Balance insuficiente para cubrir la comisión base de la red.";
      case "tx_too_late":
        return "La transacción expiró antes de enviarse. Intenta de nuevo.";
      case "tx_bad_auth":
        return "Firma inválida o red incorrecta. Verifica que tu wallet esté en Stellar Testnet.";
      default:
        return `Transacción rechazada por la red (${codes.transaction}).`;
    }
  }

  if (error instanceof StellarSdk.NotFoundError) {
    return "Tu cuenta aún no está fondeada en Testnet. Usa Friendbot para activarla primero.";
  }

  const rawMessage = err?.message ?? String(error ?? "Error desconocido");
  if (/reject|cancel|denied|declined|user closed/i.test(rawMessage)) {
    return "Firma cancelada en la wallet.";
  }

  return rawMessage;
}

export async function buildXlmPaymentXdr({
  sourceAddress,
  destinationAddress,
  amountXlm,
  memo,
}: BuildPaymentParams): Promise<string> {
  const destination = destinationAddress.trim();
  const normalizedAmount = amountXlm.trim();

  if (!isValidStellarAddress(destination)) {
    throw new Error("La dirección destino no es una llave pública Stellar válida (G…).");
  }

  const numericAmount = Number(normalizedAmount);
  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    throw new Error("El monto debe ser un número mayor que 0.");
  }

  const trimmedMemo = memo?.trim() ?? "";
  if (new TextEncoder().encode(trimmedMemo).length > 28) {
    throw new Error("El memo no puede superar los 28 bytes.");
  }

  const account = await horizon.loadAccount(sourceAddress);

  const builder = new StellarSdk.TransactionBuilder(account, {
    fee: StellarSdk.BASE_FEE,
    networkPassphrase: STELLAR_CONFIG.networkPassphrase,
  })
    .addOperation(
      StellarSdk.Operation.payment({
        destination,
        asset: StellarSdk.Asset.native(),
        amount: numericAmount.toFixed(7).replace(/\.?0+$/, ""),
      })
    )
    .setTimeout(180);

  if (trimmedMemo.length > 0) {
    builder.addMemo(StellarSdk.Memo.text(trimmedMemo));
  }

  return builder.build().toXDR();
}

export async function submitSignedTransaction(
  signedXdr: string
): Promise<SubmittedTransactionResult> {
  const transaction = StellarSdk.TransactionBuilder.fromXDR(
    signedXdr,
    STELLAR_CONFIG.networkPassphrase
  ) as StellarSdk.Transaction;

  const response = await horizon.submitTransaction(transaction);

  return {
    hash: response.hash,
    ledger: response.ledger,
  };
}
