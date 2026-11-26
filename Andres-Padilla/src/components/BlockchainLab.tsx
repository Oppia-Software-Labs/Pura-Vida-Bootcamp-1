"use client";

import type { ToyChain } from "@/story/useToyChain";
import styles from "./BlockchainLab.module.css";

const shortHash = (h?: string) => (h ? `${h.slice(0, 16)}…` : "…");

export default function BlockchainLab({ chain }: { chain: ToyChain }) {
  const { blocks, hashes, analysis, selected, setSelected, editData, repair, restore } = chain;
  if (!blocks || !analysis) return <p className={styles.muted}>Calculando huellas…</p>;

  const i = selected ?? 0;
  const block = blocks[i];
  const status = analysis.status[i];
  const linkOk = i === 0 ? true : analysis.links[i - 1];
  const changed = analysis.status.some((s) => s !== "ok");

  return (
    <div className={styles.lab}>
      <div className={styles.tabs} role="tablist" aria-label="Bloques">
        {blocks.map((_, k) => (
          <button
            key={k}
            role="tab"
            aria-selected={k === i}
            className={`${styles.tab} ${styles[analysis.status[k]]} ${k === i ? styles.active : ""}`}
            onClick={() => setSelected(k)}
          >
            {k === 0 ? "Génesis" : `#${k}`}
          </button>
        ))}
      </div>

      <label className={styles.field}>
        <span>Datos del bloque {i === 0 ? "génesis" : i}</span>
        <textarea
          className={styles.data}
          value={block.data}
          maxLength={120}
          rows={2}
          onChange={(e) => editData(i, e.target.value)}
        />
      </label>

      <div className={styles.hashes}>
        <div>
          <span>Huella anterior guardada</span>
          <code className={linkOk ? "" : styles.bad}>{shortHash(block.prevHash)}</code>
        </div>
        <div>
          <span>Huella de este bloque</span>
          <code className={styles[status]}>{shortHash(hashes[i])}</code>
        </div>
      </div>

      <p className={`${styles.verdict} ${styles[analysis.breakAt !== -1 ? "broken" : analysis.rejected ? "rejected" : "ok"]}`}>
        {analysis.breakAt !== -1 ? (
          <>
            ⛓️ <b>Cadena rota.</b> Cambiaste el bloque {analysis.breakAt}: su huella es otra y el bloque{" "}
            {analysis.breakAt + 1} ya no la reconoce. Todo lo que viene después queda inválido.
          </>
        ) : analysis.rejected ? (
          <>
            ⚠️ <b>Tu cadena es coherente, pero distinta</b> a las demás copias de la red, así que la
            rechazan. Para cambiar la historia tendrías que convencer a la mayoría de computadoras a la vez.
          </>
        ) : (
          <>✅ La cadena es válida y coincide con todas las copias de la red.</>
        )}
      </p>

      {changed && (
        <div className={styles.actions}>
          {analysis.breakAt !== -1 && (
            <button className={styles.action} onClick={repair}>
              Recalcular huellas
            </button>
          )}
          <button className={styles.action} onClick={restore}>
            Restaurar original
          </button>
        </div>
      )}
    </div>
  );
}
