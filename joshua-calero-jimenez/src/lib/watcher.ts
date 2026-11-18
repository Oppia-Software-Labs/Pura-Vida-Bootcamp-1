import { useSyncExternalStore } from "react";
import { server } from "./horizon";
import { getCharges, markPaid } from "./storage";
import { toStroops } from "./validation";

interface Incoming {
  hash: string;
  amount: string;
  memo?: string;
  from: string;
  createdAt: number;
}

const streams = new Map<string, () => void>();
const listeners = new Set<() => void>();
let snapshot: readonly string[] = [];

function publish() {
  snapshot = [...streams.keys()];
  listeners.forEach((l) => l());
}

/** Direcciones que estamos escuchando ahora mismo (para mostrar "en vivo"). */
export const useWatching = () =>
  useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => snapshot,
    () => snapshot,
  );

// El memo vive en la transacción, no en el pago: por eso join=transactions.
async function toIncoming(address: string, r: any): Promise<Incoming | null> {
  if (r.type !== "payment" || r.to !== address || r.asset_type !== "native") return null;
  const tx = typeof r.transaction === "function" ? await r.transaction() : r.transaction;
  return {
    hash: r.transaction_hash,
    amount: r.amount,
    memo: tx?.memo_type === "text" ? tx.memo : undefined,
    from: r.from,
    createdAt: Date.parse(r.created_at),
  };
}

/** Compara monto + memo contra los cobros pendientes de esa dirección. */
function apply(address: string, p: Incoming) {
  if (!p.memo) return;
  const match = [...getCharges()]
    .filter((c) => c.status === "pending" && c.to === address)
    .sort((a, b) => a.createdAt - b.createdAt)
    .find(
      (c) =>
        c.memo === p.memo &&
        toStroops(c.amount) === toStroops(p.amount) &&
        p.createdAt >= c.createdAt - 60_000, // margen por diferencia de relojes
    );
  if (match) markPaid(match.id, { hash: p.hash, payer: p.from, paidAt: p.createdAt });
}

async function backfill(address: string) {
  // Cubre pagos que entraron antes de abrir la página o mientras estaba cerrada.
  try {
    const page = await server
      .payments()
      .forAccount(address)
      .order("desc")
      .limit(50)
      .join("transactions")
      .call();
    for (const r of [...page.records].reverse()) {
      const p = await toIncoming(address, r);
      if (p) apply(address, p);
    }
  } catch {
    /* el stream en vivo sigue funcionando aunque falle el historial */
  }
}

function open(address: string) {
  const close = server
    .payments()
    .forAccount(address)
    .cursor("now")
    .join("transactions")
    .stream({
      onmessage: async (r: any) => {
        const p = await toIncoming(address, r);
        if (p) apply(address, p);
      },
      onerror: () => {
        /* EventSource reintenta solo; Horizon a veces corta la conexión */
      },
    });
  streams.set(address, close);
  void backfill(address);
}

/** Deja abiertos exactamente los streams de las direcciones indicadas. */
export function syncWatchers(addresses: string[]) {
  const wanted = new Set(addresses);
  for (const [addr, close] of streams) {
    if (!wanted.has(addr)) {
      close();
      streams.delete(addr);
    }
  }
  for (const addr of wanted) if (!streams.has(addr)) open(addr);
  publish();
}

export function stopAllWatchers() {
  syncWatchers([]);
}
