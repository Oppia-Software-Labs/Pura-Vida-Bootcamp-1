// Estado de la app guardado en el navegador (localStorage).
import { useSyncExternalStore } from "react";

export const ME = "me";

export type Person = { id: string; name: string; address?: string };

export type Group = {
  id: string;
  name: string;
  icon: string;
  memberIds: string[];
  currency: string; // moneda base del grupo
  createdAt: number;
};

export type SplitMethod = "equal" | "exact" | "percent" | "shares";

export type Share = { personId: string; amount: number };

export type Expense = {
  id: string;
  groupId: string | null; // null = cuenta suelta
  description: string;
  icon: string;
  currency: string;
  total: number;
  date: string; // YYYY-MM-DD
  createdAt: number;
  participantIds: string[];
  payers: Share[]; // quién pagó y cuánto
  method: SplitMethod;
  inputs: Record<string, number>; // valores que puso el usuario según el método
  owed: Share[]; // cuánto le corresponde a cada persona (moneda del gasto)
  baseCurrency: string;
  rateToBase: number; // 1 unidad de la moneda del gasto = rateToBase de la moneda base
};

export type Settlement = {
  id: string;
  scope: string; // id del grupo o "exp:<id>" para cuentas sueltas
  fromId: string; // quien paga
  toId: string; // quien recibe
  amount: number; // en `currency`
  currency: string;
  expenseIds: string[]; // gastos que cubre este pago
  method: "stellar" | "cash" | "compensado";
  status: "pending" | "paid";
  memo?: string;
  txHash?: string;
  xlmAmount?: string;
  createdAt: number;
  paidAt?: number;
};

export type State = {
  version: 1;
  people: Person[];
  groups: Group[];
  expenses: Expense[];
  settlements: Settlement[];
};

const KEY = "teja-a-teja:v2";

const initial: State = {
  version: 1,
  people: [{ id: ME, name: "Yo" }],
  groups: [],
  expenses: [],
  settlements: [],
};

function load(): State {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const s = JSON.parse(raw) as State;
      if (!s.people.some((p) => p.id === ME)) s.people.unshift({ id: ME, name: "Yo" });
      return s;
    }
  } catch {
    /* empezamos de cero */
  }
  return structuredClone(initial);
}

let state: State = load();
const listeners = new Set<() => void>();

function set(updater: (s: State) => State) {
  state = updater(state);
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* sin almacenamiento disponible */
  }
  listeners.forEach((l) => l());
}

export function getState() {
  return state;
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

/** Hook de React: re-renderiza cuando cambia el estado. */
export function useAppState(): State {
  return useSyncExternalStore(subscribe, () => state);
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

/** Memo corto (máx. 28 bytes) para identificar el pago en la blockchain. */
export function newMemo(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "TT-";
  for (let i = 0; i < 8; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

export const actions = {
  addPerson(name: string, address?: string): Person {
    const p: Person = { id: uid(), name: name.trim(), address: address?.trim() || undefined };
    set((s) => ({ ...s, people: [...s.people, p] }));
    return p;
  },
  updatePerson(id: string, patch: Partial<Person>) {
    set((s) => ({ ...s, people: s.people.map((p) => (p.id === id ? { ...p, ...patch } : p)) }));
  },
  addGroup(g: Omit<Group, "id" | "createdAt">): Group {
    const group: Group = { ...g, id: uid(), createdAt: Date.now() };
    set((s) => ({ ...s, groups: [...s.groups, group] }));
    return group;
  },
  updateGroup(id: string, patch: Partial<Group>) {
    set((s) => ({ ...s, groups: s.groups.map((g) => (g.id === id ? { ...g, ...patch } : g)) }));
  },
  deleteGroup(id: string) {
    set((s) => ({
      ...s,
      groups: s.groups.filter((g) => g.id !== id),
      expenses: s.expenses.filter((e) => e.groupId !== id),
      settlements: s.settlements.filter((x) => x.scope !== id),
    }));
  },
  addExpense(e: Omit<Expense, "id" | "createdAt">): Expense {
    const exp: Expense = { ...e, id: uid(), createdAt: Date.now() };
    set((s) => ({ ...s, expenses: [...s.expenses, exp] }));
    return exp;
  },
  deleteExpense(id: string) {
    set((s) => ({
      ...s,
      expenses: s.expenses.filter((e) => e.id !== id),
      settlements: s.settlements.filter((x) => x.scope !== `exp:${id}`),
    }));
  },
  addSettlement(x: Omit<Settlement, "id" | "createdAt">): Settlement {
    const st: Settlement = { ...x, id: uid(), createdAt: Date.now() };
    set((s) => ({ ...s, settlements: [...s.settlements, st] }));
    return st;
  },
  updateSettlement(id: string, patch: Partial<Settlement>) {
    set((s) => ({ ...s, settlements: s.settlements.map((x) => (x.id === id ? { ...x, ...patch } : x)) }));
  },
  deleteSettlement(id: string) {
    set((s) => ({ ...s, settlements: s.settlements.filter((x) => x.id !== id) }));
  },
};

export function personName(s: State, id: string): string {
  if (id === ME) return "Tú";
  return s.people.find((p) => p.id === id)?.name ?? "¿?";
}

export function person(s: State, id: string): Person | undefined {
  return s.people.find((p) => p.id === id);
}

export function scopeOf(e: Expense): string {
  return e.groupId ?? `exp:${e.id}`;
}
