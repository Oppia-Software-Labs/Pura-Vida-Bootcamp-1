import { Check, Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { currency as cur, formatMoney, fromMinor, toMinor } from "../lib/currencies";
import { computeSplit } from "../lib/ledger";
import { convert, getRates, refreshRates, type Rates } from "../lib/rates";
import { navigate } from "../lib/router";
import { actions, ME, personName, useAppState, type SplitMethod } from "../lib/store";
import { Avatar, CurrencySelect, PeoplePicker } from "../components/ui";
import { EXPENSE_ICONS, IconPicker } from "../components/icons";

const METHODS: { id: SplitMethod; label: string; hint: string }[] = [
  { id: "equal", label: "Iguales", hint: "Se divide en partes iguales entre las personas marcadas." },
  { id: "exact", label: "Montos", hint: "Escribe cuánto le toca a cada persona." },
  { id: "percent", label: "Porcentaje", hint: "Asigna un % a cada persona (debe sumar 100%)." },
  { id: "shares", label: "Shares", hint: "Reparte por partes: ej. 2 partes para Andrés, 1 para ti." },
];

export function ExpenseForm({ groupId }: { groupId: string | null }) {
  const s = useAppState();
  const group = groupId ? s.groups.find((g) => g.id === groupId) : undefined;
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("receipt");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [currency, setCurrency] = useState(group?.currency ?? "CRC");
  const [totalStr, setTotalStr] = useState("");
  const [participants, setParticipants] = useState<string[]>(group ? group.memberIds : [ME]);
  const [multiPayer, setMultiPayer] = useState(false);
  const [payer, setPayer] = useState<string>(ME);
  const [payerAmounts, setPayerAmounts] = useState<Record<string, string>>({});
  const [method, setMethod] = useState<SplitMethod>("equal");
  const [equalOn, setEqualOn] = useState<Record<string, boolean>>({});
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [rates, setRates] = useState<Rates>(getRates());

  useEffect(() => {
    refreshRates().then(setRates);
  }, []);

  const total = parseFloat(totalStr) || 0;
  const ccy = cur(currency);
  const step = ccy.decimals === 0 ? "1" : "0.01";

  // Valores numéricos según el método
  const numericInputs = useMemo(() => {
    const out: Record<string, number> = {};
    for (const id of participants) {
      if (method === "equal") out[id] = equalOn[id] === false ? 0 : 1;
      else out[id] = parseFloat(inputs[id] ?? "") || 0;
    }
    return out;
  }, [participants, method, equalOn, inputs]);

  const splitIds = method === "equal" ? participants.filter((id) => numericInputs[id] > 0) : participants;
  const split = computeSplit(method, total, currency, splitIds, numericInputs);

  // Pagadores
  const payers = multiPayer
    ? participants.map((id) => ({ personId: id, amount: parseFloat(payerAmounts[id] ?? "") || 0 })).filter((p) => p.amount > 0)
    : [{ personId: payer, amount: total }];
  const payerRemaining = fromMinor(toMinor(total, currency) - payers.reduce((a, p) => a + toMinor(p.amount, currency), 0), currency);
  const payersOk = payerRemaining === 0 && payers.length > 0;

  const baseCurrency = group?.currency ?? currency;
  const rateToBase = convert(1, currency, baseCurrency, rates);
  const valid = description.trim() && total > 0 && participants.length >= 2 && payersOk && split.ok && Number.isFinite(rateToBase);

  function save() {
    if (!valid) return;
    const e = actions.addExpense({
      groupId,
      description: description.trim(),
      icon,
      currency,
      total,
      date,
      participantIds: participants,
      payers,
      method,
      inputs: numericInputs,
      owed: Object.entries(split.owed).map(([personId, amount]) => ({ personId, amount })).filter((o) => o.amount > 0),
      baseCurrency,
      rateToBase,
    });
    navigate(`/gasto/${e.id}`);
  }

  const remainingBox = (rem: number, unit: "money" | "percent", label = "Falta por asignar") => {
    const ok = rem === 0;
    const over = rem < 0;
    const val = unit === "percent" ? `${Math.abs(rem).toLocaleString("es-CR")}%` : formatMoney(Math.abs(rem), currency);
    return (
      <div className={`remaining ${ok ? "ok" : over ? "bad" : "warn"}`}>
        <span>{ok ? "Todo asignado" : over ? "Te pasaste por" : label}</span>
        {!ok && <span>{val}</span>}
      </div>
    );
  };

  return (
    <div className="stack narrow">
      <div className="page-head">
        <div>
          <p className="muted small">{group ? group.name : "Cuenta suelta"}</p>
          <h1>Nuevo gasto</h1>
        </div>
        <button className="btn soft sm" onClick={() => history.back()}>Cancelar</button>
      </div>

      {/* 1. Monto total primero */}
      <div className="tile solid stack">
        <p className="eyebrow">1 · Monto total de la cuenta</p>
        <div className="grid2">
          <label className="field">Moneda<CurrencySelect value={currency} onChange={setCurrency} /></label>
          <label className="field">
            Total
            <input className="input big" type="number" inputMode="decimal" min="0" step={step} placeholder="0" value={totalStr} onChange={(e) => setTotalStr(e.target.value)} autoFocus />
          </label>
        </div>
        <div className="grid2">
          <label className="field">Descripción<input className="input" placeholder="¿Qué se pagó?" value={description} onChange={(e) => setDescription(e.target.value)} /></label>
          <label className="field">Fecha<input className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} /></label>
        </div>
        <div className="stack" style={{ gap: 8 }}>
          <p className="eyebrow">Icono</p>
          <IconPicker value={icon} onChange={setIcon} options={EXPENSE_ICONS} />
        </div>
        {group && currency !== group.currency && total > 0 && (
          <p className="small muted">
            ≈ {formatMoney(total * rateToBase, group.currency)} en la moneda del grupo, al tipo de cambio de hoy{!rates.live && " (aprox.)"}.
          </p>
        )}
      </div>

      {/* 2. Personas */}
      <div className="tile solid stack">
        <p className="eyebrow">2 · ¿Entre quiénes?</p>
        {group ? (
          <div className="row wrap">
            {group.memberIds.map((id) => (
              <button
                key={id}
                type="button"
                className={`chip${participants.includes(id) ? " on" : ""}`}
                onClick={() => setParticipants(participants.includes(id) ? participants.filter((x) => x !== id) : [...participants, id])}
              >
                {participants.includes(id) ? <Check size={14} aria-hidden /> : <Plus size={14} aria-hidden />} {personName(s, id)}
              </button>
            ))}
          </div>
        ) : (
          <PeoplePicker selected={participants} onChange={setParticipants} />
        )}
        {participants.length < 2 && <p className="small muted">Elige al menos dos personas.</p>}
      </div>

      {/* 3. Quién pagó */}
      <div className="tile solid stack">
        <div className="spread">
          <p className="eyebrow">3 · ¿Quién pagó?</p>
          <div className="seg" style={{ flex: "0 0 auto" }}>
            <button type="button" className={!multiPayer ? "on" : ""} onClick={() => setMultiPayer(false)}>Una persona</button>
            <button type="button" className={multiPayer ? "on" : ""} onClick={() => setMultiPayer(true)}>Varias</button>
          </div>
        </div>
        {!multiPayer ? (
          <div className="row wrap">
            {participants.map((id) => (
              <button key={id} type="button" className={`chip${payer === id ? " on" : ""}`} onClick={() => setPayer(id)}>
                {personName(s, id)}
              </button>
            ))}
          </div>
        ) : (
          <>
            {participants.map((id) => (
              <div key={id} className="row">
                <Avatar name={personName(s, id)} id={id} />
                <span className="grow">{personName(s, id)}</span>
                <input className="input num" type="number" inputMode="decimal" min="0" step={step} placeholder="0" value={payerAmounts[id] ?? ""} onChange={(e) => setPayerAmounts({ ...payerAmounts, [id]: e.target.value })} />
              </div>
            ))}
            {remainingBox(payerRemaining, "money", "Falta por asignar de lo pagado")}
          </>
        )}
        {!multiPayer && !participants.includes(payer) && <p className="small neg">Elige quién pagó.</p>}
      </div>

      {/* 4. Cómo se divide */}
      <div className="tile solid stack">
        <p className="eyebrow">4 · ¿Cómo se divide?</p>
        <div className="seg">
          {METHODS.map((m) => (
            <button type="button" key={m.id} className={method === m.id ? "on" : ""} onClick={() => setMethod(m.id)}>
              {m.label}
            </button>
          ))}
        </div>
        <p className="small muted">{METHODS.find((m) => m.id === method)!.hint}</p>
        {participants.map((id) => (
          <div key={id} className="row">
            {method === "equal" && (
              <input type="checkbox" className="check" checked={equalOn[id] !== false} onChange={(e) => setEqualOn({ ...equalOn, [id]: e.target.checked })} />
            )}
            <Avatar name={personName(s, id)} id={id} />
            <div className="grow">
              <p>{personName(s, id)}</p>
              {method !== "exact" && (split.owed[id] ?? 0) > 0 && <p className="small muted">{formatMoney(split.owed[id], currency)}</p>}
            </div>
            {method !== "equal" && (
              <div className="input-suffix">
                <input
                  className="input num"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step={method === "exact" ? step : method === "percent" ? "0.01" : "1"}
                  placeholder="0"
                  value={inputs[id] ?? ""}
                  onChange={(e) => setInputs({ ...inputs, [id]: e.target.value })}
                />
                <span className="muted small" style={{ width: 44 }}>{method === "exact" ? currency : method === "percent" ? "%" : "parte(s)"}</span>
              </div>
            )}
          </div>
        ))}
        {total > 0 && (method === "exact" || method === "percent") && remainingBox(split.remaining, split.unit)}
        {total > 0 && method === "percent" && split.remaining !== 0 && (
          <p className="small muted">Equivale a {formatMoney(Math.abs((total * split.remaining) / 100), currency)} sin asignar.</p>
        )}
        {total <= 0 && <div className="alert info">Primero escribe el monto total de la cuenta.</div>}
      </div>

      <button className="btn block" disabled={!valid} onClick={save}>Guardar gasto</button>
      {!valid && total > 0 && (
        <p className="small muted" style={{ textAlign: "center" }}>
          {!description.trim() ? "Falta la descripción. " : ""}
          {!payersOk ? "Revisa quién pagó. " : ""}
          {!split.ok ? "La división no cuadra con el total. " : ""}
        </p>
      )}
    </div>
  );
}
