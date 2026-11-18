import type { SignTransaction } from "@stellar/stellar-sdk/contract";
import {
  Client,
  networks,
  type Attestation,
  type ContributionKind,
} from "../bindings/proofolio/src";
import { RPC_URL } from "./stellar";
import { signWithWalletsKit } from "./wallet";

export const PROOFOLIO_CONTRACT_ID = networks.testnet.contractId;

export type ContributionKindName = "Code" | "Docs" | "Design" | "Testing" | "Other";

export type ProofolioErrorCode =
  | "simulation-failed"
  | "signature-rejected"
  | "rpc-failed"
  | "contract-rejected";

export class ProofolioError extends Error {
  constructor(
    public readonly code: ProofolioErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "ProofolioError";
  }
}

export interface IssueAttestationInput {
  issuer: string;
  recipient: string;
  repo: string;
  prNumber: number;
  kind: ContributionKindName;
}

function contractKind(kind: ContributionKindName): ContributionKind {
  return { tag: kind, values: undefined };
}

const walletsKitSigner: SignTransaction = async (xdr, options) => {
  const signed = await signWithWalletsKit(xdr, {
    networkPassphrase: options?.networkPassphrase,
    address: options?.address,
  });
  return {
    signedTxXdr: signed.signedTxXdr,
    signerAddress: signed.signerAddress,
  };
};

function createClient(publicKey?: string, write = false) {
  return new Client({
    ...networks.testnet,
    rpcUrl: RPC_URL,
    publicKey,
    signTransaction: write ? walletsKitSigner : undefined,
  });
}

function normalizeContractError(error: unknown): ProofolioError {
  if (error instanceof ProofolioError) return error;
  const message = error instanceof Error ? error.message : "Unknown contract error.";
  const normalized = message.toLowerCase();

  if (normalized.includes("reject") || normalized.includes("declin") || normalized.includes("cancel")) {
    return new ProofolioError("signature-rejected", message);
  }
  if (normalized.includes("simulat")) {
    return new ProofolioError("simulation-failed", message);
  }
  if (
    normalized.includes("selfattestation") ||
    normalized.includes("duplicateattestation") ||
    normalized.includes("profilefull") ||
    normalized.includes("invalid")
  ) {
    return new ProofolioError("contract-rejected", message);
  }
  return new ProofolioError("rpc-failed", message);
}

export async function listAttestations(recipient: string): Promise<Attestation[]> {
  try {
    const transaction = await createClient().list_for({ recipient });
    return transaction.result;
  } catch (error) {
    throw normalizeContractError(error);
  }
}

export async function issueAttestation(input: IssueAttestationInput): Promise<bigint> {
  try {
    const client = createClient(input.issuer, true);
    const transaction = await client.issue(
      {
        issuer: input.issuer,
        recipient: input.recipient,
        repo: input.repo,
        pr_number: input.prNumber,
        kind: contractKind(input.kind),
      },
      { timeoutInSeconds: 180 },
    );

    if (!transaction.simulation) {
      throw new ProofolioError(
        "simulation-failed",
        "The transaction was not simulated before signing.",
      );
    }

    const sent = await transaction.signAndSend();
    if (sent.result.isErr()) {
      throw new ProofolioError("contract-rejected", sent.result.unwrapErr().message);
    }
    return sent.result.unwrap();
  } catch (error) {
    throw normalizeContractError(error);
  }
}

export type { Attestation };
