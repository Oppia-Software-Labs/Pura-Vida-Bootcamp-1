"use client";

import { useEffect, useRef, useState } from "react";
import { getLatestLedger, type LedgerInfo } from "@/lib/stellar";

/**
 * Consulta el último ledger de Testnet cada pocos segundos mientras `enabled`.
 * `onNew` se llama cada vez que la red cierra uno nuevo.
 */
export function useLatestLedger(enabled: boolean, onNew?: (ledger: LedgerInfo) => void) {
  const [ledger, setLedger] = useState<LedgerInfo | null>(null);
  const [error, setError] = useState("");
  const lastSeq = useRef(0);
  const onNewRef = useRef(onNew);

  useEffect(() => {
    onNewRef.current = onNew;
  }, [onNew]);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    const poll = async () => {
      try {
        const l = await getLatestLedger();
        if (cancelled) return;
        setError("");
        if (l.sequence !== lastSeq.current) {
          const isFirst = lastSeq.current === 0;
          lastSeq.current = l.sequence;
          setLedger(l);
          if (!isFirst) onNewRef.current?.(l);
        }
      } catch {
        if (!cancelled) setError("No se pudo consultar la red.");
      }
    };
    poll();
    const id = setInterval(poll, 2000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [enabled]);

  return { ledger, error };
}
