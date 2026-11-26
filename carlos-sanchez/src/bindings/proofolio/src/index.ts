import { Buffer } from "buffer";
import { Address } from "@stellar/stellar-sdk";
import {
  AssembledTransaction,
  Client as ContractClient,
  ClientOptions as ContractClientOptions,
  MethodOptions,
  Result,
  Spec as ContractSpec,
} from "@stellar/stellar-sdk/contract";
import type {
  u32,
  i32,
  u64,
  i64,
  u128,
  i128,
  u256,
  i256,
  Option,
  Timepoint,
  Duration,
} from "@stellar/stellar-sdk/contract";
export * from "@stellar/stellar-sdk";
export * as contract from "@stellar/stellar-sdk/contract";
export * as rpc from "@stellar/stellar-sdk/rpc";

if (typeof window !== "undefined") {
  //@ts-ignore Buffer exists
  window.Buffer = window.Buffer || Buffer;
}


export const networks = {
  testnet: {
    networkPassphrase: "Test SDF Network ; September 2015",
    contractId: "CACV4DTLHGBSZFLIM7WW33SRW3WE4G7MMB55KNSR7KZDMEEOY5R4O5N4",
  }
} as const


export interface Attestation {
  id: u64;
  issued_at: u64;
  issuer: string;
  kind: ContributionKind;
  pr_number: u32;
  recipient: string;
  repo: string;
}

export const ContractError = {
  1: {message:"InvalidPullRequest"},
  2: {message:"SelfAttestation"},
  3: {message:"DuplicateAttestation"},
  4: {message:"ProfileFull"},
  5: {message:"AttestationNotFound"},
  6: {message:"InvalidRepository"},
  7: {message:"CounterOverflow"}
}

export type ContributionKind = {tag: "Code", values: void} | {tag: "Docs", values: void} | {tag: "Design", values: void} | {tag: "Testing", values: void} | {tag: "Other", values: void};


export interface Client {
  /**
   * Construct and simulate a get transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get: ({id}: {id: u64}, options?: MethodOptions) => Promise<AssembledTransaction<Result<Attestation>>>

  /**
   * Construct and simulate a issue transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  issue: ({issuer, recipient, repo, pr_number, kind}: {issuer: string, recipient: string, repo: string, pr_number: u32, kind: ContributionKind}, options?: MethodOptions) => Promise<AssembledTransaction<Result<u64>>>

  /**
   * Construct and simulate a list_for transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  list_for: ({recipient}: {recipient: string}, options?: MethodOptions) => Promise<AssembledTransaction<Array<Attestation>>>

}
export class Client extends ContractClient {
  static async deploy<T = Client>(
    /** Options for initializing a Client as well as for calling a method, with extras specific to deploying. */
    options: MethodOptions &
      Omit<ContractClientOptions, "contractId"> & {
        /** The hash of the Wasm blob, which must already be installed on-chain. */
        wasmHash: Buffer | string;
        /** Salt used to generate the contract's ID. Passed through to {@link Operation.createCustomContract}. Default: random. */
        salt?: Buffer | Uint8Array;
        /** The format used to decode `wasmHash`, if it's provided as a string. */
        format?: "hex" | "base64";
      }
  ): Promise<AssembledTransaction<T>> {
    return ContractClient.deploy(null, options)
  }
  constructor(public readonly options: ContractClientOptions) {
    super(
      new ContractSpec([ "AAAAAQAAAAAAAAAAAAAAC0F0dGVzdGF0aW9uAAAAAAcAAAAAAAAAAmlkAAAAAAAGAAAAAAAAAAlpc3N1ZWRfYXQAAAAAAAAGAAAAAAAAAAZpc3N1ZXIAAAAAABMAAAAAAAAABGtpbmQAAAfQAAAAEENvbnRyaWJ1dGlvbktpbmQAAAAAAAAACXByX251bWJlcgAAAAAAAAQAAAAAAAAACXJlY2lwaWVudAAAAAAAABMAAAAAAAAABHJlcG8AAAAQ",
        "AAAABAAAAAAAAAAAAAAADUNvbnRyYWN0RXJyb3IAAAAAAAAHAAAAAAAAABJJbnZhbGlkUHVsbFJlcXVlc3QAAAAAAAEAAAAAAAAAD1NlbGZBdHRlc3RhdGlvbgAAAAACAAAAAAAAABREdXBsaWNhdGVBdHRlc3RhdGlvbgAAAAMAAAAAAAAAC1Byb2ZpbGVGdWxsAAAAAAQAAAAAAAAAE0F0dGVzdGF0aW9uTm90Rm91bmQAAAAABQAAAAAAAAARSW52YWxpZFJlcG9zaXRvcnkAAAAAAAAGAAAAAAAAAA9Db3VudGVyT3ZlcmZsb3cAAAAABw==",
        "AAAAAAAAAAAAAAADZ2V0AAAAAAEAAAAAAAAAAmlkAAAAAAAGAAAAAQAAA+kAAAfQAAAAC0F0dGVzdGF0aW9uAAAAB9AAAAANQ29udHJhY3RFcnJvcgAAAA==",
        "AAAAAAAAAAAAAAAFaXNzdWUAAAAAAAAFAAAAAAAAAAZpc3N1ZXIAAAAAABMAAAAAAAAACXJlY2lwaWVudAAAAAAAABMAAAAAAAAABHJlcG8AAAAQAAAAAAAAAAlwcl9udW1iZXIAAAAAAAAEAAAAAAAAAARraW5kAAAH0AAAABBDb250cmlidXRpb25LaW5kAAAAAQAAA+kAAAAGAAAH0AAAAA1Db250cmFjdEVycm9yAAAA",
        "AAAAAgAAAAAAAAAAAAAAEENvbnRyaWJ1dGlvbktpbmQAAAAFAAAAAAAAAAAAAAAEQ29kZQAAAAAAAAAAAAAABERvY3MAAAAAAAAAAAAAAAZEZXNpZ24AAAAAAAAAAAAAAAAAB1Rlc3RpbmcAAAAAAAAAAAAAAAAFT3RoZXIAAAA=",
        "AAAABQAAAAAAAAAAAAAAEUF0dGVzdGF0aW9uSXNzdWVkAAAAAAAAAgAAAAlwcm9vZm9saW8AAAAAAAAGaXNzdWVkAAAAAAAGAAAAAAAAAAZpc3N1ZXIAAAAAABMAAAABAAAAAAAAAAlyZWNpcGllbnQAAAAAAAATAAAAAQAAAAAAAAACaWQAAAAAAAYAAAAAAAAAAAAAAARyZXBvAAAAEAAAAAAAAAAAAAAACXByX251bWJlcgAAAAAAAAQAAAAAAAAAAAAAAARraW5kAAAH0AAAABBDb250cmlidXRpb25LaW5kAAAAAAAAAAI=",
        "AAAAAAAAAAAAAAAIbGlzdF9mb3IAAAABAAAAAAAAAAlyZWNpcGllbnQAAAAAAAATAAAAAQAAA+oAAAfQAAAAC0F0dGVzdGF0aW9uAA==" ]),
      options
    )
  }
  public readonly fromJSON = {
    get: this.txFromJSON<Result<Attestation>>,
        issue: this.txFromJSON<Result<u64>>,
        list_for: this.txFromJSON<Array<Attestation>>
  }
}