import { useState, type FormEvent } from "react";
import {
  ArrowRight,
  Check,
  ExternalLink,
  GitPullRequest,
  LoaderCircle,
  ShieldCheck,
} from "lucide-react";
import type { AccountSnapshot, WalletConnection } from "../lib/wallet";
import { fetchMergedPullRequest, GitHubError, type MergedPullRequest } from "../lib/github";
import {
  issueAttestation,
  ProofolioError,
  type ContributionKindName,
} from "../lib/proofolio";
import { isValidAccountAddress, truncateAddress } from "../lib/stellar";
import type { Locale, Translation } from "../lib/i18n";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./ui/sheet";

const kinds: ContributionKindName[] = ["Code", "Docs", "Design", "Testing", "Other"];

type Phase = "form" | "validating" | "review" | "signing" | "success";

interface RecognitionSheetProps {
  copy: Translation;
  locale: Locale;
  connection: WalletConnection | null;
  account: AccountSnapshot | null;
  onIssued: (recipient: string) => void;
}

function kindKey(kind: ContributionKindName) {
  return kind.toLowerCase() as keyof Translation["kinds"];
}

function githubErrorMessage(error: GitHubError, copy: Translation) {
  const messages = {
    "invalid-url": copy.githubInvalidUrl,
    "not-found": copy.githubNotFound,
    "not-merged": copy.githubNotMerged,
    "rate-limited": copy.githubRateLimited,
    unavailable: copy.githubUnavailable,
  };
  return messages[error.code];
}

function contractErrorMessage(error: unknown, copy: Translation) {
  if (!(error instanceof ProofolioError)) return copy.contractRpcError;
  if (error.code === "signature-rejected") return copy.signatureRejected;
  if (error.code === "simulation-failed") return copy.simulationFailed;
  if (error.code === "contract-rejected") return copy.contractRejected;
  return copy.contractRpcError;
}

export function RecognitionSheet({
  copy,
  locale,
  connection,
  account,
  onIssued,
}: RecognitionSheetProps) {
  const [open, setOpen] = useState(false);
  const [prUrl, setPrUrl] = useState("");
  const [recipient, setRecipient] = useState("");
  const [kind, setKind] = useState<ContributionKindName>("Code");
  const [phase, setPhase] = useState<Phase>("form");
  const [evidence, setEvidence] = useState<MergedPullRequest | null>(null);
  const [error, setError] = useState("");
  const [attestationId, setAttestationId] = useState<bigint | null>(null);

  function reset() {
    setPrUrl("");
    setRecipient("");
    setKind("Code");
    setPhase("form");
    setEvidence(null);
    setError("");
    setAttestationId(null);
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen);
    if (!nextOpen && phase !== "signing") reset();
  }

  async function reviewEvidence(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const normalizedRecipient = recipient.trim();
    if (!connection || !account?.exists) {
      setError(copy.walletRequired);
      return;
    }
    if (!isValidAccountAddress(normalizedRecipient)) {
      setError(copy.invalidRecipient);
      return;
    }
    if (normalizedRecipient === connection.address) {
      setError(copy.selfRecognition);
      return;
    }

    setPhase("validating");
    try {
      const pullRequest = await fetchMergedPullRequest(prUrl);
      setEvidence(pullRequest);
      setRecipient(normalizedRecipient);
      setPhase("review");
    } catch (caught) {
      setError(caught instanceof GitHubError ? githubErrorMessage(caught, copy) : copy.githubUnavailable);
      setPhase("form");
    }
  }

  async function signRecognition() {
    if (!connection || !evidence) return;
    setError("");
    setPhase("signing");
    try {
      const id = await issueAttestation({
        issuer: connection.address,
        recipient,
        repo: evidence.repo,
        prNumber: evidence.number,
        kind,
      });
      setAttestationId(id);
      setPhase("success");
      onIssued(recipient);
    } catch (caught) {
      setError(contractErrorMessage(caught, copy));
      setPhase("review");
    }
  }

  const localeCode = locale === "es" ? "es-CR" : "en-US";

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        <Button>
          <GitPullRequest aria-hidden="true" className="size-[18px]" />
          {copy.newRecognition}
        </Button>
      </SheetTrigger>
      <SheetContent closeLabel={copy.closeAction}>
        <SheetHeader>
          <SheetTitle>{copy.sheetTitle}</SheetTitle>
          <SheetDescription>{copy.sheetDescription}</SheetDescription>
        </SheetHeader>

        {phase === "success" ? (
          <div className="flex flex-1 flex-col justify-center py-10 text-center">
            <span className="mx-auto grid size-12 place-items-center rounded-full bg-primary-soft text-primary-ink">
              <Check aria-hidden="true" className="size-6" />
            </span>
            <h3 className="mt-5 text-xl font-semibold tracking-tight">{copy.recognitionSuccessTitle}</h3>
            <p className="mx-auto mt-2 max-w-[42ch] text-sm leading-6 text-muted-foreground">
              {copy.recognitionSuccessBody.replace("{id}", attestationId?.toString() ?? "")}
            </p>
            <div className="mt-7 flex flex-col gap-2 sm:flex-row sm:justify-center">
              <Button
                onClick={() => {
                  setOpen(false);
                  reset();
                }}
              >
                {copy.viewRecipientProfile}
              </Button>
              <Button variant="secondary" onClick={reset}>
                {copy.createAnother}
              </Button>
            </div>
          </div>
        ) : (
          <form className="mt-8 flex flex-1 flex-col" onSubmit={(event) => void reviewEvidence(event)}>
            {phase === "review" || phase === "signing" ? (
              <div>
                <div className="rounded-[14px] bg-surface p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge>{copy.mergedPullRequest}</Badge>
                    <span className="text-xs font-medium text-muted-foreground">
                      {evidence
                        ? new Intl.DateTimeFormat(localeCode, { dateStyle: "medium" }).format(
                            new Date(evidence.mergedAt),
                          )
                        : ""}
                    </span>
                  </div>
                  <h3 className="mt-4 text-base font-semibold leading-6">{evidence?.title}</h3>
                  <a
                    href={evidence?.htmlUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-primary-ink underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    {evidence?.repo} #{evidence?.number}
                    <ExternalLink aria-hidden="true" className="size-3.5" />
                  </a>
                  <p className="mt-3 text-sm text-muted-foreground">
                    {copy.authoredBy} <span className="font-medium text-foreground">@{evidence?.author}</span>
                  </p>
                </div>

                <dl className="mt-6 divide-y divide-border border-y border-border text-sm">
                  <div className="flex items-center justify-between gap-4 py-3">
                    <dt className="text-muted-foreground">{copy.recipientLabel}</dt>
                    <dd className="font-mono text-xs" title={recipient}>{truncateAddress(recipient, 8)}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-4 py-3">
                    <dt className="text-muted-foreground">{copy.kindLabel}</dt>
                    <dd className="font-medium">{copy.kinds[kindKey(kind)]}</dd>
                  </div>
                  <div className="flex items-center justify-between gap-4 py-3">
                    <dt className="text-muted-foreground">{copy.signedBy}</dt>
                    <dd className="font-mono text-xs" title={connection?.address}>
                      {connection ? truncateAddress(connection.address, 8) : ""}
                    </dd>
                  </div>
                </dl>

                <p className="mt-5 flex items-start gap-2 text-sm leading-6 text-muted-foreground">
                  <ShieldCheck aria-hidden="true" className="mt-0.5 size-[18px] shrink-0 text-primary" />
                  {copy.simulationNotice}
                </p>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="space-y-2">
                  <label htmlFor="pr-url" className="text-sm font-semibold">
                    {copy.prLabel}
                  </label>
                  <Input
                    id="pr-url"
                    type="url"
                    placeholder={copy.prPlaceholder}
                    value={prUrl}
                    onChange={(event) => setPrUrl(event.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="recipient" className="text-sm font-semibold">
                    {copy.recipientLabel}
                  </label>
                  <Input
                    id="recipient"
                    placeholder={copy.recipientPlaceholder}
                    className="font-mono"
                    value={recipient}
                    onChange={(event) => setRecipient(event.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="kind" className="text-sm font-semibold">
                    {copy.kindLabel}
                  </label>
                  <select
                    id="kind"
                    className="min-h-11 w-full rounded-[10px] border border-border bg-background px-3.5 text-sm outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary-soft"
                    value={kind}
                    onChange={(event) => setKind(event.target.value as ContributionKindName)}
                  >
                    {kinds.map((value) => (
                      <option key={value} value={value}>
                        {copy.kinds[kindKey(value)]}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {error ? (
              <p className="mt-5 rounded-[10px] bg-warning-soft px-4 py-3 text-sm font-medium text-warning-copy" role="alert">
                {error}
              </p>
            ) : null}

            <div className="mt-auto pt-8">
              {phase === "review" || phase === "signing" ? (
                <div className="flex flex-col gap-2 sm:flex-row-reverse">
                  <Button
                    className="flex-1"
                    onClick={() => void signRecognition()}
                    disabled={phase === "signing"}
                  >
                    {phase === "signing" ? (
                      <LoaderCircle aria-hidden="true" className="size-[18px] animate-spin" />
                    ) : null}
                    {phase === "signing" ? copy.signingRecognition : copy.signRecognition}
                  </Button>
                  <Button
                    variant="secondary"
                    className="flex-1"
                    onClick={() => setPhase("form")}
                    disabled={phase === "signing"}
                  >
                    {copy.editEvidence}
                  </Button>
                </div>
              ) : (
                <Button
                  type="submit"
                  className="w-full"
                  disabled={!connection || !account?.exists || phase === "validating"}
                >
                  {phase === "validating" ? (
                    <LoaderCircle aria-hidden="true" className="size-[18px] animate-spin" />
                  ) : null}
                  {phase === "validating" ? copy.validatingEvidence : copy.reviewAction}
                  {phase !== "validating" ? <ArrowRight aria-hidden="true" className="size-[18px]" /> : null}
                </Button>
              )}
            </div>
          </form>
        )}
      </SheetContent>
    </Sheet>
  );
}
