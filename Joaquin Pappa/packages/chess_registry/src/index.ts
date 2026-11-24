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
    contractId: "CBX75GYJ365XIGF5IMKIQOM6CNGWYMZWSMHNMYCSU4DRLXJP3AG7QIZU",
  }
} as const


export interface Game {
  black: string;
  registrar: string;
  result: u32;
  timestamp: u64;
  white: string;
}

export const Errors = {
  1: {message:"AlreadyRegistered"},
  2: {message:"InvalidResult"},
  3: {message:"UnknownAttester"}
}

export type DataKey = {tag: "Game", values: readonly [Buffer]} | {tag: "ByRegistrar", values: readonly [string]} | {tag: "Admin", values: void} | {tag: "Attester", values: readonly [Buffer]} | {tag: "Attestation", values: readonly [Buffer]};

export interface Client {
  /**
   * Construct and simulate a admin transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  admin: (options?: MethodOptions) => Promise<AssembledTransaction<string>>

  /**
   * Construct and simulate a games_by transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  games_by: ({registrar}: {registrar: string}, options?: MethodOptions) => Promise<AssembledTransaction<Array<Buffer>>>

  /**
   * Construct and simulate a get_game transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  get_game: ({pgn_hash}: {pgn_hash: Buffer}, options?: MethodOptions) => Promise<AssembledTransaction<Option<Game>>>

  /**
   * Construct and simulate a set_admin transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  set_admin: ({new_admin}: {new_admin: string}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a is_attester transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  is_attester: ({attester}: {attester: Buffer}, options?: MethodOptions) => Promise<AssembledTransaction<boolean>>

  /**
   * Construct and simulate a add_attester transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  add_attester: ({attester}: {attester: Buffer}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a register_game transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Registro simple: solo firma el registrar. No prueba que la partida sea real.
   */
  register_game: ({registrar, pgn_hash, white, black, result}: {registrar: string, pgn_hash: Buffer, white: string, black: string, result: u32}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

  /**
   * Construct and simulate a get_attestation transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Clave del atestador que firmó la partida, si fue registrada con oráculo.
   * Revocar un atestador no borra este dato: el cliente debe chequear `is_attester`.
   */
  get_attestation: ({pgn_hash}: {pgn_hash: Buffer}, options?: MethodOptions) => Promise<AssembledTransaction<Option<Buffer>>>

  /**
   * Construct and simulate a remove_attester transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   */
  remove_attester: ({attester}: {attester: Buffer}, options?: MethodOptions) => Promise<AssembledTransaction<null>>

  /**
   * Construct and simulate a register_attested_game transaction. Returns an `AssembledTransaction` object which will have a `result` field containing the result of the simulation. If this transaction changes contract state, you will need to call `signAndSend()` on the returned object.
   * Registro con oráculo: además de la firma del registrar, exige una firma
   * ed25519 de un atestador habilitado sobre
   * `DOMAIN || contrato || registrar || pgn_hash || result`.
   * Una firma inválida aborta la transacción (panic del host).
   */
  register_attested_game: ({registrar, pgn_hash, white, black, result, attester, signature}: {registrar: string, pgn_hash: Buffer, white: string, black: string, result: u32, attester: Buffer, signature: Buffer}, options?: MethodOptions) => Promise<AssembledTransaction<Result<void>>>

}
export class Client extends ContractClient {
  static async deploy<T = Client>(
        /** Constructor/Initialization Args for the contract's `__constructor` method */
        {admin}: {admin: string},
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
    return ContractClient.deploy({admin}, options)
  }
  constructor(public readonly options: ContractClientOptions) {
    super(
      new ContractSpec([ "AAAAAQAAAAAAAAAAAAAABEdhbWUAAAAFAAAAAAAAAAVibGFjawAAAAAAABAAAAAAAAAACXJlZ2lzdHJhcgAAAAAAABMAAAAAAAAABnJlc3VsdAAAAAAABAAAAAAAAAAJdGltZXN0YW1wAAAAAAAABgAAAAAAAAAFd2hpdGUAAAAAAAAQ",
        "AAAABAAAAAAAAAAAAAAABUVycm9yAAAAAAAAAwAAAAAAAAARQWxyZWFkeVJlZ2lzdGVyZWQAAAAAAAABAAAAAAAAAA1JbnZhbGlkUmVzdWx0AAAAAAAAAgAAAAAAAAAPVW5rbm93bkF0dGVzdGVyAAAAAAM=",
        "AAAAAgAAAAAAAAAAAAAAB0RhdGFLZXkAAAAABQAAAAEAAAAAAAAABEdhbWUAAAABAAAD7gAAACAAAAABAAAAAAAAAAtCeVJlZ2lzdHJhcgAAAAABAAAAEwAAAAAAAAAAAAAABUFkbWluAAAAAAAAAQAAAD1DbGF2ZSBww7pibGljYSBlZDI1NTE5IGRlIHVuIGF0ZXN0YWRvciAob3LDoWN1bG8pIGhhYmlsaXRhZG8uAAAAAAAACEF0dGVzdGVyAAAAAQAAA+4AAAAgAAAAAQAAACJRdcOpIGF0ZXN0YWRvciBmaXJtw7MgdW5hIHBhcnRpZGEuAAAAAAALQXR0ZXN0YXRpb24AAAAAAQAAA+4AAAAg",
        "AAAAAAAAAAAAAAAFYWRtaW4AAAAAAAAAAAAAAQAAABM=",
        "AAAAAAAAAAAAAAAIZ2FtZXNfYnkAAAABAAAAAAAAAAlyZWdpc3RyYXIAAAAAAAATAAAAAQAAA+oAAAPuAAAAIA==",
        "AAAAAAAAAAAAAAAIZ2V0X2dhbWUAAAABAAAAAAAAAAhwZ25faGFzaAAAA+4AAAAgAAAAAQAAA+gAAAfQAAAABEdhbWU=",
        "AAAAAAAAAAAAAAAJc2V0X2FkbWluAAAAAAAAAQAAAAAAAAAJbmV3X2FkbWluAAAAAAAAEwAAAAA=",
        "AAAAAAAAAAAAAAALaXNfYXR0ZXN0ZXIAAAAAAQAAAAAAAAAIYXR0ZXN0ZXIAAAPuAAAAIAAAAAEAAAAB",
        "AAAAAAAAAAAAAAAMYWRkX2F0dGVzdGVyAAAAAQAAAAAAAAAIYXR0ZXN0ZXIAAAPuAAAAIAAAAAA=",
        "AAAAAAAAAAAAAAANX19jb25zdHJ1Y3RvcgAAAAAAAAEAAAAAAAAABWFkbWluAAAAAAAAEwAAAAA=",
        "AAAAAAAAAExSZWdpc3RybyBzaW1wbGU6IHNvbG8gZmlybWEgZWwgcmVnaXN0cmFyLiBObyBwcnVlYmEgcXVlIGxhIHBhcnRpZGEgc2VhIHJlYWwuAAAADXJlZ2lzdGVyX2dhbWUAAAAAAAAFAAAAAAAAAAlyZWdpc3RyYXIAAAAAAAATAAAAAAAAAAhwZ25faGFzaAAAA+4AAAAgAAAAAAAAAAV3aGl0ZQAAAAAAABAAAAAAAAAABWJsYWNrAAAAAAAAEAAAAAAAAAAGcmVzdWx0AAAAAAAEAAAAAQAAA+kAAAACAAAAAw==",
        "AAAAAAAAAJtDbGF2ZSBkZWwgYXRlc3RhZG9yIHF1ZSBmaXJtw7MgbGEgcGFydGlkYSwgc2kgZnVlIHJlZ2lzdHJhZGEgY29uIG9yw6FjdWxvLgpSZXZvY2FyIHVuIGF0ZXN0YWRvciBubyBib3JyYSBlc3RlIGRhdG86IGVsIGNsaWVudGUgZGViZSBjaGVxdWVhciBgaXNfYXR0ZXN0ZXJgLgAAAAAPZ2V0X2F0dGVzdGF0aW9uAAAAAAEAAAAAAAAACHBnbl9oYXNoAAAD7gAAACAAAAABAAAD6AAAA+4AAAAg",
        "AAAAAAAAAAAAAAAPcmVtb3ZlX2F0dGVzdGVyAAAAAAEAAAAAAAAACGF0dGVzdGVyAAAD7gAAACAAAAAA",
        "AAAAAAAAAOhSZWdpc3RybyBjb24gb3LDoWN1bG86IGFkZW3DoXMgZGUgbGEgZmlybWEgZGVsIHJlZ2lzdHJhciwgZXhpZ2UgdW5hIGZpcm1hCmVkMjU1MTkgZGUgdW4gYXRlc3RhZG9yIGhhYmlsaXRhZG8gc29icmUKYERPTUFJTiB8fCBjb250cmF0byB8fCByZWdpc3RyYXIgfHwgcGduX2hhc2ggfHwgcmVzdWx0YC4KVW5hIGZpcm1hIGludsOhbGlkYSBhYm9ydGEgbGEgdHJhbnNhY2Npw7NuIChwYW5pYyBkZWwgaG9zdCkuAAAAFnJlZ2lzdGVyX2F0dGVzdGVkX2dhbWUAAAAAAAcAAAAAAAAACXJlZ2lzdHJhcgAAAAAAABMAAAAAAAAACHBnbl9oYXNoAAAD7gAAACAAAAAAAAAABXdoaXRlAAAAAAAAEAAAAAAAAAAFYmxhY2sAAAAAAAAQAAAAAAAAAAZyZXN1bHQAAAAAAAQAAAAAAAAACGF0dGVzdGVyAAAD7gAAACAAAAAAAAAACXNpZ25hdHVyZQAAAAAAA+4AAABAAAAAAQAAA+kAAAACAAAAAw==" ]),
      options
    )
  }
  public readonly fromJSON = {
    admin: this.txFromJSON<string>,
        games_by: this.txFromJSON<Array<Buffer>>,
        get_game: this.txFromJSON<Option<Game>>,
        set_admin: this.txFromJSON<null>,
        is_attester: this.txFromJSON<boolean>,
        add_attester: this.txFromJSON<null>,
        register_game: this.txFromJSON<Result<void>>,
        get_attestation: this.txFromJSON<Option<Buffer>>,
        remove_attester: this.txFromJSON<null>,
        register_attested_game: this.txFromJSON<Result<void>>
  }
}