import { useState } from "react";
import { useBalance } from "@hooks/useBalance";
import { useCreateDeposit } from "@hooks/useCreateDeposit";
import { useNow } from "@hooks/useNow";
import { planDeposit } from "@bloc/entity/plan";
import { DEMO_MODE_DEFAULT } from "@config/network";
import { friendlyError, planErrorMessages } from "./friendlyError";

const inputClass = "w-full rounded border border-gray-300 px-3 py-2";

function toEpoch(localDateTime: string): number {
  return localDateTime ? Math.floor(new Date(localDateTime).getTime() / 1000) : NaN;
}

function formatEpoch(epochSec: number): string {
  return new Date(epochSec * 1000).toLocaleString("es", { dateStyle: "short", timeStyle: "short" });
}

function shorten(address: string): string {
  return address.length > 12 ? `${address.slice(0, 6)}...${address.slice(-6)}` : address;
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

  if (depositId) {
    const link = `${location.origin}${location.pathname}?deposit=${depositId}`;
    return (
      <section className="flex flex-col items-start gap-3">
        <h2 className="text-lg font-semibold">Depósito creado</h2>
        <p className="text-sm">Comparte este link con el arrendador para que encuentre el depósito:</p>
        <p className="break-all font-mono text-sm">{link}</p>
        <button type="button" onClick={reset} className="rounded border px-4 py-2">
          Crear otro
        </button>
      </section>
    );
  }

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        setShowErrors(true);
        if (result.ok) void create(result.plan);
      }}
    >
      <h2 className="text-lg font-semibold">Crear depósito</h2>

      <label className="flex flex-col gap-1 text-sm">
        Dirección del arrendador
        <input
          className={`${inputClass} font-mono`}
          value={landlord}
          onChange={(event) => setLandlord(event.target.value)}
          placeholder="G..."
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Monto (XLM)
        <input
          className={inputClass}
          inputMode="decimal"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          placeholder="100"
        />
      </label>

      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={demo} onChange={(event) => setDemo(event.target.checked)} />
        Modo demo (plazos en minutos)
      </label>

      {demo ? (
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1 text-sm">
            Fin del contrato (min desde ahora)
            <input
              className={inputClass}
              inputMode="numeric"
              value={endMinutes}
              onChange={(event) => setEndMinutes(event.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Plazo (min desde ahora)
            <input
              className={inputClass}
              inputMode="numeric"
              value={deadlineMinutes}
              onChange={(event) => setDeadlineMinutes(event.target.value)}
            />
          </label>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1 text-sm">
            Fin del contrato
            <input
              className={inputClass}
              type="datetime-local"
              value={endAt}
              onChange={(event) => setEndAt(event.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Plazo
            <input
              className={inputClass}
              type="datetime-local"
              value={deadlineAt}
              onChange={(event) => setDeadlineAt(event.target.value)}
            />
          </label>
        </div>
      )}

      {result.ok && (
        <div className="rounded bg-gray-100 p-3 text-sm">
          <p>
            Antes de {formatEpoch(result.plan.endOfContract)} nadie puede reclamar. Si{" "}
            {shorten(result.plan.landlord)} no reclama entre {formatEpoch(result.plan.endOfContract)} y{" "}
            {formatEpoch(result.plan.deadline)}, podrás recuperar {amount.trim()} XLM después de{" "}
            {formatEpoch(result.plan.deadline)}.
          </p>
          <p className="mt-2 text-xs text-gray-600">
            La red usa la hora de cierre de su ledger, no tu reloj: deja 15 a 30 segundos de margen.
          </p>
        </div>
      )}

      {showErrors && !result.ok && (
        <ul role="alert" className="list-disc pl-5 text-sm text-red-600">
          {result.errors.map((code) => (
            <li key={code}>{planErrorMessages[code]}</li>
          ))}
        </ul>
      )}

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {friendlyError(error)}
        </p>
      )}

      <button
        type="submit"
        disabled={creating}
        className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
      >
        {creating ? "Esperando firma..." : "Firmar y crear depósito"}
      </button>
    </form>
  );
}
