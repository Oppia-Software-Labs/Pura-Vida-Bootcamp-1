import type { DepositPlan } from "@bloc/entity/types";
import { formatEpoch, shortAddress } from "./format";

export default function DepositPreview({ plan, amount }: { plan: DepositPlan; amount: string }) {
  const end = formatEpoch(plan.endOfContract);
  const deadline = formatEpoch(plan.deadline);
  const steps = [
    { dot: "bg-faint", title: `Hasta ${end}`, body: "Nadie puede reclamar." },
    { dot: "bg-warn", title: `${end} → ${deadline}`, body: `Solo ${shortAddress(plan.landlord)} puede reclamar.` },
    { dot: "bg-ok", title: `Desde ${deadline}`, body: "Solo tú puedes recuperar el depósito." },
  ];

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-line bg-raised p-4">
      <h3 className="text-sm font-semibold">Así funcionará tu depósito</h3>
      <ol className="flex flex-col gap-3 border-l border-line-strong pl-5">
        {steps.map((step) => (
          <li key={step.title} className="relative">
            <span
              aria-hidden
              className={`absolute top-1.5 -left-[25px] size-2.5 rounded-full ring-4 ring-raised ${step.dot}`}
            />
            <p className="text-sm font-medium">{step.title}</p>
            <p className="text-sm text-muted">{step.body}</p>
          </li>
        ))}
      </ol>
      <p className="text-sm text-muted">
        Si {shortAddress(plan.landlord)} no reclama entre {end} y {deadline}, podrás recuperar{" "}
        <span className="font-semibold text-fg">{amount} XLM</span> después de {deadline}.
      </p>
      <p className="hint">
        La red decide con la hora de cierre de su ledger, no con tu reloj: deja 15 a 30 segundos de margen.
      </p>
    </div>
  );
}
