import {
  Account,
  Asset,
  FeeBumpTransaction,
  Memo,
  NotFoundError,
  Operation,
  TransactionBuilder,
  TransactionFailedError,
} from "@stellar/stellar-sdk";
import type { Transaction } from "@stellar/stellar-sdk";

import { getHorizonServer } from "@/lib/stellar/client";
import {
  StellarConfigurationError,
  assertTestnetConfiguration,
} from "@/lib/stellar/config";
import {
  BASE_FEE_STROOPS,
  TESTNET,
  TRANSACTION_TIMEOUT_SECONDS,
  explorerTransactionUrl,
} from "@/lib/stellar/constants";
import { classifyHorizonError } from "@/lib/stellar/errors";
import type { ServiceResult } from "@/lib/stellar/errors";
import { xlmToStroops } from "@/lib/stellar/reserves";

import {
  WalletAdapterError,
  mapSdkError,
  signPaymentTransaction,
} from "@/features/wallet/services/varial-wallet";

import type { PaymentReceipt } from "../types";
import { normalizeAmount, validatePayment } from "./validation";

/**
 * The money path. Everything that can go wrong is returned as a value: a payment
 * failure must render an explanation next to the form, never take the page down.
 */

export interface SendPaymentInput {
  sourceAddress: string;
  destination: string;
  /** Raw user input. Validated and normalized here, never trusted. */
  amount: string;
  memo?: string;
  networkPassphrase: string;
  spendableXlm: string;
}

interface VerifiedPayment {
  sourceAddress: string;
  destination: string;
  amount: string;
}

const WRONG_NETWORK_MESSAGE =
  "Your wallet is not on Stellar Testnet. Switch networks before sending.";

const DECLINED_MESSAGE = "You declined the signature request in your wallet.";

const MISMATCH_MESSAGE =
  "The signed transaction did not match what was requested. Nothing was submitted.";

const NO_DESTINATION_MESSAGE =
  "The destination account does not exist on Testnet. It has to be funded before it can receive a payment.";

function failure<T>(message: string): ServiceResult<T> {
  // `StellarServiceError` only carries three reasons, so the actionable text lives
  // in the message and the reason stays generic.
  return { ok: false, error: { reason: "unknown", message } };
}

function describeOperationCode(code: string): string | null {
  switch (code) {
    case "op_no_destination":
      return NO_DESTINATION_MESSAGE;
    case "op_underfunded":
      return "Insufficient balance for that amount plus the reserve and fee.";
    case "op_low_reserve":
      return "That payment would drop the source account below its minimum reserve.";
    case "op_malformed":
    case "op_src_no_trust":
      return "The network rejected one of the operations as invalid. Nothing was sent.";
    default:
      return null;
  }
}

function describeTransactionCode(code: string): string | null {
  switch (code) {
    case "tx_bad_seq":
      return "The account sequence changed while signing. Try again.";
    case "tx_insufficient_fee":
      return "The network's fee for this payment is higher than the amount offered. Try again.";
    case "tx_too_late":
      return "The transaction expired before it reached the network. Try again.";
    default:
      return null;
  }
}

function describeTransactionFailure(error: TransactionFailedError): string {
  const { transaction, operations } = error.getResultCodes();
  const operationCode = operations.length > 0 ? operations[0] : null;

  if (operationCode !== null) {
    const described = describeOperationCode(operationCode);
    if (described !== null) return described;
  }

  const describedTransaction = describeTransactionCode(transaction);
  if (describedTransaction !== null) return describedTransaction;

  // Unknown codes are shown verbatim: they are the only way the user (or whoever
  // they ask) can look the failure up.
  const rawOperations = operations.length === 0 ? "none" : operations.join(", ");
  return `The Stellar network rejected the payment (transaction: ${transaction}; operations: ${rawOperations}).`;
}

async function requestSignature(
  xdr: string,
  sourceAddress: string,
): Promise<ServiceResult<string>> {
  try {
    const signedXdr = await signPaymentTransaction(
      xdr,
      TESTNET.passphrase,
      sourceAddress,
    );

    return { ok: true, data: signedXdr };
  } catch (error) {
    if (error instanceof WalletAdapterError) {
      return failure(error.code === "rejected" ? DECLINED_MESSAGE : error.message);
    }

    return failure(mapSdkError(error).message);
  }
}

/**
 * Re-parses what the wallet returned and proves it is the payment that was asked
 * for. A wallet (or an extension bug) could hand back any envelope and Horizon
 * would submit it, so nothing is sent until every field matches.
 *
 * `null` means "do not submit".
 */
function parseVerifiedTransaction(
  signedXdr: string,
  expected: VerifiedPayment,
): Transaction | null {
  let parsed: Transaction | FeeBumpTransaction;

  try {
    // `fromXdr` is the v17 name; the `fromXDR` alias of it is deprecated.
    parsed = TransactionBuilder.fromXdr(signedXdr, TESTNET.passphrase);
  } catch {
    return null;
  }

  if (parsed instanceof FeeBumpTransaction) return null;
  if (parsed.source !== expected.sourceAddress) return null;

  const operations = parsed.operations;
  if (operations.length !== 1) return null;

  const operation = operations[0];
  if (operation.type !== "payment") return null;
  if (operation.destination !== expected.destination) return null;
  if (!operation.asset.isNative()) return null;
  if (xlmToStroops(operation.amount) !== xlmToStroops(expected.amount)) return null;

  return parsed;
}

export async function sendPayment(
  input: SendPaymentInput,
): Promise<ServiceResult<PaymentReceipt>> {
  try {
    assertTestnetConfiguration();

    if (input.networkPassphrase !== TESTNET.passphrase) {
      return failure(WRONG_NETWORK_MESSAGE);
    }

    const destination = input.destination.trim();
    const memo = (input.memo ?? "").trim();

    const fieldError = validatePayment({
      destination,
      amount: input.amount,
      memo,
      spendableXlm: input.spendableXlm,
    });

    if (fieldError !== null) {
      return failure(fieldError.message);
    }

    const normalizedAmount = normalizeAmount(input.amount);

    // A fresh sequence number is loaded instead of trusting a cached snapshot: a
    // stale one only fails after the user has already signed.
    const server = getHorizonServer();
    const source = await server.loadAccount(input.sourceAddress);

    // A payment to a missing account fails on-chain and still burns the fee, so it
    // is refused here, before the user is asked to sign anything.
    try {
      await server.loadAccount(destination);
    } catch (error) {
      if (error instanceof NotFoundError) return failure(NO_DESTINATION_MESSAGE);
      throw error;
    }

    const account = new Account(source.account_id, source.sequence);

    const builder = new TransactionBuilder(account, {
      fee: String(BASE_FEE_STROOPS),
      networkPassphrase: TESTNET.passphrase,
    })
      .addOperation(
        Operation.payment({
          destination,
          asset: Asset.native(),
          amount: normalizedAmount,
        }),
      )
      .setTimeout(TRANSACTION_TIMEOUT_SECONDS);

    if (memo !== "") {
      builder.addMemo(Memo.text(memo));
    }

    const xdr = builder.build().toXDR();
    const signature = await requestSignature(xdr, input.sourceAddress);

    if (!signature.ok) {
      return { ok: false, error: signature.error };
    }

    const signedTransaction = parseVerifiedTransaction(signature.data, {
      sourceAddress: input.sourceAddress,
      destination,
      amount: normalizedAmount,
    });

    if (signedTransaction === null) {
      return failure(MISMATCH_MESSAGE);
    }

    const response = await server.submitTransaction(signedTransaction);

    return {
      ok: true,
      data: {
        hash: response.hash,
        explorerUrl: explorerTransactionUrl(response.hash),
        amount: normalizedAmount,
        destination,
        memo: memo === "" ? null : memo,
      },
    };
  } catch (error) {
    if (error instanceof StellarConfigurationError) {
      return failure(error.message);
    }

    // TransactionFailedError extends BadResponseError, which extends NetworkError:
    // testing for the specific class first is the only way to see the result codes.
    if (error instanceof TransactionFailedError) {
      return failure(describeTransactionFailure(error));
    }

    return { ok: false, error: classifyHorizonError(error) };
  }
}
