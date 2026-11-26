import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import StatusOrb from "../components/StatusOrb";
import { Button, Facts, Notice, Panel, TextButton } from "../components/ui";
import { EXPLORER_TX } from "../lib/config";
import {
  accountExists,
  buildPaymentXdr,
  explainError,
  fundWithFriendbot,
  getAccountInfo,
  getBaseFee,
  submitSignedXdr,
  type AccountInfo,
} from "../lib/horizon";
import { parsePayParams } from "../lib/links";
import { formatXlm, shortAddress, toStroops } from "../lib/validation";
import { useWallet } from "../lib/wallet";

type Phase = "idle" | "building" | "signing" | "sending" | "done";

interface Checks {
  payer: AccountInfo;
  destExists: boolean;
  fee: number; // stroops
}

const PHASE_TEXT: Record<Phase, string> = {
  idle: "Pagar",
  building: "Preparando…",
  signing: "Firma en tu wallet…",
  sending: "Enviando…",
  done: "Pagado",
};

export default function PayPage() {
  const { search } = useLocation();
  const parsed = useMemo(() => parsePayParams(search), [search]);
  const { address, connect, connecting, onTestnet, signTransaction } = useWallet();

  const [checks, setChecks] = useState<Checks | null>(null);
  const [checksError, setChecksError] = useState<string | null>(null);
  const [reloadTick, setReloadTick] = useState(0);
  const [phase, setPhase] = useState<Phase>("idle");
  const [payError, setPayError] = useState<string | null>(null);
  const [hash, setHash] = useState<string | null>(null);
  const [funding, setFunding] = useState(false);

  const request = parsed.ok ? parsed.request : null;
  const destination = request?.to;

  useEffect(() => {
    if (!address || !destination) {
      setChecks(null);
      return;
    }
    let alive = true;
    setChecksError(null);
    Promise.all([getAccountInfo(address), accountExists(destination), getBaseFee()])
      .then(([payer, destExists, fee]) => alive && setChecks({ payer, destExists, fee }))
      .catch((e) => alive && setChecksError(explainError(e)));
    return () => {
      alive = false;
    };
  }, [address, destination, reloadTick]);

  if (!request) {
    return (
      <div className="mx-auto w-full max-w-xl px-4 pb-24 pt-20">
        <Notice tone="danger">{parsed.ok ? "" : parsed.error}</Notice>
        <p className="mt-6 text-sm text-muted">Pide a quien te cobra que genere el link de nuevo.</p>
      </div>
    );
  }

  const amount = toStroops(request.amount);
  const needed = checks ? amount + BigInt(checks.fee) : amount;

  // Todo lo que impide pagar, en orden de importancia.
  const problems: string[] = [];
  if (address && onTestnet === false) problems.push("Tu wallet está en otra red. Cámbiala a Testnet para pagar.");
  if (address && address === request.to) problems.push("Esta es la cuenta que cobra: no puedes pagarte a ti mismo.");
  if (checks) {
    if (!checks.destExists) problems.push("La cuenta destino no existe en Testnet, así que el pago fallaría.");
    if (!checks.payer.exists) problems.push("Tu cuenta no está activada en Testnet.");
    else if (checks.payer.spendable < needed)
      problems.push(
        `Saldo insuficiente. Necesitas ${formatXlm(needed)} XLM con la comisión y puedes gastar ${formatXlm(checks.payer.spendable)} XLM (la reserva mínima de ${formatXlm(checks.payer.reserve)} XLM no se puede usar).`,
      );
  }

  const pay = async () => {
    if (!address || !checks || problems.length) return;
    setPayError(null);
    try {
      setPhase("building");
      const xdr = await buildPaymentXdr(address, request, checks.fee);
      setPhase("signing");
      const signed = await signTransaction(xdr);
      setPhase("sending");
      setHash(await submitSignedXdr(signed));
      setPhase("done");
    } catch (e) {
      setPayError(explainError(e));
      setPhase("idle");
    }
  };

  const fund = async () => {
    if (!address) return;
    setFunding(true);
    try {
      await fundWithFriendbot(address);
      setReloadTick((t) => t + 1);
    } catch (e) {
      setPayError(explainError(e));
    } finally {
      setFunding(false);
    }
  };

  if (phase === "done" && hash) {
    return (
      <div className="mx-auto w-full max-w-xl px-4 pb-24 pt-16 text-center">
        <StatusOrb paid />
        <h1 className="mt-8 font-display text-2xl font-light">Pago enviado</h1>
        <p className="mt-3 text-muted">
          {request.amount} XLM a {shortAddress(request.to)} por “{request.memo}”.
        </p>
        <p className="mt-8 break-all font-mono text-xs text-muted">{hash}</p>
        <a
          href={`${EXPLORER_TX}${hash}`}
          target="_blank"
          rel="noreferrer"
          className="mt-4 inline-block text-sm text-accent underline underline-offset-4"
        >
          Ver comprobante en Stellar Expert
        </a>
      </div>
    );
  }

  const busy = phase !== "idle";

  return (
    <div className="mx-auto w-full max-w-xl px-4 pb-24 pt-16">
      <Panel>
        <p className="text-sm text-muted">{request.label || "Te están cobrando"}</p>
        <p className="mt-1 font-display text-5xl font-light tracking-tight">
          {request.amount} <span className="text-base text-muted">XLM</span>
        </p>
        {request.desc && <p className="mt-4 leading-relaxed text-muted">{request.desc}</p>}

        <div className="mt-8">
          <Facts
            rows={[
              ["Le pagas a", <span className="font-mono" title={request.to}>{shortAddress(request.to)}</span>],
              ["Concepto", request.memo],
              ["Comisión estimada", checks ? `${formatXlm(BigInt(checks.fee))} XLM` : "Al conectar tu wallet"],
            ]}
          />
        </div>

        <div className="mt-8 space-y-4">
          {checksError && (
            <Notice tone="danger">
              {checksError}{" "}
              <button onClick={() => setReloadTick((t) => t + 1)} className="ml-1 underline underline-offset-4">
                Reintentar
              </button>
            </Notice>
          )}
          {problems.map((p) => (
            <Notice key={p}>{p}</Notice>
          ))}
          {checks && !checks.payer.exists && (
            <TextButton onClick={() => void fund()} disabled={funding}>
              {funding ? "Fondeando…" : "Fondear mi cuenta con Friendbot"}
            </TextButton>
          )}
          {payError && <Notice tone="danger">{payError}</Notice>}

          {!address ? (
            <Button onClick={() => void connect()} disabled={connecting} className="w-full">
              Conectar wallet para pagar
            </Button>
          ) : (
            <Button onClick={() => void pay()} disabled={busy || !checks || problems.length > 0} className="w-full">
              {phase === "idle" ? `Pagar ${request.amount} XLM` : PHASE_TEXT[phase]}
            </Button>
          )}
        </div>
      </Panel>
    </div>
  );
}
