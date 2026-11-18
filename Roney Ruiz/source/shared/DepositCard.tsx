import { deriveStatus } from "@bloc/entity/status";
import type { Deposit, Status } from "@bloc/entity/types";
import CopyButton from "./CopyButton";
import { friendlyError } from "@helpers/friendlyError";
import { formatCountdown, formatXlm, shortAddress } from "@helpers/format";
import { depositLink } from "@helpers/links";
import { Alert, Button, Spinner } from "./primitives";

type DepositCardProps = {
  deposit: Deposit;
  now: number;
  claimed: boolean;
  claiming: boolean;
  error: Error | null;
  onClaim: () => void;
};

const statusView: Record<Status, { label: string; tone: string }> = {
  waiting: { label: "En espera", tone: "border-line-strong bg-raised text-muted" },
  landlord_window: { label: "Ventana del arrendador", tone: "border-warn/30 bg-warn/10 text-warn" },
  tenant_claimable: { label: "Plazo vencido", tone: "border-ok/30 bg-ok/10 text-ok" },
  claimed: { label: "Reclamado", tone: "border-line-strong bg-raised text-faint" },
};

const phaseOf: Record<Status, number> = { waiting: 0, landlord_window: 1, tenant_claimable: 2, claimed: -1 };
const phaseColors = ["bg-faint", "bg-warn", "bg-ok"];
const LATE_CLAIM_WARNING_SECONDS = 30;

function describe(status: Status, isTenant: boolean, countdown: string): string {
  switch (status) {
    case "waiting":
      return isTenant ? `El arrendador podrá reclamar en ${countdown}.` : `Podrás reclamar en ${countdown}.`;
    case "landlord_window":
      return isTenant
        ? `El arrendador tiene ${countdown} para reclamar. Después podrás recuperarlo.`
        : `Tienes ${countdown} para reclamar antes de que pase al inquilino.`;
    case "tenant_claimable":
      return isTenant
        ? "El plazo venció. Ya puedes recuperar tu depósito."
        : "Tu ventana terminó. El depósito ya es del inquilino.";
    case "claimed":
      return "Este depósito ya fue reclamado.";
  }
}

export default function DepositCard({ deposit, now, claimed, claiming, error, onClaim }: DepositCardProps) {
  const { status, canClaimNow, nextChangeAt } = deriveStatus(deposit, now, claimed);
  const isTenant = deposit.myRole === "tenant";
  const counterparty = isTenant ? deposit.landlord : deposit.tenant;
  const remaining = nextChangeAt === undefined ? null : nextChangeAt - now;
  const view = statusView[status];

  return (
    <article
      className="flex flex-col gap-4 rounded-xl border border-line bg-surface/80 p-4"
      aria-label={`Depósito de ${formatXlm(deposit.amountStroops)} XLM`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs text-faint">{isTenant ? "Eres el inquilino" : "Eres el arrendador"}</p>
          <p className="text-2xl font-semibold tracking-tight">
            {formatXlm(deposit.amountStroops)} <span className="text-base font-medium text-muted">XLM</span>
          </p>
          <p className="font-mono text-xs text-muted" title={counterparty}>
            {isTenant ? "Arrendador" : "Inquilino"} {shortAddress(counterparty)}
          </p>
        </div>
        <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${view.tone}`}>{view.label}</span>
      </div>

      <div className="flex h-1.5 gap-1" aria-hidden>
        {phaseColors.map((color, index) => (
          <span key={color} className={`flex-1 rounded-full ${index === phaseOf[status] ? color : "bg-line-strong"}`} />
        ))}
      </div>

      <div className="flex items-center gap-4">
        {remaining !== null && (
          <p className="font-mono text-2xl font-semibold tabular-nums" aria-label="Tiempo restante">
            {formatCountdown(remaining)}
          </p>
        )}
        <p className="text-sm text-muted">{describe(status, isTenant, formatCountdown(remaining ?? 0))}</p>
      </div>

      {canClaimNow && (
        <div className="flex flex-col gap-2">
          <Button onClick={onClaim} disabled={claiming} className="w-full">
            {claiming && <Spinner />}
            {claiming ? "Esperando tu firma en Varial..." : isTenant ? "Recuperar depósito" : "Reclamar depósito"}
          </Button>
          {!isTenant && remaining !== null && remaining <= LATE_CLAIM_WARNING_SECONDS && (
            <p className="text-xs text-warn">
              Queda poco: la red decide con la hora de cierre de su ledger y tu reclamo podría llegar tarde.
            </p>
          )}
        </div>
      )}

      {error && <Alert>{friendlyError(error)}</Alert>}

      {isTenant && status !== "claimed" && (
        <div className="flex items-center justify-between gap-3 border-t border-line pt-3">
          <p className="text-xs text-faint">Link para que el arrendador encuentre este depósito.</p>
          <CopyButton text={depositLink(deposit.id)} label="Copiar link del depósito" />
        </div>
      )}
    </article>
  );
}
