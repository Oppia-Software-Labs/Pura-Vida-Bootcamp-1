import {
  BASE_FEE,
  Horizon,
  Networks,
  StrKey,
  TransactionBuilder,
} from "@stellar/stellar-sdk";
import { signTestnetTransaction } from "./wallet";

export const HORIZON_URL = "https://horizon-testnet.stellar.org";
export const EXPERT_URL = "https://stellar.expert/explorer/testnet";
export const FRIENDBOT_URL = "https://friendbot.stellar.org";
export const NETWORK_PASSPHRASE = Networks.TESTNET;
export const FEE_STROOPS = String(Math.max(Number(BASE_FEE) * 100, 100_000));

export const server = new Horizon.Server(HORIZON_URL);

export type AccountSnapshot = {
  exists: boolean;
  xlm: string;
};

export async function loadSnapshot(address: string): Promise<AccountSnapshot> {
  try {
    const account = await server.loadAccount(address);
    const native = account.balances.find((item) => item.asset_type === "native");
    return {
      exists: true,
      xlm: native && "balance" in native ? native.balance : "0",
    };
  } catch (error) {
    const status =
      error && typeof error === "object" && "response" in error
        ? (error as { response?: { status?: number } }).response?.status
        : undefined;
    if (status === 404) {
      return { exists: false, xlm: "0" };
    }
    throw error;
  }
}

export async function fundWithFriendbot(address: string): Promise<void> {
  const response = await fetch(
    `${FRIENDBOT_URL}?addr=${encodeURIComponent(address)}`,
  );
  if (response.ok) return;
  const body = await response.text();
  if (body.toLowerCase().includes("already funded") || response.status === 400) {
    return;
  }
  throw new Error(
    "Friendbot no pudo crear la cuenta de testnet. Probá de nuevo en un minuto.",
  );
}

export function isPublicKey(value: string): boolean {
  return StrKey.isValidEd25519PublicKey(value.trim());
}

export function shortAddress(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-6)}`;
}

export function formatXlm(value: string | number): string {
  const amount = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(amount)) return "0";
  return amount.toLocaleString("es-CR", { maximumFractionDigits: 7 });
}

export function expertAccountUrl(address: string): string {
  return `${EXPERT_URL}/account/${address}`;
}

export function expertTxUrl(hash: string): string {
  return `${EXPERT_URL}/tx/${hash}`;
}

export function expertBalanceUrl(id: string): string {
  return `${EXPERT_URL}/claimablebalance/${id}`;
}

export async function submitSignedXdr(
  xdr: string,
  address: string,
): Promise<string> {
  const signed = await signTestnetTransaction(xdr, address);
  const transaction = TransactionBuilder.fromXDR(signed, NETWORK_PASSPHRASE);
  const result = await server.submitTransaction(transaction);
  return result.hash;
}

type HorizonErrorBody = {
  extras?: {
    result_codes?: {
      transaction?: string;
      operations?: string[];
    };
    result_codes_op?: string[];
  };
  title?: string;
  detail?: string;
};

function readHorizonBody(error: unknown): HorizonErrorBody | null {
  if (!error || typeof error !== "object") return null;
  if ("response" in error) {
    const response = (error as { response?: { data?: HorizonErrorBody } })
      .response;
    if (response?.data) return response.data;
  }
  if ("data" in error) {
    return (error as { data?: HorizonErrorBody }).data ?? null;
  }
  return null;
}

export function stellarErrorMessage(error: unknown): string {
  const body = readHorizonBody(error);
  const codes = body?.extras?.result_codes?.operations ?? [];
  const joined = codes.join(" ").toLowerCase();

  if (joined.includes("op_underfunded")) {
    return "No hay XLM suficiente en testnet. Pedí fondos con Friendbot e intentá de nuevo.";
  }
  if (joined.includes("op_low_reserve")) {
    return "La cuenta no cubre la reserva extra de los dos claimants. Pedí más XLM de prueba.";
  }
  if (joined.includes("op_does_not_exist") || joined.includes("not_found")) {
    return "Ese aguinaldo ya no está en el ledger: alguien lo reclamó o el id no existe.";
  }
  if (joined.includes("op_not_authorized") || joined.includes("not_authorized")) {
    return "Todavía no se puede reclamar: la fecha no se cumplió, o ya pasó la ventana.";
  }
  if (joined.includes("op_no_trust")) {
    return "El destinatario no tiene trustline para ese activo. Esta app usa solo XLM.";
  }
  if (joined.includes("tx_bad_auth") || joined.includes("tx_bad_seq")) {
    return "La wallet firmó con otra red o la secuencia cambió. Poné Freighter/Varial en Testnet.";
  }
  if (body?.detail) return body.detail;
  if (body?.title) return body.title;
  if (error && typeof error === "object" && "message" in error) {
    const message = String((error as { message: unknown }).message);
    if (message.toLowerCase().includes("network")) {
      return "La wallet no está en Testnet. En Freighter/Varial cambiá la red a Testnet.";
    }
    return message;
  }
  return "Stellar rechazó la transacción. Revisá Testnet y el saldo, y volvé a intentar.";
}
