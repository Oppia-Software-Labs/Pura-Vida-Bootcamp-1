import {
  Asset,
  Claimant,
  Memo,
  Operation,
  TransactionBuilder,
} from "@stellar/stellar-sdk";
import {
  evaluatePredicate,
  nextChangeAt,
  parsePredicate,
  type HorizonPredicate,
} from "./predicates";
import {
  FEE_STROOPS,
  NETWORK_PASSPHRASE,
  isPublicKey,
  server,
  submitSignedXdr,
} from "./stellar";

export type UnlockPreset = "demo" | "five" | "custom";

export type CreateAguinaldoInput = {
  from: string;
  to: string;
  amountXlm: string;
  motivo: string;
  unlockSec: number;
  windowSec: number;
};

export type CreatedAguinaldo = {
  hash: string;
  balanceId: string;
  unlockSec: number;
  expirySec: number;
};

export type ClaimantView = {
  destination: string;
  predicate: HorizonPredicate | null;
  canClaim: boolean;
  nextAt: number | null;
};

export type AguinaldoRow = {
  id: string;
  amount: string;
  asset: string;
  createdSec: number;
  sponsor: string | null;
  claimants: ClaimantView[];
  mine: ClaimantView | null;
  canAct: boolean;
  nextAt: number | null;
};

type HorizonClaimableBalance = {
  id: string;
  asset: string;
  amount: string;
  sponsor?: string;
  last_modified_time?: string;
  last_modified_ledger: number;
  claimants: Array<{ destination: string; predicate: unknown }>;
};

export function unlockSeconds(preset: UnlockPreset, customSec: number): number {
  switch (preset) {
    case "demo":
      return 60;
    case "five":
      return 300;
    case "custom":
      return Math.max(15, Math.floor(customSec));
    default: {
      const _exhaustive: never = preset;
      return _exhaustive;
    }
  }
}

function memoFromMotivo(motivo: string): Memo {
  const trimmed = motivo.trim();
  if (!trimmed) return Memo.none();
  const bytes = new TextEncoder().encode(trimmed);
  const sliced = bytes.byteLength <= 28 ? bytes : bytes.slice(0, 28);
  return Memo.text(new TextDecoder().decode(sliced));
}

export async function createAguinaldo(
  input: CreateAguinaldoInput,
): Promise<CreatedAguinaldo> {
  const destination = input.to.trim();
  if (!isPublicKey(destination)) {
    throw new Error("La cuenta destino no es una clave pública de Stellar válida.");
  }
  const amount = Number(input.amountXlm);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new Error("El monto tiene que ser un número de XLM mayor a 0.");
  }

  const now = Math.ceil(Date.now() / 1000);
  const unlockSec = now + input.unlockSec;
  const expirySec = unlockSec + input.windowSec;

  const recipientCanClaim = Claimant.predicateAnd(
    Claimant.predicateNot(
      Claimant.predicateBeforeAbsoluteTime(unlockSec.toString()),
    ),
    Claimant.predicateBeforeAbsoluteTime(expirySec.toString()),
  );
  const senderCanReclaim = Claimant.predicateNot(
    Claimant.predicateBeforeAbsoluteTime(expirySec.toString()),
  );

  const account = await server.loadAccount(input.from);
  const transaction = new TransactionBuilder(account, {
    fee: FEE_STROOPS,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(
      Operation.createClaimableBalance({
        asset: Asset.native(),
        amount: input.amountXlm,
        claimants: [
          new Claimant(destination, recipientCanClaim),
          new Claimant(input.from, senderCanReclaim),
        ],
      }),
    )
    .addMemo(memoFromMotivo(input.motivo))
    .setTimeout(180)
    .build();

  const balanceId = transaction.getClaimableBalanceId(0);
  const hash = await submitSignedXdr(transaction.toXDR(), input.from);
  return { hash, balanceId, unlockSec, expirySec };
}

export async function claimAguinaldo(
  address: string,
  balanceId: string,
): Promise<string> {
  const account = await server.loadAccount(address);
  const transaction = new TransactionBuilder(account, {
    fee: FEE_STROOPS,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(Operation.claimClaimableBalance({ balanceId }))
    .setTimeout(180)
    .build();
  return submitSignedXdr(transaction.toXDR(), address);
}

function createdSeconds(record: HorizonClaimableBalance): number {
  const parsed = record.last_modified_time
    ? Date.parse(record.last_modified_time)
    : Number.NaN;
  if (Number.isFinite(parsed)) return Math.floor(parsed / 1000);
  return Math.floor(Date.now() / 1000);
}

function toRow(
  record: HorizonClaimableBalance,
  address: string,
  nowSec: number,
): AguinaldoRow {
  const createdSec = createdSeconds(record);
  const claimants: ClaimantView[] = (record.claimants ?? []).map((item) => {
    const predicate = parsePredicate(item.predicate);
    const canClaim =
      predicate !== null && evaluatePredicate(predicate, nowSec, createdSec);
    return {
      destination: item.destination,
      predicate,
      canClaim,
      nextAt: predicate ? nextChangeAt(predicate, createdSec) : null,
    };
  });
  const mine = claimants.find((item) => item.destination === address) ?? null;
  const upcoming = mine?.nextAt && mine.nextAt > nowSec ? mine.nextAt : null;
  return {
    id: record.id,
    amount: record.amount,
    asset: record.asset,
    createdSec,
    sponsor: record.sponsor ?? null,
    claimants,
    mine,
    canAct: mine?.canClaim === true,
    nextAt: upcoming,
  };
}

export async function listAguinaldos(address: string): Promise<AguinaldoRow[]> {
  const page = await server
    .claimableBalances()
    .claimant(address)
    .order("desc")
    .limit(30)
    .call();
  const nowSec = Math.floor(Date.now() / 1000);
  return page.records.map((record) =>
    toRow(record as HorizonClaimableBalance, address, nowSec),
  );
}

export async function loadAguinaldo(
  balanceId: string,
  address: string,
): Promise<AguinaldoRow> {
  const record = await server
    .claimableBalances()
    .claimableBalance(balanceId)
    .call();
  return toRow(
    record as HorizonClaimableBalance,
    address,
    Math.floor(Date.now() / 1000),
  );
}

export function refreshRow(
  row: AguinaldoRow,
  address: string,
  nowSec: number,
): AguinaldoRow {
  const claimants: ClaimantView[] = row.claimants.map((item) => {
    const canClaim =
      item.predicate !== null &&
      evaluatePredicate(item.predicate, nowSec, row.createdSec);
    return {
      ...item,
      canClaim,
      nextAt: item.predicate
        ? nextChangeAt(item.predicate, row.createdSec)
        : null,
    };
  });
  const mine = claimants.find((item) => item.destination === address) ?? null;
  const upcoming = mine?.nextAt && mine.nextAt > nowSec ? mine.nextAt : null;
  return {
    ...row,
    claimants,
    mine,
    canAct: mine?.canClaim === true,
    nextAt: upcoming,
  };
}

export function roleLabel(row: AguinaldoRow, address: string): string {
  const isRecipient = row.claimants[0]?.destination === address;
  const isSender = row.claimants[1]?.destination === address;
  if (isRecipient && isSender) return "Te lo enviaste a vos (demo)";
  if (isRecipient) return "Te lo enviaron";
  if (isSender) return "Lo enviaste vos";
  return "Sos claimant";
}

export function statusLabel(row: AguinaldoRow, nowSec: number): string {
  if (row.canAct) {
    const isSenderOnly =
      row.claimants[1]?.destination === row.mine?.destination &&
      row.claimants[0]?.destination !== row.mine?.destination;
    return isSenderOnly ? "Podés recuperarlo" : "Ya se puede reclamar";
  }
  if (row.nextAt && row.nextAt > nowSec) {
    return "Todavía cerrado";
  }
  return "Fuera de ventana";
}
