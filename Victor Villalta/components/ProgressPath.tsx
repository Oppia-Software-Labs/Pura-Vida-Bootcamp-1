"use client";

import Link from "next/link";
import type { CSSProperties } from "react";
import { LEVELS, nextLevel, type Level, type Progress } from "@/lib/journey";
import { Icon } from "./Icon";
import { useJourney } from "./JourneyProvider";

export function ProgressPath({ progress, current, onSelect }: {
  progress: Progress;
  current: Level;
  onSelect?: (level: Level) => void;
}) {
  const allowed = nextLevel(progress);
  const turtlePosition = progress === 4 ? "93%" : `${12.5 + progress * 25}%`;

  return (
    <nav className="progress-path" aria-label="Niveles del viaje">
      <div className="path-rail" aria-hidden="true">
        <div className="path-track"><div /></div>
        <div className="path-turtle" style={{ "--turtle-position": turtlePosition } as CSSProperties}>
          <img src="/baula-cria.svg" width="42" height="34" alt=""/>
        </div>
      </div>
      <ol>
        {LEVELS.map(({ id, name, subject, icon }) => {
          const locked = id > allowed;
          const done = id <= progress;
          const style = `path-step${id === current ? " path-current" : ""}${done ? " path-complete" : ""}`;
          const label = `Nivel ${id}, ${name}${done ? ", completado" : locked ? ", bloqueado" : ""}`;
          const contents = (
            <>
              <span className="path-step-icon"><Icon name={icon} width="22" height="22"/></span>
              <span className="path-step-title">{name}</span>
              <span className="path-step-subject">{subject}</span>
              {done && <span className="step-mark"><Icon name="check" width="12" height="12"/></span>}
              {locked && <span className="step-mark"><Icon name="lock" width="12" height="12"/></span>}
            </>
          );

          return (
            <li key={id}>
              {locked ? <button type="button" className={style} disabled aria-label={label}>{contents}</button>
                : onSelect ? <button className={style} onClick={() => onSelect(id)} aria-current={id === current ? "step" : undefined} aria-label={label}>{contents}</button>
                : <Link className={style} href={`/viaje?nivel=${id}`} aria-label={label}>{contents}</Link>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export function HomePath() {
  const { progress } = useJourney();
  return (
    <section className="home-path" aria-labelledby="ruta-title">
      <div className="section-heading">
        <div><h2 id="ruta-title">El viaje de la baula</h2><p>De tu primera conexión a tu primer pago de prueba.</p></div>
        <span className="progress-count">{progress} de 4 niveles</span>
      </div>
      <ProgressPath progress={progress} current={nextLevel(progress)}/>
    </section>
  );
}
