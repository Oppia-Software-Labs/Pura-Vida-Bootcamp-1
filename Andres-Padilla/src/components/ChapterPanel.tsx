"use client";

import type { ReactNode } from "react";
import { CHAPTERS, type Chapter } from "@/story/chapters";
import styles from "./ChapterPanel.module.css";

type Props = {
  index: number;
  onGo: (index: number) => void;
  /** Último capítulo al que se puede llegar: los siguientes requieren completar pasos. */
  maxReachable: number;
  /** Si el capítulo actual aún no está completado, qué falta hacer (bloquea "Siguiente"). */
  pending?: string;
  /** Hace pulsar el panel y su botón para llamar la atención (hasta el primer clic). */
  attention?: boolean;
  /** Contenido interactivo propio del capítulo. */
  children?: ReactNode;
};

export function ChapterProgress({
  index,
  onGo,
  maxReachable,
}: Pick<Props, "index" | "onGo" | "maxReachable">) {
  return (
    <nav className={styles.progress} aria-label="Capítulos">
      {CHAPTERS.map((c, i) => {
        const locked = i > maxReachable;
        return (
          <button
            key={c.id}
            className={`${styles.step} ${i === index ? styles.current : ""} ${i < index ? styles.done : ""} ${locked ? styles.locked : ""}`}
            onClick={() => onGo(i)}
            disabled={locked}
            aria-current={i === index ? "step" : undefined}
            title={locked ? `${c.title} · completa los capítulos anteriores` : c.title}
          >
            <span className={styles.dot} />
            <span className={styles.stepLabel}>{c.short}</span>
          </button>
        );
      })}
    </nav>
  );
}

export default function ChapterPanel({
  index,
  onGo,
  maxReachable,
  pending,
  attention = false,
  children,
}: Props) {
  const chapter: Chapter = CHAPTERS[index];
  const isFirst = index === 0;
  const isLast = index === CHAPTERS.length - 1;
  const nextLocked = !isLast && index + 1 > maxReachable;

  return (
    <section className={`${styles.panel} ${attention ? styles.attention : ""}`} key={chapter.id}>
      <p className={styles.kicker}>{isFirst ? "Bienvenida" : `Capítulo ${index} de ${CHAPTERS.length - 1}`}</p>
      <h2 className={styles.title}>{chapter.title}</h2>
      {chapter.body.map((p) => (
        <p key={p} className={styles.body}>
          {p}
        </p>
      ))}

      {children && <div className={styles.extra}>{children}</div>}

      {nextLocked && pending && <p className={styles.pending}>Para continuar: {pending}</p>}

      <div className={styles.nav}>
        {!isFirst && (
          <button className={styles.back} onClick={() => onGo(index - 1)}>
            ← Anterior
          </button>
        )}
        <button
          className={`${styles.next} ${attention ? styles.nextAttention : ""}`}
          onClick={() => onGo(isLast ? 0 : index + 1)}
          disabled={nextLocked}
        >
          {isFirst ? "Empezar viaje →" : isLast ? "Volver al inicio" : "Siguiente →"}
        </button>
      </div>
    </section>
  );
}
