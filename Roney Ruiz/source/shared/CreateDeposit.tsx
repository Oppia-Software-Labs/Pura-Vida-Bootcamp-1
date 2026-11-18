import { useState } from "react";
import { useBalance } from "@hooks/useBalance";
import { useCreateDeposit } from "@hooks/useCreateDeposit";
import { useNow } from "@hooks/useNow";
import { planDeposit, type PlanError } from "@bloc/entity/plan";
import { DEMO_MODE_DEFAULT } from "@config/network";
import CopyButton from "./CopyButton";
import DepositPreview from "./DepositPreview";
import Field from "./Field";
import { friendlyError, planErrorMessages } from "./friendlyError";
import { formatXlm } from "./format";

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

function toEpoch(localDateTime: string): number {
  return localDateTime ? Math.floor(new Date(localDateTime).getTime() / 1000) : NaN;
}

export default function CreateDeposit({ address }: { address: string }) {
  const now = useNow();
  const { balance } = useBalance(address);
  const { creating, error, depositId, create, reset } = useCreateDeposit(address);

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

  if (depositId) {
    const link = `${location.origin}${location.pathname}?deposit=${depositId}`;
    return (
      <section className="card flex flex-col gap-5" aria-label="Depósito creado">
        <div className="flex items-center gap-3">
          <span aria-hidden className="grid size-10 shrink-0 place-items-center rounded-full bg-ok/15 text-lg text-ok">
            ✓
          </span>
          <div>
            <h2 className="text-lg font-semibold">Depósito creado</h2>
            <p className="text-sm text-muted">El dinero ya está bloqueado en la red. Nadie lo custodia.</p>
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <p className="label">Link para el arrendador</p>
          <div className="flex items-center gap-2 rounded-lg border border-line-strong bg-canvas p-2">
            <p className="min-w-0 flex-1 break-all font-mono text-xs text-muted">{link}</p>
            <CopyButton text={link} label="Copiar link" />
          </div>
          <p className="hint">Compártelo para que el arrendador encuentre el depósito.</p>
        </div>
        <button type="button" onClick={reset} className="btn btn-ghost">
          Crear otro depósito
        </button>
      </section>
    );
  }

  const timeError = errorFor("time");

  return (
    <form
      className="card flex flex-col gap-5"
      aria-label="Crear depósito"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        setShowErrors(true);
        if (result.ok) void create(result.plan);
      }}
    >
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold">Nuevo depósito</h2>
        <p className="text-sm text-muted">Bloquea el monto en la red. Tú lo recuperas si el arrendador no actúa a tiempo.</p>
      </div>

      <Field id="landlord" label="Arrendador" hint="Dirección de su cuenta Stellar." error={errorFor("landlord")}>
        <input
          id="landlord"
          className="input font-mono"
          value={landlord}
          onChange={(event) => setLandlord(event.target.value)}
          placeholder="G..."
          autoComplete="off"
          spellCheck={false}
          aria-invalid={Boolean(errorFor("landlord"))}
          aria-describedby="landlord-message"
        />
      </Field>

      <Field
        id="amount"
        label="Monto"
        hint={balance !== null ? `Disponible: ${formatXlm(balance)} XLM` : undefined}
        error={errorFor("amount")}
      >
        <div className="relative">
          <input
            id="amount"
            className="input pr-14"
            inputMode="decimal"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            placeholder="100"
            autoComplete="off"
            aria-invalid={Boolean(errorFor("amount"))}
            aria-describedby="amount-message"
          />
          <span aria-hidden className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-faint">
            XLM
          </span>
        </div>
      </Field>

      <button
        type="button"
        role="switch"
        aria-checked={demo}
        onClick={() => setDemo(!demo)}
        className="flex cursor-pointer items-center justify-between gap-4 rounded-lg border border-line bg-canvas px-3 py-2.5 text-left transition-colors hover:border-line-strong"
      >
        <span>
          <span className="block text-sm font-medium">Modo demo</span>
          <span className="hint">Plazos en minutos para probar rápido.</span>
        </span>
        <span
          aria-hidden
          className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${demo ? "bg-accent" : "bg-line-strong"}`}
        >
          <span
            className={`absolute top-0.5 left-0.5 size-5 rounded-full bg-fg transition-transform ${demo ? "translate-x-5" : ""}`}
          />
        </span>
      </button>

      <div className="flex flex-col gap-1.5">
        <div className="grid gap-4 sm:grid-cols-2">
          {demo ? (
            <>
              <Field id="end" label="Fin del contrato" hint="Minutos desde ahora.">
                <input
                  id="end"
                  className="input"
                  inputMode="numeric"
                  value={endMinutes}
                  onChange={(event) => setEndMinutes(event.target.value)}
                  aria-invalid={Boolean(timeError)}
                  aria-describedby="end-message"
                />
              </Field>
              <Field id="deadline" label="Plazo" hint="Minutos desde ahora.">
                <input
                  id="deadline"
                  className="input"
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
                <input
                  id="end"
                  className="input"
                  type="datetime-local"
                  value={endAt}
                  onChange={(event) => setEndAt(event.target.value)}
                  aria-invalid={Boolean(timeError)}
                />
              </Field>
              <Field id="deadline" label="Plazo">
                <input
                  id="deadline"
                  className="input"
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

      {result.ok && <DepositPreview plan={result.plan} amount={amount.trim()} />}

      {errorFor("other") && (
        <p role="alert" className="alert">
          {errorFor("other")}
        </p>
      )}

      {error && (
        <p role="alert" className="alert">
          {friendlyError(error)}
        </p>
      )}

      <button type="submit" disabled={creating} className="btn btn-primary w-full">
        {creating && <span aria-hidden className="spinner" />}
        {creating ? "Esperando tu firma en Varial..." : "Firmar y crear depósito"}
      </button>
    </form>
  );
}
