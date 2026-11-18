import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  Asset,
  BASE_FEE,
  Horizon,
  Keypair,
  Networks,
  Operation,
  TransactionBuilder,
} from "@stellar/stellar-sdk";
import { DATA_DIR, decimalToStroops } from "./store";

const SERVER_DIR = dirname(fileURLToPath(import.meta.url));
const ISSUER_FILE = join(SERVER_DIR, "data", "issuer.json");

export const HORIZON_URL = "https://horizon-testnet.stellar.org";
export const FRIEND_BOT_URL = "https://friendbot.stellar.org";
export const EXPLORER_URL = "https://stellar.expert/explorer/testnet";
export const NETWORK_PASSPHRASE = Networks.TESTNET;

export const horizon = new Horizon.Server(HORIZON_URL);

export type StellarErrorCode =
  | "ACCOUNT_NOT_FOUND"
  | "ACCOUNT_FUNDING_FAILED"
  | "NO_TRUSTLINE"
  | "TX_NOT_FOUND"
  | "TX_FAILED"
  | "TX_INVALID"
  | "ISSUER_UNAVAILABLE"
  | "HORIZON_UNAVAILABLE"
  | "FRIENDBOT_UNAVAILABLE"
  | "TOKEN_ISSUE_FAILED";

export class StellarServiceError extends Error {
  readonly code: StellarErrorCode;
  readonly status: number;

  constructor(code: StellarErrorCode, message: string, status = 502) {
    super(message);
    this.name = "StellarServiceError";
    this.code = code;
    this.status = status;
  }
}

function isNotFound(error: unknown): boolean {
  const candidate = error as {
    response?: { status?: number; data?: { status?: number } };
  };
  return (
    candidate.response?.status === 404 ||
    candidate.response?.data?.status === 404
  );
}

function submittedOperationCodes(error: unknown): string[] {
  const candidate = error as {
    response?: {
      data?: {
        extras?: { result_codes?: { operations?: unknown } };
      };
    };
  };
  const operations = candidate.response?.data?.extras?.result_codes?.operations;
  if (!Array.isArray(operations)) return [];
  return operations.filter((code): code is string => typeof code === "string");
}

function loadIssuerKeypair(): Keypair {
  const fromEnvironment = process.env.STELLAR_ISSUER_SECRET?.trim();
  if (fromEnvironment) {
    try {
      return Keypair.fromSecret(fromEnvironment);
    } catch {
      throw new Error(
        "STELLAR_ISSUER_SECRET no contiene una llave secreta válida.",
      );
    }
  }

  if (existsSync(ISSUER_FILE)) {
    try {
      const parsed = JSON.parse(readFileSync(ISSUER_FILE, "utf8")) as {
        secret?: unknown;
      };
      if (typeof parsed.secret !== "string") {
        throw new Error("missing secret");
      }
      return Keypair.fromSecret(parsed.secret);
    } catch {
      throw new Error(
        "No se pudo leer la cuenta emisora en server/data/issuer.json.",
      );
    }
  }

  const keypair = Keypair.random();
  mkdirSync(DATA_DIR, { recursive: true, mode: 0o700 });
  const temporaryFile = `${ISSUER_FILE}.tmp`;
  writeFileSync(
    temporaryFile,
    `${JSON.stringify(
      {
        publicKey: keypair.publicKey(),
        secret: keypair.secret(),
        createdAt: new Date().toISOString(),
      },
      null,
      2,
    )}\n`,
    { encoding: "utf8", mode: 0o600 },
  );
  renameSync(temporaryFile, ISSUER_FILE);
  return keypair;
}

const issuerKeypair = loadIssuerKeypair();
const issuerAddress = issuerKeypair.publicKey();

export function getIssuerAddress(): string {
  return issuerAddress;
}

async function loadAccountOrNull(address: string) {
  try {
    return await horizon.loadAccount(address);
  } catch (error) {
    if (isNotFound(error)) return null;
    throw new StellarServiceError(
      "HORIZON_UNAVAILABLE",
      "No se pudo consultar Horizon Testnet. Intenta de nuevo.",
    );
  }
}

async function callFriendbot(address: string): Promise<{ alreadyFunded: boolean }> {
  let response: Response;
  try {
    response = await fetch(
      `${FRIEND_BOT_URL}?addr=${encodeURIComponent(address)}`,
    );
  } catch {
    throw new StellarServiceError(
      "FRIENDBOT_UNAVAILABLE",
      "No se pudo contactar a Friendbot. Intenta de nuevo.",
    );
  }

  if (response.ok) {
    await response.text();
    return { alreadyFunded: false };
  }

  const detail = await response.text().catch(() => "");
  if (/already|exist|funded/i.test(detail)) {
    return { alreadyFunded: true };
  }

  try {
    if (await loadAccountOrNull(address)) return { alreadyFunded: true };
  } catch {
    // If Horizon is also unavailable, report the Friendbot failure below.
  }

  throw new StellarServiceError(
    "FRIENDBOT_UNAVAILABLE",
    "Friendbot no pudo fondear la cuenta. Intenta de nuevo en unos segundos.",
  );
}

let issuerReadyPromise: Promise<string> | null = null;

async function prepareIssuerAccount(): Promise<string> {
  const existing = await loadAccountOrNull(issuerAddress);
  if (existing) return issuerAddress;

  const funding = await callFriendbot(issuerAddress);
  if (funding.alreadyFunded) return issuerAddress;

  for (let attempt = 0; attempt < 4; attempt += 1) {
    if (await loadAccountOrNull(issuerAddress)) return issuerAddress;
    if (attempt < 3) {
      await new Promise<void>((resolve) => setTimeout(resolve, 500));
    }
  }

  throw new StellarServiceError(
    "ISSUER_UNAVAILABLE",
    "La cuenta emisora aún no está disponible en Testnet. Intenta de nuevo.",
  );
}

export function getIssuer(): Promise<string> {
  if (!issuerReadyPromise) {
    issuerReadyPromise = prepareIssuerAccount().catch((error: unknown) => {
      issuerReadyPromise = null;
      throw error;
    });
  }
  return issuerReadyPromise;
}

const ensuredAccounts = new Set<string>();

export async function ensureAccountExists(address: string): Promise<void> {
  if (ensuredAccounts.has(address)) return;

  const existing = await loadAccountOrNull(address);
  if (existing) {
    ensuredAccounts.add(address);
    return;
  }

  let friendbotError: unknown;
  try {
    await callFriendbot(address);
  } catch (error) {
    friendbotError = error;
  }

  for (let attempt = 0; attempt < 4; attempt += 1) {
    if (await loadAccountOrNull(address)) {
      ensuredAccounts.add(address);
      return;
    }
    if (attempt < 3) {
      await new Promise<void>((resolve) => setTimeout(resolve, 500));
    }
  }

  const detail =
    friendbotError instanceof StellarServiceError
      ? ` ${friendbotError.message}`
      : "";
  throw new StellarServiceError(
    "ACCOUNT_FUNDING_FAILED",
    `No se pudo fondear la cuenta del oferente en Testnet.${detail} Intenta de nuevo.`,
    502,
  );
}

export async function buildPurchaseXdr(params: {
  reader: string;
  offerer: string;
  issuer: string;
  assetCode: string;
  offererAmount: string;
  platformFee: string;
}): Promise<string> {
  let account;
  try {
    account = await horizon.loadAccount(params.reader);
  } catch (error) {
    if (isNotFound(error)) {
      throw new StellarServiceError(
        "ACCOUNT_NOT_FOUND",
        "La cuenta del lector no existe en Testnet. Fóndala con Friendbot antes de comprar.",
        404,
      );
    }
    throw new StellarServiceError(
      "HORIZON_UNAVAILABLE",
      "No se pudo consultar la cuenta del lector en Horizon Testnet.",
    );
  }

  const bookAsset = new Asset(params.assetCode, params.issuer);

  try {
    const transaction = new TransactionBuilder(account, {
      fee: BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(
        Operation.changeTrust({
          asset: bookAsset,
          limit: "1",
        }),
      )
      .addOperation(
        Operation.payment({
          destination: params.offerer,
          asset: Asset.native(),
          amount: params.offererAmount,
        }),
      )
      .addOperation(
        Operation.payment({
          destination: params.issuer,
          asset: Asset.native(),
          amount: params.platformFee,
        }),
      )
      .setTimeout(300)
      .build();

    return transaction.toXDR();
  } catch {
    throw new StellarServiceError(
      "HORIZON_UNAVAILABLE",
      "No se pudo construir la transacción de compra.",
    );
  }
}

export async function verifyPurchaseTransaction(params: {
  txHash: string;
  reader: string;
  offerer: string;
  issuer: string;
  assetCode: string;
  offererAmount: string;
  platformFee: string;
}): Promise<void> {
  let transaction;
  try {
    transaction = await horizon
      .transactions()
      .transaction(params.txHash)
      .call();
  } catch (error) {
    if (isNotFound(error)) {
      throw new StellarServiceError(
        "TX_NOT_FOUND",
        "No encontramos esa transacción en Testnet.",
        400,
      );
    }
    throw new StellarServiceError(
      "HORIZON_UNAVAILABLE",
      "No se pudo verificar la transacción en Horizon Testnet.",
    );
  }

  if (!transaction.successful) {
    throw new StellarServiceError(
      "TX_FAILED",
      "La transacción no fue exitosa en Testnet.",
      400,
    );
  }

  if (transaction.source_account !== params.reader) {
    throw new StellarServiceError(
      "TX_INVALID",
      "La transacción no fue firmada por la cuenta del lector.",
      400,
    );
  }

  let operations;
  try {
    operations = await horizon
      .operations()
      .forTransaction(params.txHash)
      .limit(200)
      .order("asc")
      .call();
  } catch {
    throw new StellarServiceError(
      "HORIZON_UNAVAILABLE",
      "No se pudieron leer las operaciones de la transacción.",
    );
  }

  let hasTrustline = false;
  let hasOffererPayment = false;
  let hasPlatformPayment = false;
  const expectedOfferer = decimalToStroops(params.offererAmount);
  const expectedPlatform = decimalToStroops(params.platformFee);

  for (const operation of operations.records) {
    if (operation.type === "change_trust") {
      if (
        operation.asset_code === params.assetCode &&
        operation.asset_issuer === params.issuer
      ) {
        hasTrustline = true;
      }
      continue;
    }

    if (operation.type !== "payment" || operation.asset_type !== "native") {
      continue;
    }

    const amount = decimalToStroops(operation.amount);
    if (
      operation.to === params.offerer &&
      amount === expectedOfferer
    ) {
      hasOffererPayment = true;
    }
    if (
      operation.to === params.issuer &&
      amount === expectedPlatform
    ) {
      hasPlatformPayment = true;
    }
  }

  if (!hasTrustline || !hasOffererPayment || !hasPlatformPayment) {
    throw new StellarServiceError(
      "TX_INVALID",
      "La transacción no contiene la trustline y los pagos exactos de este libro.",
      400,
    );
  }
}

async function issueBookTokenInternal(params: {
  reader: string;
  assetCode: string;
}): Promise<{ txHash: string }> {
  await getIssuer();

  const readerAccount = await loadAccountOrNull(params.reader);
  if (!readerAccount) {
    throw new StellarServiceError(
      "NO_TRUSTLINE",
      "La cuenta del lector no existe o no tiene la trustline del libro. Créala antes de reseñar.",
      409,
    );
  }

  const hasTrustline = readerAccount.balances.some((balance) => {
    if (
      balance.asset_type !== "credit_alphanum4" &&
      balance.asset_type !== "credit_alphanum12"
    ) {
      return false;
    }
    return (
      balance.asset_code === params.assetCode &&
      balance.asset_issuer === issuerAddress &&
      balance.is_authorized
    );
  });

  if (!hasTrustline) {
    throw new StellarServiceError(
      "NO_TRUSTLINE",
      "No tienes la trustline de este libro. Vuelve a abrir el libro desde tu biblioteca antes de reseñar.",
      409,
    );
  }

  let issuerAccount;
  try {
    issuerAccount = await horizon.loadAccount(issuerAddress);
  } catch {
    throw new StellarServiceError(
      "ISSUER_UNAVAILABLE",
      "La cuenta emisora no está disponible en Testnet.",
    );
  }

  const transaction = new TransactionBuilder(issuerAccount, {
    fee: BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      Operation.payment({
        destination: params.reader,
        asset: new Asset(params.assetCode, issuerAddress),
        amount: "1",
      }),
    )
    .setTimeout(60)
    .build();

  transaction.sign(issuerKeypair);

  try {
    const submitted = await horizon.submitTransaction(transaction);
    return { txHash: submitted.hash };
  } catch (error) {
    const codes = submittedOperationCodes(error);
    if (
      codes.some((code) =>
        /no_trust|no_destination|src_no_trust/i.test(code),
      )
    ) {
      throw new StellarServiceError(
        "NO_TRUSTLINE",
        "No tienes la trustline de este libro. Vuelve a abrir el libro desde tu biblioteca antes de reseñar.",
        409,
      );
    }
    throw new StellarServiceError(
      "TOKEN_ISSUE_FAILED",
      "No se pudo emitir el token de lectura en Testnet. Intenta de nuevo.",
    );
  }
}

let issuanceQueue: Promise<unknown> = Promise.resolve();

// Serialize issuer submissions so concurrent reviews cannot reuse the same
// account sequence number.
export function issueBookToken(params: {
  reader: string;
  assetCode: string;
}): Promise<{ txHash: string }> {
  const next = issuanceQueue.then(() => issueBookTokenInternal(params));
  issuanceQueue = next.catch(() => undefined);
  return next;
}

export async function fundWithFriendbot(
  address: string,
): Promise<{ alreadyFunded: boolean }> {
  if (await loadAccountOrNull(address)) return { alreadyFunded: true };
  return callFriendbot(address);
}

// Start warming the issuer account without blocking process startup.
void getIssuer().catch(() => {
  console.warn(
    "[folio] La cuenta emisora aún no está lista; se reintentará al usarla.",
  );
});
