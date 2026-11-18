import { useSyncExternalStore } from "react";

export type ChargeStatus = "pending" | "paid";

export interface Charge {
  id: string;
  to: string;
  amount: string;
  memo: string;
  label?: string;
  desc?: string;
  createdAt: number;
  status: ChargeStatus;
  hash?: string;
  payer?: string;
  paidAt?: number;
}

const KEY = "pagalink.charges.v1";
const listeners = new Set<() => void>();
let cache: Charge[] | null = null;

function load(): Charge[] {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    cache = Array.isArray(parsed)
      ? parsed.filter((c) => c && typeof c.id === "string" && typeof c.to === "string")
      : [];
  } catch {
    cache = [];
  }
  return cache!;
}

function write(next: Charge[]) {
  cache = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* localStorage lleno o bloqueado: seguimos en memoria */
  }
  listeners.forEach((l) => l());
}

export const getCharges = () => load();

export function addCharge(c: Omit<Charge, "id" | "createdAt" | "status">): Charge {
  const charge: Charge = {
    ...c,
    id: crypto.randomUUID().slice(0, 8),
    createdAt: Date.now(),
    status: "pending",
  };
  write([charge, ...load()]);
  return charge;
}

export function markPaid(id: string, info: { hash: string; payer?: string; paidAt: number }) {
  write(
    load().map((c) =>
      c.id === id && c.status === "pending" ? { ...c, status: "paid", ...info } : c,
    ),
  );
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      cache = null;
      cb();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

export const useCharges = () => useSyncExternalStore(subscribe, load, load);
