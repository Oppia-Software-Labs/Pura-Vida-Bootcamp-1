// Lógica de división de cuentas y deudas entre parejas de personas.
// Importante: las deudas solo se compensan entre DOS personas (A con B),
// nunca se mezclan las cuentas de todo el grupo.
import { fromMinor, toMinor, roundTo } from "./currencies";
import type { Expense, Settlement, SplitMethod, State } from "./store";
import { scopeOf } from "./store";

/** Reparte `total` unidades enteras según pesos, sin perder centavos (método del mayor residuo). */
export function distribute(total: number, weights: Record<string, number>): Record<string, number> {
  const ids = Object.keys(weights).filter((id) => weights[id] > 0);
  const W = ids.reduce((a, id) => a + weights[id], 0);
  const out: Record<string, number> = {};
  if (W <= 0 || ids.length === 0) return out;
  let assigned = 0;
  const fracs: { id: string; f: number }[] = [];
  for (const id of ids) {
    const raw = (total * weights[id]) / W;
    const fl = Math.floor(raw);
    out[id] = fl;
    assigned += fl;
    fracs.push({ id, f: raw - fl });
  }
  fracs.sort((a, b) => b.f - a.f);
  for (let i = 0; i < total - assigned; i++) out[fracs[i % fracs.length].id] += 1;
  return out;
}

export type SplitResult = {
  owed: Record<string, number>; // montos en moneda del gasto
  ok: boolean;
  remaining: number; // lo que falta asignar (en moneda o en %), positivo = falta, negativo = sobra
  unit: "money" | "percent";
};

export function computeSplit(
  method: SplitMethod,
  total: number,
  currencyCode: string,
  participantIds: string[],
  inputs: Record<string, number>,
): SplitResult {
  const T = toMinor(total, currencyCode);
  const minorToMajor = (m: Record<string, number>) =>
    Object.fromEntries(Object.entries(m).map(([k, v]) => [k, fromMinor(v, currencyCode)]));

  if (method === "equal") {
    const w = Object.fromEntries(participantIds.map((id) => [id, 1]));
    const owed = distribute(T, w);
    return { owed: minorToMajor(owed), ok: T > 0 && participantIds.length > 0, remaining: participantIds.length ? 0 : total, unit: "money" };
  }
  if (method === "exact") {
    const owed: Record<string, number> = {};
    let sum = 0;
    for (const id of participantIds) {
      const v = toMinor(inputs[id] ?? 0, currencyCode);
      if (v > 0) owed[id] = v;
      sum += v;
    }
    const rem = T - sum;
    return { owed: minorToMajor(owed), ok: T > 0 && rem === 0, remaining: fromMinor(rem, currencyCode), unit: "money" };
  }
  if (method === "percent") {
    const w: Record<string, number> = {};
    let sumPct = 0;
    for (const id of participantIds) {
      const p = inputs[id] ?? 0;
      if (p > 0) w[id] = p;
      sumPct += p;
    }
    const rem = Math.round((100 - sumPct) * 100) / 100;
    // Con 100% exacto se reparte el total completo; si no, se muestra una vista previa.
    const owed = rem === 0 ? distribute(T, w) : Object.fromEntries(Object.entries(w).map(([k, p]) => [k, Math.round((T * p) / 100)]));
    return { owed: minorToMajor(owed), ok: T > 0 && rem === 0, remaining: rem, unit: "percent" };
  }
  // shares
  const w: Record<string, number> = {};
  for (const id of participantIds) if ((inputs[id] ?? 0) > 0) w[id] = inputs[id];
  const owed = distribute(T, w);
  const hasShares = Object.keys(w).length > 0;
  return { owed: minorToMajor(owed), ok: T > 0 && hasShares, remaining: hasShares ? 0 : total, unit: "money" };
}

export type Debt = { from: string; to: string; amount: number }; // moneda del gasto

/** Quién le debe a quién dentro de UN gasto (soporta varios pagadores). */
export function expenseDebts(e: Expense): Debt[] {
  const net: Record<string, number> = {};
  for (const p of e.payers) net[p.personId] = (net[p.personId] ?? 0) + toMinor(p.amount, e.currency);
  for (const o of e.owed) net[o.personId] = (net[o.personId] ?? 0) - toMinor(o.amount, e.currency);
  const creditors = Object.entries(net).filter(([, v]) => v > 0);
  const debtors = Object.entries(net).filter(([, v]) => v < 0);
  const credTotal = creditors.reduce((a, [, v]) => a + v, 0);
  const debts: Debt[] = [];
  for (const [d, v] of debtors) {
    const parts = distribute(-v, Object.fromEntries(creditors.map(([c, cv]) => [c, cv / credTotal])));
    for (const [c, m] of Object.entries(parts)) if (m > 0) debts.push({ from: d, to: c, amount: fromMinor(m, e.currency) });
  }
  return debts;
}

export type PairItem = { expense: Expense; amount: number }; // amount en moneda base: + = b le debe a a

export type PairState = {
  a: string;
  b: string;
  items: PairItem[]; // gastos aún sin saldar entre a y b
  net: number; // + = b le debe a a ; − = a le debe a b (moneda base)
  currency: string;
  pending?: Settlement; // cobro abierto esperando pago
  history: Settlement[];
};

function samePair(x: Settlement, a: string, b: string) {
  return (x.fromId === a && x.toId === b) || (x.fromId === b && x.toId === a);
}

/** Estado de la cuenta entre dos personas dentro de un grupo o cuenta suelta. */
export function pairState(s: State, scope: string, currencyCode: string, a: string, b: string): PairState {
  const expenses = s.expenses.filter((e) => scopeOf(e) === scope);
  const settlements = s.settlements.filter((x) => x.scope === scope && samePair(x, a, b));
  const locked = new Set(settlements.flatMap((x) => x.expenseIds));
  const items: PairItem[] = [];
  for (const e of expenses) {
    if (locked.has(e.id)) continue;
    let amt = 0;
    for (const d of expenseDebts(e)) {
      if (d.from === b && d.to === a) amt += d.amount;
      if (d.from === a && d.to === b) amt -= d.amount;
    }
    if (amt !== 0) items.push({ expense: e, amount: amt * e.rateToBase });
  }
  const net = roundTo(items.reduce((acc, i) => acc + i.amount, 0), currencyCode);
  return {
    a,
    b,
    items,
    net,
    currency: currencyCode,
    pending: settlements.find((x) => x.status === "pending"),
    history: settlements.filter((x) => x.status === "paid").sort((x, y) => (y.paidAt ?? 0) - (x.paidAt ?? 0)),
  };
}

/** Todas las parejas con algo pendiente dentro de un alcance. */
export function scopePairs(s: State, scope: string, currencyCode: string, memberIds: string[]): PairState[] {
  const out: PairState[] = [];
  for (let i = 0; i < memberIds.length; i++)
    for (let j = i + 1; j < memberIds.length; j++) {
      const ps = pairState(s, scope, currencyCode, memberIds[i], memberIds[j]);
      if (ps.items.length > 0 || ps.pending) out.push(ps);
    }
  return out;
}

export type DebtStatus = "pagado" | "pendiente";

/** Estado de una deuda concreta (deudor → acreedor) en un gasto. */
export function debtStatus(s: State, e: Expense, from: string, to: string): DebtStatus {
  const st = s.settlements.find((x) => x.scope === scopeOf(e) && samePair(x, from, to) && x.expenseIds.includes(e.id));
  return st?.status === "paid" ? "pagado" : "pendiente";
}

export function expenseStatus(s: State, e: Expense): { paid: number; total: number } {
  const debts = expenseDebts(e);
  return { paid: debts.filter((d) => debtStatus(s, e, d.from, d.to) === "pagado").length, total: debts.length };
}
