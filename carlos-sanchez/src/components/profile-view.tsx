import { useEffect, useMemo, useState } from "react";
import { AlertCircle, ExternalLink, GitPullRequest, LoaderCircle } from "lucide-react";
import type { Locale, Translation } from "../lib/i18n";
import { listAttestations, type Attestation } from "../lib/proofolio";
import { truncateAddress } from "../lib/stellar";
import { Badge } from "./ui/badge";
import { groupAttestationsByProject } from "../lib/attestations";

interface ProfileViewProps {
  address: string;
  copy: Translation;
  locale: Locale;
}

type ProfileState =
  | { status: "loading"; attestations: Attestation[] }
  | { status: "ready"; attestations: Attestation[] }
  | { status: "error"; attestations: Attestation[] };

function formatDate(timestamp: bigint, locale: Locale) {
  return new Intl.DateTimeFormat(locale === "es" ? "es-CR" : "en-US", {
    dateStyle: "medium",
  }).format(Number(timestamp) * 1000);
}

function kindLabel(attestation: Attestation, copy: Translation) {
  const key = attestation.kind.tag.toLowerCase() as keyof Translation["kinds"];
  return copy.kinds[key];
}

export function ProfileView({ address, copy, locale }: ProfileViewProps) {
  const [state, setState] = useState<ProfileState>({ status: "loading", attestations: [] });

  useEffect(() => {
    let active = true;
    void listAttestations(address)
      .then((attestations) => {
        if (active) setState({ status: "ready", attestations: [...attestations].reverse() });
      })
      .catch(() => {
        if (active) setState({ status: "error", attestations: [] });
      });
    return () => {
      active = false;
    };
  }, [address]);

  const projects = useMemo(() => {
    return groupAttestationsByProject(state.attestations);
  }, [state.attestations]);

  if (state.status === "loading") {
    return (
      <div className="grid min-h-64 place-items-center lg:col-span-2" role="status">
        <div className="flex items-center gap-3 text-sm font-medium text-muted-foreground">
          <LoaderCircle aria-hidden="true" className="size-5 animate-spin text-primary" />
          {copy.profileLoading}
        </div>
      </div>
    );
  }

  if (state.status === "error") {
    return (
      <div className="grid min-h-64 place-items-center rounded-[14px] border border-warning-border bg-warning-soft px-5 text-center lg:col-span-2" role="alert">
        <div className="max-w-md">
          <AlertCircle aria-hidden="true" className="mx-auto size-6 text-warning-ink" />
          <h3 className="mt-3 font-semibold text-warning-ink">{copy.profileErrorTitle}</h3>
          <p className="mt-2 text-sm leading-6 text-warning-copy">{copy.profileErrorBody}</p>
        </div>
      </div>
    );
  }

  if (state.attestations.length === 0) {
    return (
      <div className="grid min-h-64 place-items-center rounded-[14px] border border-dashed border-border bg-surface/50 px-5 text-center lg:col-span-2">
        <div className="max-w-md">
          <GitPullRequest aria-hidden="true" className="mx-auto size-6 text-primary" />
          <h3 className="mt-3 font-semibold">{copy.profileEmptyTitle}</h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{copy.profileEmptyBody}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <section aria-label={copy.contributionTimeline}>
        <ol className="divide-y divide-border border-y border-border">
          {state.attestations.map((attestation) => (
            <li key={attestation.id.toString()} className="py-5 first:pt-0 last:pb-0">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge>{kindLabel(attestation, copy)}</Badge>
                    <span className="text-xs font-medium text-muted-foreground">
                      {formatDate(attestation.issued_at, locale)}
                    </span>
                  </div>
                  <a
                    href={`https://github.com/${attestation.repo}/pull/${attestation.pr_number}`}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-3 inline-flex max-w-full items-center gap-2 font-semibold text-foreground underline decoration-border underline-offset-4 hover:decoration-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    <span className="truncate">{attestation.repo} #{attestation.pr_number}</span>
                    <ExternalLink aria-hidden="true" className="size-4 shrink-0" />
                  </a>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {copy.signedBy}{" "}
                    <span className="font-mono text-xs text-foreground" title={attestation.issuer}>
                      {truncateAddress(attestation.issuer, 8)}
                    </span>
                  </p>
                </div>
                <span className="shrink-0 font-mono text-xs text-muted-foreground">
                  #{attestation.id.toString()}
                </span>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <aside aria-labelledby="projects-heading">
        <h3 id="projects-heading" className="text-sm font-semibold">
          {copy.projectsHeading}
        </h3>
        <ul className="mt-3 divide-y divide-border border-y border-border">
          {projects.map(({ repo, count }) => (
            <li key={repo} className="flex items-center justify-between gap-3 py-3 text-sm">
              <span className="min-w-0 truncate font-medium">{repo}</span>
              <span className="shrink-0 text-xs text-muted-foreground">
                {count} {count === 1 ? copy.contribution : copy.contributions}
              </span>
            </li>
          ))}
        </ul>
      </aside>
    </>
  );
}
