// Modelo de una blockchain de juguete para el capítulo 1.
// Cada bloque guarda sus datos y la huella (hash SHA-256) del bloque anterior.

export type Block = {
  data: string;
  /** Hash del bloque anterior tal como quedó guardado en este bloque. */
  prevHash: string;
};

/**
 * ok       → coincide con las demás copias de la red
 * broken   → la cadena está rota en este bloque o antes
 * rejected → la cadena es coherente, pero distinta a la de la red
 */
export type BlockStatus = "ok" | "broken" | "rejected";

export const GENESIS_PREV = "0".repeat(64);

export const INITIAL_DATA = [
  "Bloque génesis",
  "Ana → Luis: 25 XLM\nLuis → Sofía: 3 XLM",
  "Sofía → Marco: 10 XLM",
  "Marco → Ana: 7 XLM\nAna → Sofía: 1 XLM",
  "Luis → Marco: 12 XLM",
];

export async function sha256(text: string): Promise<string> {
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

/** La huella de un bloque depende de su posición, del hash anterior que guarda y de sus datos. */
export const hashBlock = (index: number, block: Block) =>
  sha256(`${index}|${block.prevHash}|${block.data}`);

export const computeHashes = (blocks: Block[]) => Promise.all(blocks.map((b, i) => hashBlock(i, b)));

/**
 * Construye una cadena válida a partir de los datos: cada bloque guarda
 * el hash recién calculado del anterior.
 */
export async function buildChain(datas: string[]): Promise<Block[]> {
  const blocks: Block[] = [];
  let prev = GENESIS_PREV;
  for (let i = 0; i < datas.length; i++) {
    const block = { data: datas[i], prevHash: prev };
    blocks.push(block);
    prev = await hashBlock(i, block);
  }
  return blocks;
}

export type ChainAnalysis = {
  /** links[i]: ¿el bloque i+1 guarda el hash actual del bloque i? */
  links: boolean[];
  status: BlockStatus[];
  /** Primer bloque cuyo hash ya no coincide con lo que guarda el siguiente (o -1). */
  breakAt: number;
  rejected: boolean;
};

export function analyzeChain(
  blocks: Block[],
  hashes: string[],
  networkHashes: string[],
): ChainAnalysis {
  const links = blocks.slice(1).map((b, i) => b.prevHash === hashes[i]);
  const firstBad = links.indexOf(false);
  const breakAt = firstBad; // el bloque firstBad cambió y el siguiente ya no lo reconoce

  const status: BlockStatus[] = hashes.map((h, i) => {
    if (breakAt !== -1 && i >= breakAt) return "broken";
    if (h !== networkHashes[i]) return "rejected";
    return "ok";
  });

  return {
    links,
    status,
    breakAt,
    rejected: breakAt === -1 && status.includes("rejected"),
  };
}
