"use client";

import { NODE_COUNT, QUORUM, VALIDATORS } from "@/story/validators";
import styles from "./NetworkLab.module.css";

type Props = {
  active: boolean[];
  selected: number | null;
  ledgers: number;
  onToggle: (index: number) => void;
  onReset: () => void;
};

export default function NetworkLab({ active, selected, ledgers, onToggle, onReset }: Props) {
  const count = active.filter(Boolean).length;
  const quorum = count >= QUORUM;

  return (
    <div className={styles.lab}>
      <div className={styles.meter} aria-label={`${count} de ${NODE_COUNT} validadores activos`}>
        {active.map((on, i) => (
          <button
            key={i}
            className={`${styles.node} ${on ? styles.on : ""} ${selected === i ? styles.selected : ""}`}
            onClick={() => onToggle(i)}
            title={`${VALIDATORS[i]} · ${on ? "activo" : "apagado"}`}
            aria-pressed={on}
          />
        ))}
        <span className={styles.threshold} style={{ left: `${(QUORUM / NODE_COUNT) * 100}%` }} />
      </div>
      <p className={styles.counts}>
        <b>{count}</b> de {NODE_COUNT} validadores activos · se necesitan más de dos tercios ({QUORUM})
      </p>

      {selected !== null && (
        <p className={styles.selectedInfo}>
          {active[selected] ? "🟢" : "⚫"} <b>{VALIDATORS[selected]}</b>{" "}
          {active[selected] ? "está validando." : "está apagado."}
        </p>
      )}

      <p className={`${styles.verdict} ${quorum ? styles.ok : styles.halt}`}>
        {quorum ? (
          <>
            ✅ Hay acuerdo: la red cierra un ledger cada ~5 s. Ledgers cerrados: <b>{ledgers}</b>
          </>
        ) : (
          <>
            ⏸️ <b>Sin acuerdo suficiente.</b> Stellar prefiere detenerse antes que arriesgarse a
            registrar algo incorrecto: espera a que vuelvan los validadores.
          </>
        )}
      </p>

      <p className={styles.hint}>
        Pulsa los nodos (aquí o en la galaxia) para apagarlos o encenderlos.
        {count < NODE_COUNT && (
          <>
            {" "}
            <button className={styles.link} onClick={onReset}>
              Encender todos
            </button>
          </>
        )}
      </p>
    </div>
  );
}
