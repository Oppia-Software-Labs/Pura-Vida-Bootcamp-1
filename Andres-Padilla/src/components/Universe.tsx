"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Engine } from "@/three/engine";
import { CHAPTERS } from "@/story/chapters";
import { useToyChain } from "@/story/useToyChain";
import ChapterPanel, { ChapterProgress } from "./ChapterPanel";
import BlockchainLab from "./BlockchainLab";
import NetworkLab from "./NetworkLab";
import { NODE_COUNT } from "@/story/validators";
import { useBalance, useWallet } from "@/wallet/useWallet";
import { AccountStep, ReserveStep } from "./WalletSteps";
import TransactionStep, { type SentTx } from "./TransactionStep";
import LedgerStep from "./LedgerStep";
import { useLatestLedger } from "@/wallet/useLatestLedger";
import styles from "./Universe.module.css";

export default function Universe() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [engine, setEngine] = useState<Engine | null>(null);
  const [ready, setReady] = useState(false);
  const [piloting, setPiloting] = useState(false);
  const [speed, setSpeed] = useState(0);
  const [turbo, setTurbo] = useState(false);
  const [chapter, setChapter] = useState(0);
  // Hasta que se navega por primera vez, el panel pulsa para indicar dónde empezar
  const [started, setStarted] = useState(false);
  // El motor tarda en cargar: al arrancar vuela al capítulo en el que ya esté la interfaz
  const chapterRef = useRef(0);
  useEffect(() => {
    chapterRef.current = chapter;
  }, [chapter]);

  useEffect(() => {
    let disposed = false;
    let instance: Engine | null = null;
    // Three.js solo existe en el navegador: se carga aquí y no en el servidor
    import("@/three/engine").then(({ Engine }) => {
      if (disposed || !containerRef.current) return;
      instance = new Engine(containerRef.current, {
        onPilotChange: setPiloting,
        onSpeed: (v, t) => {
          setSpeed(v);
          setTurbo(t);
        },
      });
      setEngine(instance);
      requestAnimationFrame(() => setReady(true));
    });
    return () => {
      disposed = true;
      instance?.dispose();
      setEngine(null);
    };
  }, []);

  // Vuelo de entrada, hacia el capítulo actual (normalmente el inicio)
  useEffect(() => {
    engine?.setView(CHAPTERS[chapterRef.current].view, 4);
  }, [engine]);

  const chain = useToyChain(engine);
  const chapterId = CHAPTERS[chapter].id;

  // Red de validadores (capítulo 2)
  const [nodesActive, setNodesActive] = useState<boolean[]>(() => Array(NODE_COUNT).fill(true));
  const [selectedNode, setSelectedNode] = useState<number | null>(null);
  const [ledgers, setLedgers] = useState(0);

  const toggleNode = useCallback((i: number) => {
    setSelectedNode(i);
    setNodesActive((prev) => prev.map((on, k) => (k === i ? !on : on)));
  }, []);

  useEffect(() => {
    engine?.network.setActive(nodesActive);
  }, [engine, nodesActive]);

  useEffect(() => {
    engine?.network.setSelected(selectedNode);
  }, [engine, selectedNode]);

  useEffect(() => {
    if (!engine) return;
    engine.setLedgerListener(() => setLedgers((n) => n + 1));
    return () => engine.setLedgerListener(null);
  }, [engine]);

  // Tu wallet y tu estrella (capítulos 3 a 5)
  const wallet = useWallet();
  const balance = useBalance(wallet.address);
  useEffect(() => {
    if (!engine) return;
    const b = balance.balance;
    engine.star.setState({
      connected: wallet.connected,
      funded: b === undefined ? undefined : b !== null,
      balance: Number(b ?? 0),
      address: wallet.address,
    });
  }, [engine, wallet.connected, wallet.address, balance.balance]);

  // Si la cuenta ya tenía XLM, al llegar al capítulo 4 se repite la llegada de los
  // fondos (cuando la cámara termina su viaje) para no saltarse la escena
  const alreadyFunded = typeof balance.balance === "string" && !balance.fundedHere;
  useEffect(() => {
    if (!engine || chapterId !== "reserve" || !alreadyFunded) return;
    const id = setTimeout(() => engine.star.replayFunding(), 2800);
    return () => clearTimeout(id);
  }, [engine, chapterId, alreadyFunded]);

  // Destino del pago y última transacción enviada (capítulos 5 y 6)
  const [dest, setDest] = useState("");
  const destBalance = useBalance(dest);
  const [lastTx, setLastTx] = useState<SentTx | null>(null);
  useEffect(() => {
    if (!engine) return;
    const b = destBalance.balance;
    engine.dest.setState({
      connected: dest !== "",
      funded: b === undefined ? undefined : b !== null,
      balance: Number(b ?? 0),
      address: dest,
    });
  }, [engine, dest, destBalance.balance]);

  // Ledgers reales de Testnet (capítulo 6): cada uno nuevo hace destellar la cadena
  const live = useLatestLedger(chapterId === "ledger", () => engine?.ledgerPulse());
  const liveSeq = live.ledger?.sequence;
  useEffect(() => {
    if (!engine) return;
    if (lastTx) engine.chain.setLedgerBlock({ sequence: lastTx.ledger, mine: true });
    else if (liveSeq) engine.chain.setLedgerBlock({ sequence: liveSeq, mine: false });
  }, [engine, lastTx, liveSeq]);

  // Qué se puede pulsar y qué se ve depende del capítulo
  const { setSelected } = chain;
  useEffect(() => {
    if (!engine) return;
    engine.network.setVisible(chapterId === "network");
    if (chapterId === "blockchain") engine.setPickTarget(engine.chain, setSelected);
    else if (chapterId === "network") engine.setPickTarget(engine.network, toggleNode);
    else engine.setPickTarget(null);
  }, [engine, chapterId, setSelected, toggleNode]);

  // Capítulos con una tarea obligatoria: no se puede seguir sin completarla
  const gates: Partial<Record<(typeof CHAPTERS)[number]["id"], { done: boolean; todo: string }>> = {
    account: { done: wallet.connected, todo: "conecta tu wallet Varial." },
    reserve: { done: typeof balance.balance === "string", todo: "tu cuenta necesita fondos." },
    transaction: { done: lastTx !== null, todo: "envía un pago y espera a que se confirme." },
  };
  const firstBlocked = CHAPTERS.findIndex((c) => gates[c.id]?.done === false);
  const maxReachable = firstBlocked === -1 ? CHAPTERS.length - 1 : firstBlocked;

  function goTo(index: number) {
    if (index > maxReachable) return;
    setStarted(true);
    setChapter(index);
    engine?.setView(CHAPTERS[index].view);
  }

  return (
    <div className={styles.root}>
      <div ref={containerRef} className={styles.canvas} />

      <div className={`${styles.loading} ${ready ? styles.hidden : ""}`}>GENERANDO GALAXIA…</div>

      <button
        className={styles.mode}
        onClick={(e) => {
          engine?.togglePiloting();
          e.currentTarget.blur();
        }}
      >
        {piloting ? "Volver al viaje (C)" : "Pilotar nave (C)"}
      </button>

      {piloting ? (
        <>
          <div className={styles.help}>
            <div><b>W / S</b> acelerar / retroceder</div>
            <div><b>A / D</b> girar izquierda / derecha</div>
            <div><b>↑ / ↓</b> subir / bajar el morro</div>
            <div><b>Q / E</b> alabeo (rodar)</div>
            <div><b>Shift</b> turbo</div>
            <div><b>Espacio</b> frenar</div>
            <div><b>F</b> lanzar onda expansiva</div>
            <div><b>C</b> volver al viaje</div>
          </div>
          <div className={styles.hud}>
            <div className={styles.turbo} style={{ visibility: turbo ? "visible" : "hidden" }}>
              TURBO
            </div>
            <div className={styles.num}>{speed}</div>
            <div className={styles.lbl}>VELOCIDAD</div>
          </div>
        </>
      ) : (
        <>
          <ChapterProgress index={chapter} onGo={goTo} maxReachable={maxReachable} />
          {chapter === 0 && (
            <div className={styles.hero}>
              <h1>Stellar</h1>
              <p>Mueve el ratón para perturbar las estrellas · Clic para lanzar una onda · Arrastra para orbitar</p>
            </div>
          )}
          <ChapterPanel
            index={chapter}
            onGo={goTo}
            maxReachable={maxReachable}
            pending={gates[chapterId]?.todo}
            attention={!started && ready}
          >
            {chapterId === "blockchain" && <BlockchainLab chain={chain} />}
            {chapterId === "network" && (
              <NetworkLab
                active={nodesActive}
                selected={selectedNode}
                ledgers={ledgers}
                onToggle={toggleNode}
                onReset={() => setNodesActive(Array(NODE_COUNT).fill(true))}
              />
            )}
            {chapterId === "account" && <AccountStep wallet={wallet} />}
            {chapterId === "reserve" && (
              <ReserveStep
                wallet={wallet}
                balance={balance}
                onReplay={() => engine?.star.replayFunding()}
              />
            )}
            {chapterId === "transaction" && (
              <TransactionStep
                engine={engine}
                wallet={wallet}
                balance={balance}
                dest={dest}
                setDest={setDest}
                destBalance={destBalance}
                lastTx={lastTx}
                onSent={setLastTx}
              />
            )}
            {chapterId === "ledger" && <LedgerStep ledger={live.ledger} error={live.error} lastTx={lastTx} />}
          </ChapterPanel>
        </>
      )}
    </div>
  );
}
