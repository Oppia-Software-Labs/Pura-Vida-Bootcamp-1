"use client";

import { useEffect, useRef, useState } from "react";
import { LEVELS, nextLevel, type Level } from "@/lib/journey";
import { Icon } from "./Icon";
import { useJourney } from "./JourneyProvider";
import { LevelAccount } from "./LevelAccount";
import { LevelArt } from "./LevelArt";
import { LevelNest } from "./LevelNest";
import { LevelWallet, WalletInstructions } from "./LevelWallet";
import { ProgressPath } from "./ProgressPath";

export function JourneyView({ requested }: { requested?: Level }) {
  const { progress, ready, complete, wallet } = useJourney();
  const [selected, setSelected] = useState<Level>();
  const heading = useRef<HTMLHeadingElement>(null);
  const current = Math.min(selected ?? requested ?? nextLevel(progress), nextLevel(progress)) as Level;
  const level = LEVELS[current - 1];

  function goTo(value: Level) {
    setSelected(value);
    requestAnimationFrame(() => {
      heading.current?.focus({ preventScroll: true });
      heading.current?.scrollIntoView({ block: "start" });
    });
  }

  useEffect(() => {
    if (ready && requested === 1 && window.location.hash === "#glosario") {
      document.getElementById("glosario")?.scrollIntoView({ block: "start" });
    }
  }, [ready, requested]);

  return (
    <main id="contenido" className="site-shell journey">
      <section aria-labelledby="journey-title">
        <div className="section-heading">
          <div><p className="eyebrow">Tu recorrido</p><h1 id="journey-title">El viaje de la baula</h1></div>
          <span className="progress-count">{progress} de 4 niveles</span>
        </div>
        <ProgressPath progress={progress} current={current} onSelect={goTo}/>
      </section>

      <section className="level-surface" aria-labelledby="level-title" aria-busy={!ready}>
        <div className="level-header">
          <div className="level-header-inner">
            <p className="eyebrow"><Icon name={level.icon} width="17" height="17"/> Nivel {current} · {level.subject}</p>
            <h2 id="level-title" ref={heading} tabIndex={-1}>{level.name}</h2>
          </div>
          <LevelArt level={current}/>
        </div>

        <div className="level-body">
          {!ready && <p role="status" className="muted">Cargando tu recorrido…</p>}
          {ready && current === 1 && <LevelNest onContinue={() => { complete(1); goTo(2); }}/>}
          {ready && current === 2 && <LevelWallet onContinue={() => { complete(2); goTo(3); }}/>}
          {ready && current >= 3 && !wallet?.testnet && (
            <div className="level-flow">
              <WalletInstructions wrongNetwork={wallet?.testnet === false}/>
              <button className="button button-secondary" onClick={() => goTo(2)}><Icon name="back"/> Volver a la conexión</button>
            </div>
          )}
          {ready && current === 3 && wallet?.testnet && (
            <LevelAccount key={wallet.address} address={wallet.address} onContinue={() => { complete(3); goTo(4); }}/>
          )}
          {ready && current === 4 && wallet?.testnet && <p className="lead">Prepará tu primer pago de prueba.</p>}
        </div>
      </section>
    </main>
  );
}
