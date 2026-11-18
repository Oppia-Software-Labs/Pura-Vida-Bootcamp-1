import type { Attestation } from "../bindings/proofolio/src";

export interface ProjectSummary {
  repo: string;
  count: number;
}

export function groupAttestationsByProject(
  attestations: readonly Attestation[],
): ProjectSummary[] {
  const grouped = new Map<string, number>();

  for (const attestation of attestations) {
    grouped.set(attestation.repo, (grouped.get(attestation.repo) ?? 0) + 1);
  }

  return [...grouped.entries()]
    .map(([repo, count]) => ({ repo, count }))
    .sort((left, right) => left.repo.localeCompare(right.repo));
}
