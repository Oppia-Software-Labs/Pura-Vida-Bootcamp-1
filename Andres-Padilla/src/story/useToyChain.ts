"use client";

import { useEffect, useMemo, useState } from "react";
import type { Engine } from "@/three/engine";
import {
  INITIAL_DATA,
  analyzeChain,
  buildChain,
  computeHashes,
  type Block,
} from "./blockchainModel";

/**
 * Estado de la blockchain de juguete: bloques, huellas actuales y huellas
 * "de la red" (las originales). Mantiene la escena 3D sincronizada.
 */
export function useToyChain(engine: Engine | null) {
  const [blocks, setBlocks] = useState<Block[] | null>(null);
  const [hashes, setHashes] = useState<string[]>([]);
  const [networkHashes, setNetworkHashes] = useState<string[]>([]);
  const [selected, setSelected] = useState<number | null>(2);

  // Cadena original: es la que tienen todas las copias de la red
  useEffect(() => {
    let cancelled = false;
    buildChain(INITIAL_DATA).then(async (b) => {
      const h = await computeHashes(b);
      if (cancelled) return;
      setBlocks(b);
      setNetworkHashes(h);
      setHashes(h);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Cada vez que cambian los bloques, se recalculan sus huellas
  useEffect(() => {
    if (!blocks) return;
    let cancelled = false;
    computeHashes(blocks).then((h) => {
      if (!cancelled) setHashes(h);
    });
    return () => {
      cancelled = true;
    };
  }, [blocks]);

  const analysis = useMemo(
    () =>
      blocks && hashes.length === blocks.length
        ? analyzeChain(blocks, hashes, networkHashes)
        : null,
    [blocks, hashes, networkHashes],
  );

  useEffect(() => {
    if (!engine || !analysis) return;
    engine.chain.setState({ status: analysis.status, links: analysis.links, hashes, selected });
  }, [engine, analysis, hashes, selected]);

  function editData(index: number, data: string) {
    setBlocks((prev) => prev && prev.map((b, i) => (i === index ? { ...b, data } : b)));
  }

  /** Vuelve a calcular y guardar las huellas en orden, como haría alguien que quiere falsificar la cadena. */
  async function repair() {
    if (!blocks) return;
    setBlocks(await buildChain(blocks.map((b) => b.data)));
  }

  async function restore() {
    setBlocks(await buildChain(INITIAL_DATA));
  }

  return { blocks, hashes, networkHashes, analysis, selected, setSelected, editData, repair, restore };
}

export type ToyChain = ReturnType<typeof useToyChain>;
