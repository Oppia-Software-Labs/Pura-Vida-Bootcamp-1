"use client";

import { useEffect, useRef, useState } from "react";
import { LEVELS, nextLevel, type Level } from "@/lib/journey";
import type { PaymentReceipt } from "@/lib/stellar/payment";
import { Celebration } from "./Celebration";
import { Icon } from "./Icon";
import { useJourney } from "./JourneyProvider";
import { LevelAccount } from "./LevelAccount";
import { LevelArt } from "./LevelArt";
import { LevelNest } from "./LevelNest";
import { LevelPayment } from "./LevelPayment";
import { LevelWallet, WalletInstructions } from "./LevelWallet";
import { ProgressPath } from "./ProgressPath";
import { useRaven } from "./RavenPanel";

const RECEIPT_KEY = "baula-receipt-v1";

function savedReceipt(): PaymentReceipt | null {
  try {
    const raw = localStorage.getItem(RECEIPT_KEY);
    const data = raw ? JSON.parse(raw) as Partial<PaymentReceipt> : null;
    if (data && typeof data.hash === "string" && /^[a-f0-9]{64}$/.test(data.hash) &&
        typeof data.amount === "string" && /^\d{1,2}(?:\.\d{1,7})?$/.test(data.amount)) {
      return { hash: data.hash, amount: data.amount };
    }
  } catch {
    // El recorrido sigue disponible sin almacenamiento persistente.
  }
  return null;
}

export function JourneyView({ requested }: { requested?: Level }) {
  const { progress, ready, complete, wallet } = useJourney();
  const { open: openRaven, setLevel: setRavenLevel } = useRaven();
  const [selected, setSelected] = useState<Level>();
  const [receipt, setReceipt] = useState<PaymentReceipt | null>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const current = Math.min(selected ?? requested ?? nextLevel(progress), nextLevel(progress)) as Level;
  const level = LEVELS[current - 1];

  useEffect(() => setRavenLevel(current), [current, setRavenLevel]);

  function goTo(value: Level) {
    setSelected(value);
    requestAnimationFrame(() => {
      heading.current?.focus({ preventScroll: true });
      heading.current?.scrollIntoView({ block: "start" });
    });
  }

  useEffect(() => {
    setReceipt(savedReceipt());
  }, []);

  function finish(sent: PaymentReceipt) {
    setReceipt(sent);
    try { localStorage.setItem(RECEIPT_KEY, JSON.stringify(sent)); } catch { /* Sesión sin almacenamiento. */ }
    complete(4);
    goTo(4);
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
          {ready && current >= 3 && !(current === 4 && progress === 4) && !wallet?.testnet && (
            <div className="level-flow">
              <WalletInstructions wrongNetwork={wallet?.testnet === false}/>
              <button className="button button-secondary" onClick={() => goTo(2)}><Icon name="back"/> Volver a la conexión</button>
            </div>
          )}
          {ready && current === 3 && wallet?.testnet && (
            <LevelAccount key={wallet.address} address={wallet.address} onContinue={() => { complete(3); goTo(4); }}/>
          )}
          {ready && current === 4 && progress === 4 && <Celebration receipt={receipt}/>}
          {ready && current === 4 && progress < 4 && wallet?.testnet && <LevelPayment key={wallet.address} address={wallet.address} onSent={finish}/>}
          <div className="level-chat"><button className="button button-quiet" onClick={() => openRaven(current)} aria-haspopup="dialog"><Icon name="raven"/> Pregúntale a Raven</button></div>
        </div>
      </section>
    </main>
  );
}
