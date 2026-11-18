"use client";

import { usePathname } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { helpByLevel } from "@/content/raven-fallback/entries";
import { LEVELS, type Level } from "@/lib/journey";
import { hasSensitiveText, MAX_QUESTION_LENGTH, omitPublicAddresses, SENSITIVE_NOTICE, TESTNET_REMINDER, type RavenAnswer } from "@/lib/raven/shared";
import { Icon } from "./Icon";

type PanelMode = RavenAnswer["modo"] | "configured";
type Message = { kind: "user"; text: string } | { kind: "raven"; answer: RavenAnswer };
type ChatActions = { open: (level?: Level) => void; setLevel: (level: Level) => void };

const RavenContext = createContext<ChatActions | null>(null);
const modeLabels: Record<PanelMode, string> = {
  live: "Raven en vivo",
  configured: "Raven en vivo al consultar",
  fallback: "Respuestas de ayuda preparadas con contenido de Raven",
};

export function RavenProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [shown, setShown] = useState(false);
  const [level, setLevel] = useState<Level>(1);
  const [mode, setMode] = useState<PanelMode>("fallback");
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const panel = useRef<HTMLDialogElement>(null);
  const end = useRef<HTMLDivElement>(null);
  const active = useRef(false);
  const answered = useRef(false);
  const fetchedMode = useRef(false);
  const contextLevel = pathname === "/viaje" ? level : 1;

  const open = useCallback((fromLevel?: Level) => {
    if (fromLevel) setLevel(fromLevel);
    setShown(true);
  }, []);

  useEffect(() => {
    const dialog = panel.current;
    if (!dialog) return;
    if (shown && !dialog.open) dialog.showModal();
    else if (!shown && dialog.open) dialog.close();
  }, [shown]);

  useEffect(() => {
    if (!shown || fetchedMode.current) return;
    fetchedMode.current = true;
    void fetch("/api/raven", { cache: "no-store" }).then(async (response) => {
      if (!response.ok) return;
      const data = await response.json() as { modo?: PanelMode };
      if (!active.current && !answered.current && (data.modo === "configured" || data.modo === "fallback")) {
        setMode(data.modo);
      }
    }).catch(() => undefined);
  }, [shown]);

  useEffect(() => {
    if (shown && messages.length) end.current?.scrollIntoView({ block: "end" });
  }, [shown, messages, busy]);

  async function ask(input: string) {
    if (active.current) return;
    const question = input.trim();
    if (!question) return;
    if (question.length > MAX_QUESTION_LENGTH) {
      setError(`La pregunta puede tener hasta ${MAX_QUESTION_LENGTH} caracteres.`);
      return;
    }
    if (hasSensitiveText(question)) {
      setError(SENSITIVE_NOTICE);
      return;
    }

    active.current = true;
    const safeQuestion = omitPublicAddresses(question);
    setMessages((current) => [...current, { kind: "user", text: safeQuestion }]);
    setBusy(true);
    setDraft("");
    setError("");
    try {
      const response = await fetch("/api/raven", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pregunta: safeQuestion, nivel: contextLevel }),
        signal: AbortSignal.timeout(55000),
      });
      const result = await response.json() as RavenAnswer & { error?: string };
      if (!response.ok) {
        setError(result.error ?? "No pudimos consultar a Raven. Intentá de nuevo.");
        setDraft(safeQuestion);
        return;
      }
      if (typeof result.respuesta !== "string" || !Array.isArray(result.fuentes) ||
          (result.modo !== "live" && result.modo !== "fallback")) {
        throw new Error("Respuesta de ayuda incompleta");
      }

      const answer = answered.current
        ? result
        : { ...result, respuesta: TESTNET_REMINDER + "\n\n" + result.respuesta };
      answered.current = true;
      setMode(answer.modo);
      setMessages((current) => [...current, { kind: "raven", answer }]);
    } catch {
      setError("Se interrumpió la consulta. Podés volver a enviar tu pregunta.");
      setDraft(safeQuestion);
    } finally {
      active.current = false;
      setBusy(false);
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void ask(draft);
  }

  return (
    <RavenContext.Provider value={{ open, setLevel }}>
      {children}
      <button type="button" className="raven-launch" onClick={() => open()} aria-label="Abrir asistente Raven" aria-haspopup="dialog" aria-expanded={shown}>
        <Icon name="raven" width="24" height="24"/><span>Raven</span>
      </button>

      <dialog className="raven-panel" ref={panel} aria-labelledby="raven-title" aria-describedby="raven-mode" onClose={() => setShown(false)}>
        <div className="raven-head">
          <span className="raven-avatar"><Icon name="raven" width="28" height="28"/></span>
          <div><h2 id="raven-title">Pregúntale a Raven</h2><p id="raven-mode"><span className={`mode-dot mode-${mode}`}/>{modeLabels[mode]}</p></div>
          <button className="icon-button" autoFocus type="button" aria-label="Cerrar asistente Raven" onClick={() => setShown(false)}><Icon name="close"/></button>
        </div>

        <div className="raven-transcript" role="log" aria-label="Conversación con Raven" aria-live="polite" aria-relevant="additions text">
          {!messages.length && <p className="raven-message raven-assistant">Hola, te acompaño con dudas sobre Stellar. {TESTNET_REMINDER}</p>}
          {messages.map((message, index) => (
            message.kind === "user"
              ? <p className="raven-message raven-user" key={index}>{message.text}</p>
              : <div className="raven-message raven-assistant" key={index}>
                <p>{message.answer.respuesta}</p>
                {message.answer.fuentes.length > 0 && (
                  <ul aria-label="Fuentes">
                    {message.answer.fuentes.map((source, i) => <li key={source.url}><a href={source.url} target="_blank" rel="noreferrer">{i + 1}. {source.titulo}<Icon name="external" width="13" height="13"/></a></li>)}
                  </ul>
                )}
              </div>
          ))}
          {busy && <p className="raven-message raven-assistant" role="status">Preparando respuesta…</p>}
          <div ref={end}/>
        </div>

        <div className="raven-actions">
          <p className="raven-level">Nivel {contextLevel} · {LEVELS[contextLevel - 1].name}</p>
          <div className="raven-suggestions">
            {helpByLevel[contextLevel].map(({ pregunta }) => <button type="button" key={pregunta} onClick={() => void ask(pregunta)} disabled={busy}>{pregunta}</button>)}
          </div>
          {error && <p className="raven-error" role="alert">{error}</p>}
          <form onSubmit={submit} className="raven-form">
            <label htmlFor="raven-question" className="sr-only">Tu pregunta para Raven</label>
            <input id="raven-question" value={draft} maxLength={MAX_QUESTION_LENGTH} onChange={(event) => setDraft(event.target.value)} placeholder="Escribí tu pregunta…" aria-describedby="raven-help"/>
            <button type="submit" className="button button-primary" aria-label="Enviar pregunta" disabled={busy || !draft.trim()}><Icon name="arrow" width="19" height="19"/></button>
          </form>
          <p id="raven-help">Evitá pegar claves, frases de recuperación o datos personales.</p>
        </div>
      </dialog>
    </RavenContext.Provider>
  );
}

export function useRaven() {
  const context = useContext(RavenContext);
  if (!context) throw new Error("RavenProvider no está activo");
  return context;
}
