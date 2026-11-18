import { describe, expect, it } from "vitest";
import type { Attestation } from "../bindings/proofolio/src";
import { groupAttestationsByProject } from "./attestations";

function attestation(id: bigint, repo: string): Attestation {
  return {
    id,
    issuer: "GISSUER",
    recipient: "GRECIPIENT",
    repo,
    pr_number: Number(id),
    kind: { tag: "Code", values: undefined },
    issued_at: 1_700_000_000n + id,
  };
}

describe("groupAttestationsByProject", () => {
  it("groups contributions and sorts project names", () => {
    expect(
      groupAttestationsByProject([
        attestation(1n, "stellar/soroban-sdk"),
        attestation(2n, "oppia/proofolio"),
        attestation(3n, "stellar/soroban-sdk"),
      ]),
    ).toEqual([
      { repo: "oppia/proofolio", count: 1 },
      { repo: "stellar/soroban-sdk", count: 2 },
    ]);
  });

  it("returns an empty list for an empty profile", () => {
    expect(groupAttestationsByProject([])).toEqual([]);
  });
});
