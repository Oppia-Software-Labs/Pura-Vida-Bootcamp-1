import { Asset, Keypair, Operation, Transaction, TransactionBuilder } from "@stellar/stellar-sdk";
import { decimalUnits, paymentAmount, xlmFromUnits } from "./amount";
import { DESTINATION_ADDRESS, testnetConfig } from "./config";
import { StellarError, horizonFailure } from "./errors";
import { assertPublicAddress, verifiedTestnetServer } from "./server";
import { requireWalletOnTestnet, signWithFreighter } from "./wallet";

type Server = Awaited<ReturnType<typeof verifiedTestnetServer>>;

export type PaymentDraft = {
  source: string;
  destination: string;
  amount: string;
  fee: string;
  xdr: string;
  hash: string;
  expiresAt: number;
};

export type PaymentReceipt = Pick<PaymentDraft, "hash" | "amount">;

async function loadDestination(server: Server, source: string) {
  const destination = DESTINATION_ADDRESS;
  assertPublicAddress(source);
  try {
    assertPublicAddress(destination);
  } catch {
    throw new StellarError("destination", "El proyecto necesita una dirección destino válida. Ejecutá npm run destino y configurala en .env.local.");
  }

  if (source === destination) {
    throw new StellarError("destination", "La cuenta origen coincide con el destino del proyecto. Elegí otra cuenta de Freighter en Testnet.");
  }

  try {
    await server.loadAccount(destination);
    return destination;
  } catch (error) {
    if (horizonFailure(error).status === 404) {
      throw new StellarError("destination", "El destino fijo ya no existe en Testnet. Puede ocurrir después de un reinicio de la red. La persona encargada de la app puede regenerarlo con npm run destino.");
    }
    throw error;
  }
}

export async function checkDestination(source: string) {
  await requireWalletOnTestnet(source);
  return loadDestination(await verifiedTestnetServer(), source);
}

export async function buildPayment(sourceAddress: string, input: string): Promise<PaymentDraft> {
  const amount = paymentAmount(input);
  await requireWalletOnTestnet(sourceAddress);
  const server = await verifiedTestnetServer();

  const [source, destination, baseFee, ledgers] = await Promise.all([
    server.loadAccount(sourceAddress).catch((error: unknown) => {
      if (horizonFailure(error).status === 404) {
        throw new StellarError("balance", "Tu cuenta origen aún no existe. Volvé al nivel 3 y fondeala con Friendbot.");
      }
      throw error;
    }),
    loadDestination(server, sourceAddress),
    server.fetchBaseFee(),
    server.ledgers().order("desc").limit(1).call(),
  ]);

  const native = source.balances.find((asset) => asset.asset_type === "native");
  const baseReserve = ledgers.records[0]?.base_reserve_in_stroops;
  if (!baseReserve || !Number.isSafeInteger(baseFee) || baseFee <= 0) {
    throw new StellarError("network", "No pudimos confirmar la reserva y la comisión de Testnet. Volvé a intentar.");
  }

  const reserveEntries = 2 + source.subentry_count + (source.num_sponsoring ?? 0) - (source.num_sponsored ?? 0);
  const reserve = BigInt(baseReserve) * BigInt(reserveEntries);
  const available = decimalUnits(native?.balance ?? "0") - decimalUnits(native?.selling_liabilities ?? "0") - reserve;
  if (available < decimalUnits(amount) + BigInt(baseFee)) {
    throw new StellarError("balance", "Tu saldo disponible no cubre el monto, la comisión y la reserva mínima. Bajá el monto o revisá tu cuenta en el nivel 3.");
  }

  const transaction = new TransactionBuilder(source, {
    fee: String(baseFee),
    networkPassphrase: testnetConfig().networkPassphrase,
  })
    .addOperation(Operation.payment({ destination, asset: Asset.native(), amount }))
    .setTimeout(300)
    .build();

  return {
    source: sourceAddress,
    destination,
    amount,
    fee: xlmFromUnits(BigInt(transaction.fee)),
    xdr: transaction.toXDR(),
    hash: transaction.hash().toString("hex"),
    expiresAt: Number(transaction.timeBounds?.maxTime) * 1000,
  };
}

function verifySignedPayment(draft: PaymentDraft, signedXdr: string) {
  try {
    const transaction = TransactionBuilder.fromXDR(signedXdr, testnetConfig().networkPassphrase);
    const signer = Keypair.fromPublicKey(draft.source);
    if (transaction instanceof Transaction && transaction.hash().toString("hex") === draft.hash &&
        transaction.signatures.some((signature) => signer.verify(transaction.hash(), signature.signature()))) {
      return transaction;
    }
  } catch {
    // Una solicitud nueva evita reutilizar una firma inválida.
  }
  throw new StellarError("signature", "Freighter devolvió una firma que no corresponde a este pago. Volvé a firmarlo.");
}

export async function signPayment(draft: PaymentDraft) {
  if (Date.now() >= draft.expiresAt) {
    throw new StellarError("expired", "La transacción venció. Construí una nueva para firmarla.");
  }
  const signed = await signWithFreighter(draft.xdr, draft.source);
  verifySignedPayment(draft, signed);
  return signed;
}

async function confirmedReceipt(server: Server, draft: PaymentDraft): Promise<PaymentReceipt | null> {
  const result = await server.transactions().transaction(draft.hash).call().catch((error: unknown) => {
    if (horizonFailure(error).status === 404) return null;
    throw new StellarError("pending", "Testnet aún no confirmó el resultado. Revisá el explorador o reintentá la misma transacción.");
  });
  if (!result) return null;
  if (!result.successful || result.hash !== draft.hash) {
    throw new StellarError("rebuild", "Testnet registró el intento como fallido. Revisá los datos y construí una nueva transacción.");
  }
  return { hash: draft.hash, amount: draft.amount };
}

export async function sendPayment(draft: PaymentDraft, signedXdr: string): Promise<PaymentReceipt> {
  const transaction = verifySignedPayment(draft, signedXdr);
  await requireWalletOnTestnet(draft.source);
  const server = await verifiedTestnetServer();
  if (Date.now() >= draft.expiresAt) {
    const receipt = await confirmedReceipt(server, draft);
    if (receipt) return receipt;
    throw new StellarError("expired", "La transacción venció sin confirmación. Construí una nueva.");
  }

  await requireWalletOnTestnet(draft.source);
  try {
    const submitted = await server.submitTransaction(transaction);
    if (submitted.successful && submitted.hash === draft.hash) {
      return { hash: draft.hash, amount: draft.amount };
    }
  } catch (error) {
    const receipt = await confirmedReceipt(server, draft);
    if (receipt) return receipt;
    const { status, transaction: code, operations } = horizonFailure(error);

    if (operations.includes("op_no_destination")) {
      throw new StellarError("rebuild", "El destino dejó de existir en Testnet. Regenerá el destino de la app y volvé a construir el pago.");
    }
    if (code === "tx_insufficient_balance" || operations.includes("op_underfunded")) {
      throw new StellarError("rebuild", "Tu saldo disponible cambió. Elegí un monto menor o revisá tu saldo.");
    }
    if (status === 400 || code === "tx_bad_seq") {
      throw new StellarError("rebuild", "Testnet rechazó la transacción. Puede haber cambiado la secuencia de tu cuenta. Construí una nueva con los datos actuales.");
    }
  }
  throw new StellarError("pending", "El pago queda pendiente de confirmación. Podés revisar el hash o volver a enviar la misma transacción sin crear otro pago.");
}
