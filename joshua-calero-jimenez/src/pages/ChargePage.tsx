import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import QrCode from "../components/QrCode";
import StatusOrb from "../components/StatusOrb";
import { Button, Facts, Notice, Panel, TextButton } from "../components/ui";
import { EXPLORER_TX } from "../lib/config";
import { buildPayLink, buildSep7Uri } from "../lib/links";
import { useCharges } from "../lib/storage";
import { shortAddress } from "../lib/validation";
import { useWatching } from "../lib/watcher";

async function copy(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

export default function ChargePage() {
  const { id } = useParams();
  const charge = useCharges().find((c) => c.id === id);
  const watching = useWatching();
  const [copied, setCopied] = useState<"link" | "sep7" | null>(null);

  if (!charge) {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 pb-24 pt-20">
        <Notice tone="danger">
          No encontramos este cobro. Los cobros se guardan solo en el navegador donde los creaste.
        </Notice>
        <Link to="/" className="mt-6 inline-block text-sm text-accent underline underline-offset-4">
          Volver al inicio
        </Link>
      </div>
    );
  }

  const paid = charge.status === "paid";
  const req = { to: charge.to, amount: charge.amount, memo: charge.memo, label: charge.label, desc: charge.desc };
  const link = buildPayLink(req);
  const live = watching.includes(charge.to);

  const doCopy = async (what: "link" | "sep7") => {
    if (await copy(what === "link" ? link : buildSep7Uri(req))) {
      setCopied(what);
      setTimeout(() => setCopied(null), 1800);
    }
  };
  const canShare = "share" in navigator;
  const share = () =>
    navigator
      .share({ title: charge.label || charge.memo, text: `Cobro de ${charge.amount} XLM`, url: link })
      .catch(() => {
        /* el usuario cerró el menú de compartir */
      });

  const rows: [string, React.ReactNode][] = [
    ["Concepto", charge.memo],
    ...(charge.desc ? ([["Descripción", charge.desc]] as [string, React.ReactNode][]) : []),
    ["Destino", <span className="font-mono" title={charge.to}>{shortAddress(charge.to)}</span>],
  ];
  if (paid && charge.payer)
    rows.push(["Pagó", <span className="font-mono" title={charge.payer}>{shortAddress(charge.payer)}</span>]);
  if (paid && charge.hash)
    rows.push([
      "Transacción",
      <a href={`${EXPLORER_TX}${charge.hash}`} target="_blank" rel="noreferrer" className="font-mono text-accent">
        {shortAddress(charge.hash)}
      </a>,
    ]);

  return (
    <div className="mx-auto w-full max-w-4xl px-4 pb-24 pt-12">
      <Link to="/" className="text-sm text-muted hover:text-ink">
        ← Tus cobros
      </Link>

      <div className="mt-10 grid gap-12 md:grid-cols-[1fr_1.3fr] md:gap-10">
        <div className="text-center md:pt-6">
          <StatusOrb paid={paid} />
          <p className="mt-8 font-display text-2xl font-light">{paid ? "Pago recibido" : "Esperando pago"}</p>
          <p className="mx-auto mt-3 max-w-xs text-sm leading-relaxed text-muted">
            {paid
              ? "El pago ya está en tu cuenta."
              : live
                ? "Escuchando la red. Esta pantalla cambia sola cuando llegue el pago."
                : "Conectando con la red…"}
          </p>
        </div>

        <Panel>
          <p className="text-sm text-muted">{charge.label || "Cobro"}</p>
          <p className="mt-1 font-display text-4xl font-light tracking-tight">
            {charge.amount} <span className="text-base text-muted">XLM</span>
          </p>
          <div className="mt-6">
            <Facts rows={rows} />
          </div>

          {!paid && (
            <div className="mt-8 flex flex-col gap-6 sm:flex-row sm:items-start">
              <QrCode value={link} size={168} />
              <div className="min-w-0 flex-1 space-y-4">
                <p className="break-all text-xs leading-relaxed text-muted">{link}</p>
                <div className="flex flex-wrap gap-3">
                  <Button onClick={() => void doCopy("link")}>{copied === "link" ? "Copiado" : "Copiar link"}</Button>
                  {canShare && (
                    <Button variant="secondary" onClick={share}>
                      Compartir
                    </Button>
                  )}
                </div>
                <TextButton onClick={() => void doCopy("sep7")}>
                  {copied === "sep7" ? "URI SEP-7 copiado" : "Copiar URI SEP-7"}
                </TextButton>
              </div>
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}
