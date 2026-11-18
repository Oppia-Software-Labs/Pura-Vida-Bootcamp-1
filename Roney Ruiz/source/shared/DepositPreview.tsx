import type { DepositPlan } from "@bloc/entity/types";
import { formatDuration, formatEpoch, shortAddress } from "./format";

export default function DepositPreview({ plan, amount, now }: { plan: DepositPlan; amount: string; now: number }) {
  const wait = Math.max(plan.endOfContract - now, 1);
  const window = plan.deadline - plan.endOfContract;
  const end = formatEpoch(plan.endOfContract);
  const deadline = formatEpoch(plan.deadline);
  const phases = [
    {
      bar: "bg-line-strong",
      dot: "bg-faint",
      grow: wait,
      title: "Espera",
      range: `Ahora → ${end}`,
      body: `Nadie puede reclamar durante ${formatDuration(wait)}.`,
    },
    {
      bar: "bg-warn",
      dot: "bg-warn",
      grow: window,
      title: "Arrendador",
      range: `${end} → ${deadline}`,
      body: `Solo ${shortAddress(plan.landlord)} puede reclamar durante ${formatDuration(window)}.`,
    },
    {
      bar: "bg-ok",
      dot: "bg-ok",
      grow: (wait + window) * 0.4,
      title: "Tú",
      range: `Desde ${deadline}`,
      body: "Solo tú puedes recuperar el depósito.",
    },
  ];

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-line bg-raised/70 p-4">
      <h3 className="text-sm font-semibold">Así funcionará tu depósito</h3>
      <div className="flex h-2 gap-1" aria-hidden>
        {phases.map((phase) => (
          <span key={phase.title} className={`rounded-full ${phase.bar}`} style={{ flexGrow: phase.grow }} />
        ))}
      </div>
      <ol className="grid gap-4 sm:grid-cols-3">
        {phases.map((phase) => (
          <li key={phase.title} className="flex flex-col gap-0.5">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <span aria-hidden className={`size-2 rounded-full ${phase.dot}`} />
              {phase.title}
            </p>
            <p className="text-xs text-faint">{phase.range}</p>
            <p className="text-sm text-muted">{phase.body}</p>
          </li>
        ))}
      </ol>
      <p className="border-t border-line pt-3 text-sm text-muted">
        Si {shortAddress(plan.landlord)} no reclama entre {end} y {deadline}, podrás recuperar{" "}
        <span className="font-semibold text-fg">{amount} XLM</span> después de {deadline}.
      </p>
      <p className="text-xs text-faint">
        La red decide con la hora de cierre de su ledger, no con tu reloj: deja 15 a 30 segundos de margen.
      </p>
    </div>
  );
}
