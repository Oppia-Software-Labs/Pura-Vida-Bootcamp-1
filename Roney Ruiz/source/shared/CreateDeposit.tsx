import { useState, type ReactNode } from "react";
import { useBalance } from "@hooks/useBalance";
import { useCreateDeposit } from "@hooks/useCreateDeposit";
import { useNow } from "@hooks/useNow";
import { planDeposit, type PlanError } from "@bloc/entity/plan";
import { DEMO_MODE_DEFAULT } from "@config/network";
import CopyButton from "./CopyButton";
import DepositPreview from "./DepositPreview";
import Field from "./Field";
import { friendlyError, planErrorMessages } from "./friendlyError";
import { formatEpoch, formatXlm, shortAddress } from "./format";
import { cardClass } from "./classes";
import { Alert, Button, Chip, Input, Spinner } from "./primitives";

type FieldName = "landlord" | "amount" | "time" | "other";

const fieldOf: Record<PlanError, FieldName> = {
  invalid_tenant: "other",
  invalid_landlord: "landlord",
  same_account: "landlord",
  invalid_amount: "amount",
  insufficient_balance: "amount",
  end_not_in_future: "time",
  deadline_not_after_end: "time",
  invalid_repair_cap: "other",
};

const amountPresets = ["100", "500", "1000"];
const demoPresets = [
  { end: "2", deadline: "5" },
  { end: "5", deadline: "10" },
  { end: "10", deadline: "30" },
];

const segmentClass =
  "cursor-pointer rounded-md px-3 py-2 text-sm font-medium text-muted transition-colors hover:text-fg aria-pressed:bg-raised aria-pressed:text-fg aria-pressed:shadow-[inset_0_0_0_1px_var(--color-line-strong)]";

function toEpoch(localDateTime: string): number {
  return localDateTime ? Math.floor(new Date(localDateTime).getTime() / 1000) : NaN;
}

function Section({ step, title, children }: { step: number; title: string; children: ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-4">
      <legend className="mb-1 flex items-center gap-2.5 text-sm font-semibold">
        <span aria-hidden className="grid size-6 place-items-center rounded-full bg-accent/15 text-xs text-accent-strong">
          {step}
        </span>
        {title}
      </legend>
      {children}
    </fieldset>
  );
}

type CreateDepositProps = { address: string; refreshKey: number; onCreated: () => void };

export default function CreateDeposit({ address, refreshKey, onCreated }: CreateDepositProps) {
  const now = useNow();
  const { balance } = useBalance(address, refreshKey);
  const { creating, error, depositId, createdPlan, create, reset } = useCreateDeposit(address, onCreated);

  const [landlord, setLandlord] = useState("");
  const [amount, setAmount] = useState("");
  const [demo, setDemo] = useState(DEMO_MODE_DEFAULT);
  const [endMinutes, setEndMinutes] = useState("2");
  const [deadlineMinutes, setDeadlineMinutes] = useState("5");
  const [endAt, setEndAt] = useState("");
  const [deadlineAt, setDeadlineAt] = useState("");
  const [showErrors, setShowErrors] = useState(false);

  const result = planDeposit({
    tenant: address,
    landlord: landlord.trim(),
    amount: amount.trim(),
    endOfContract: demo ? now + Number(endMinutes) * 60 : toEpoch(endAt),
    deadline: demo ? now + Number(deadlineMinutes) * 60 : toEpoch(deadlineAt),
    nowSec: now,
    balanceStroops: balance,
  });

  function errorFor(field: FieldName): string | undefined {
    if (!showErrors || result.ok) return undefined;
    const messages = result.errors.filter((code) => fieldOf[code] === field).map((code) => planErrorMessages[code]);
    return messages.length ? messages.join(" ") : undefined;
  }

  if (depositId && createdPlan) {
    const link = `${location.origin}${location.pathname}?deposit=${depositId}`;
    const recap = [
      ["Monto", `${formatXlm(createdPlan.totalStroops)} XLM`],
      ["Arrendador", shortAddress(createdPlan.landlord)],
      ["Reclama el arrendador desde", formatEpoch(createdPlan.endOfContract)],
      ["Recuperas desde", formatEpoch(createdPlan.deadline)],
    ];
    return (
      <section className={`${cardClass()} flex flex-col gap-6`} aria-label="Depósito creado">
        <div className="flex items-center gap-4">
          <span
            aria-hidden
            className="grid size-12 shrink-0 place-items-center rounded-full bg-ok/15 text-2xl text-ok ring-8 ring-ok/5"
          >
            ✓
          </span>
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Depósito creado</h2>
            <p className="text-sm text-muted">El dinero ya está bloqueado en la red. Nadie lo custodia.</p>
          </div>
        </div>
        <dl className="grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-2">
          {recap.map(([term, value]) => (
            <div key={term} className="bg-surface px-4 py-3">
              <dt className="text-xs text-faint">{term}</dt>
              <dd className="text-sm font-medium">{value}</dd>
            </div>
          ))}
        </dl>
        <div className="flex flex-col gap-1.5">
          <p className="text-sm font-medium">Link para el arrendador</p>
          <div className="flex items-center gap-2 rounded-lg border border-line-strong bg-canvas/70 p-2">
            <p className="min-w-0 flex-1 font-mono text-xs break-all text-muted">{link}</p>
            <CopyButton text={link} label="Copiar link" />
          </div>
          <p className="text-xs text-faint">Compártelo para que el arrendador encuentre el depósito.</p>
        </div>
        <Button variant="ghost" onClick={reset}>
          Crear otro depósito
        </Button>
      </section>
    );
  }

  const timeError = errorFor("time");

  return (
    <form
      className={`${cardClass()} flex flex-col gap-7`}
      aria-label="Crear depósito"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        setShowErrors(true);
        if (result.ok) void create(result.plan);
      }}
    >
      <div className="flex flex-col gap-1">
        <h2 className="text-xl font-semibold tracking-tight">Nuevo depósito</h2>
        <p className="text-sm text-muted">Bloquea el monto en la red. Tú lo recuperas si el arrendador no actúa a tiempo.</p>
      </div>

      <Section step={1} title="¿Quién es el arrendador?">
        <Field id="landlord" label="Dirección" hint="Su cuenta Stellar, empieza con G." error={errorFor("landlord")}>
          <Input
            id="landlord"
            compact
            className="font-mono"
            value={landlord}
            onChange={(event) => setLandlord(event.target.value)}
            placeholder="G..."
            autoComplete="off"
            spellCheck={false}
            aria-invalid={Boolean(errorFor("landlord"))}
            aria-describedby="landlord-message"
          />
        </Field>
      </Section>

      <Section step={2} title="¿Cuánto vas a bloquear?">
        <Field
          id="amount"
          label="Monto"
          hint={balance !== null ? `Disponible: ${formatXlm(balance)} XLM` : undefined}
          error={errorFor("amount")}
        >
          <div className="relative">
            <Input
              id="amount"
              className="pr-14"
              inputMode="decimal"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              placeholder="0"
              autoComplete="off"
              aria-invalid={Boolean(errorFor("amount"))}
              aria-describedby="amount-message"
            />
            <span aria-hidden className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-faint">
              XLM
            </span>
          </div>
        </Field>
        <div className="flex flex-wrap gap-2">
          {amountPresets.map((preset) => (
            <Chip key={preset} pressed={amount.trim() === preset} onClick={() => setAmount(preset)}>
              {preset} XLM
            </Chip>
          ))}
        </div>
      </Section>

      <Section step={3} title="¿Cuándo puede reclamar cada uno?">
        <div
          className="grid grid-cols-2 gap-1 rounded-lg border border-line bg-canvas/70 p-1"
          role="group"
          aria-label="Tipo de plazos"
        >
          <button type="button" className={segmentClass} aria-pressed={demo} onClick={() => setDemo(true)}>
            Modo demo
          </button>
          <button type="button" className={segmentClass} aria-pressed={!demo} onClick={() => setDemo(false)}>
            Fechas exactas
          </button>
        </div>

        {demo && (
          <div className="flex flex-wrap gap-2">
            {demoPresets.map((preset) => (
              <Chip
                key={preset.end}
                pressed={endMinutes === preset.end && deadlineMinutes === preset.deadline}
                onClick={() => {
                  setEndMinutes(preset.end);
                  setDeadlineMinutes(preset.deadline);
                }}
              >
                {preset.end} y {preset.deadline} min
              </Chip>
            ))}
          </div>
        )}

        <div className="flex flex-col gap-1.5">
          <div className="grid gap-4 sm:grid-cols-2">
            {demo ? (
              <>
                <Field id="end" label="Fin del contrato" hint="Minutos desde ahora.">
                  <Input
                    id="end"
                    inputMode="numeric"
                    value={endMinutes}
                    onChange={(event) => setEndMinutes(event.target.value)}
                    aria-invalid={Boolean(timeError)}
                    aria-describedby="end-message"
                  />
                </Field>
                <Field id="deadline" label="Plazo" hint="Minutos desde ahora.">
                  <Input
                    id="deadline"
                    inputMode="numeric"
                    value={deadlineMinutes}
                    onChange={(event) => setDeadlineMinutes(event.target.value)}
                    aria-invalid={Boolean(timeError)}
                    aria-describedby="deadline-message"
                  />
                </Field>
              </>
            ) : (
              <>
                <Field id="end" label="Fin del contrato">
                  <Input
                    id="end"
                    type="datetime-local"
                    value={endAt}
                    onChange={(event) => setEndAt(event.target.value)}
                    aria-invalid={Boolean(timeError)}
                  />
                </Field>
                <Field id="deadline" label="Plazo">
                  <Input
                    id="deadline"
                    type="datetime-local"
                    value={deadlineAt}
                    onChange={(event) => setDeadlineAt(event.target.value)}
                    aria-invalid={Boolean(timeError)}
                  />
                </Field>
              </>
            )}
          </div>
          {timeError && (
            <p role="alert" className="text-xs text-danger">
              {timeError}
            </p>
          )}
        </div>
      </Section>

      {result.ok && <DepositPreview plan={result.plan} amount={amount.trim()} now={now} />}

      {errorFor("other") && <Alert>{errorFor("other")}</Alert>}
      {error && <Alert>{friendlyError(error)}</Alert>}

      <div className="flex flex-col gap-2">
        <Button type="submit" size="lg" className="w-full" disabled={creating}>
          {creating && <Spinner />}
          {creating ? "Esperando tu firma en Varial..." : "Firmar y crear depósito"}
        </Button>
        <p className="text-center text-xs text-faint">Se abrirá Varial para que confirmes la transacción.</p>
      </div>
    </form>
  );
}
