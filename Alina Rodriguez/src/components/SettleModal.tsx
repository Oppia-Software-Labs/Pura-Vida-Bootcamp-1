import { Banknote, Check, Link2, RefreshCw } from "lucide-react";
// Cobro / saldo entre DOS personas. Aquí adentro están las opciones de pago:
// con wallet (Stellar), link de cobro o registrar pago en efectivo.
import { useEffect, useState } from "react";
import { formatMoney } from "../lib/currencies";
import { pairState } from "../lib/ledger";
import { convert, getRates, refreshRates, type Rates } from "../lib/rates";
import { buildPayLink } from "../lib/router";
import { actions, ME, newMemo, person, personName, useAppState } from "../lib/store";
import { checkPendingPayments, explorerTx, isValidAddress, payXlm, shortAddr, useWallet } from "../lib/stellar";
import { ConnectWalletButton, copy, Modal, Money, StatusBadge, toast, WalletPayButton } from "./ui";

type Props = { scope: string; currency: string; a: string; b: string; title?: string; onClose: () => void };

export function SettleModal({ scope, currency, a, b, title, onClose }: Props) {
  const s = useAppState();
  const w = useWallet();
  const [rates, setRates] = useState<Rates>(getRates());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addr, setAddr] = useState("");
  const [confirmCash, setConfirmCash] = useState(false);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    refreshRates().then(setRates);
  }, []);

  // Orientamos la vista para que "tú" siempre seas `a` si participas.
  const [x, y] = b === ME ? [b, a] : [a, b];
  const ps = pairState(s, scope, currency, x, y);
  const owes = ps.net > 0 ? { from: y, to: x } : { from: x, to: y };
  const amount = Math.abs(ps.net);
  const fromName = personName(s, owes.from);
  const toName = personName(s, owes.to);
  const toPerson = person(s, owes.to);
  const toAddress = owes.to === ME ? w.address ?? toPerson?.address : toPerson?.address;
  const xlm = convert(amount, currency, "XLM", rates);
  const xlmStr = Number.isFinite(xlm) ? xlm.toFixed(7).replace(/\.?0+$/, "") : "";
  const otherId = x === ME ? y : x;
  const pending = ps.pending;

  const headline =
    amount === 0
      ? "Están a mano"
      : owes.from === ME
        ? `Le debes ${formatMoney(amount, currency)} a ${toName}`
        : owes.to === ME
          ? `${fromName} te debe ${formatMoney(amount, currency)}`
          : `${fromName} le debe ${formatMoney(amount, currency)} a ${toName}`;

  const base = { scope, currency, expenseIds: ps.items.map((i) => i.expense.id) };

  async function payNow() {
    if (!toAddress) return;
    setBusy(true);
    setError(null);
    try {
      const memo = newMemo();
      const hash = await payXlm({ to: toAddress, amount: xlm.toFixed(7), memo });
      actions.addSettlement({ ...base, fromId: owes.from, toId: owes.to, amount, method: "stellar", status: "paid", memo, txHash: hash, xlmAmount: xlm.toFixed(7), paidAt: Date.now() });
      toast("Pago enviado");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  function createLink() {
    const memo = newMemo();
    const st = actions.addSettlement({ ...base, fromId: owes.from, toId: owes.to, amount, method: "stellar", status: "pending", memo });
    copyLink(st.memo!, st.amount);
  }

  function linkFor(memo: string, amt: number) {
    const desc = ps.items.length === 1 ? ps.items[0].expense.description : `${ps.items.length} gastos`;
    return buildPayLink({
      to: toAddress!,
      toName: owes.to === ME ? s.people.find((p) => p.id === ME)?.name ?? "" : toName,
      fromName: owes.from === ME ? "" : fromName,
      amount: amt,
      currency,
      memo,
      description: title ? `${title} · ${desc}` : desc,
    });
  }

  function copyLink(memo: string, amt: number) {
    copy(linkFor(memo, amt), "Link de cobro copiado");
  }

  function registerCash() {
    if (pending) actions.updateSettlement(pending.id, { method: "cash", status: "paid", paidAt: Date.now(), memo: undefined });
    else actions.addSettlement({ ...base, fromId: owes.from, toId: owes.to, amount, method: "cash", status: "paid", paidAt: Date.now() });
    setConfirmCash(false);
    toast("Pago en efectivo registrado");
  }

  async function verify() {
    setChecking(true);
    const n = await checkPendingPayments();
    setChecking(false);
    toast(n ? "Pago encontrado en Stellar" : "Todavía no vemos el pago en la blockchain");
  }

  const pendingFrom = pending ? personName(s, pending.fromId) : "";

  return (
    <Modal title={title ?? `Cuentas con ${personName(s, otherId)}`} onClose={onClose}>
      <div className="stack">
        <div className="tile solid">
          <p className="muted small">Entre {personName(s, x)} y {personName(s, y)}</p>
          <p className="mid-num" style={{ marginTop: 4 }}>{pending ? (pending.fromId === ME ? `Debes ${formatMoney(pending.amount, currency)}` : `${pendingFrom} debe ${formatMoney(pending.amount, currency)}`) : headline}</p>
          {(pending ? pending.amount : amount) > 0 && currency !== "XLM" && (
            <p className="small muted">≈ {formatMoney(convert(pending ? pending.amount : amount, currency, "XLM", rates), "XLM")} al precio de hoy{!rates.live && " (aprox.)"}</p>
          )}
        </div>

        {/* Desglose: el porqué de cada monto */}
        {ps.items.length > 0 && (
          <div className="tile flush">
            <div className="item" style={{ cursor: "default" }}>
              <span className="eyebrow grow">Detalle de cada gasto</span>
            </div>
            {ps.items.map((i) => {
              const yOwesX = i.amount > 0;
              return (
                <div key={i.expense.id} className="item" style={{ cursor: "default" }}>
                  <div className="grow">
                    <p className="bold">{i.expense.description}</p>
                    <p className="small muted">
                      {i.expense.date} · {yOwesX ? `${personName(s, y)} → ${personName(s, x)}` : `${personName(s, x)} → ${personName(s, y)}`}
                    </p>
                  </div>
                  <span className="bold"><Money amount={Math.abs(i.amount)} currency={currency} /></span>
                </div>
              );
            })}
            {ps.items.length > 1 && (
              <div className="item" style={{ cursor: "default", background: "rgba(255,255,255,.5)" }}>
                <span className="grow bold">Total compensado entre ustedes dos</span>
                <span className="bold"><Money amount={amount} currency={currency} /></span>
              </div>
            )}
          </div>
        )}

        {error && <div className="alert error">{error}</div>}

        {/* Cobro abierto, esperando pago */}
        {pending && (
          <div className="tile solid stack">
            <div className="spread">
              <span className="bold">Cobro enviado</span>
              <StatusBadge paid={false} />
            </div>
            <p className="small muted">
              Esperando que {pendingFrom} pague {formatMoney(pending.amount, currency)} con el memo <span className="mono">{pending.memo}</span>.
            </p>
            {toAddress && <button className="btn soft block" onClick={() => copyLink(pending.memo!, pending.amount)}><Link2 size={17} aria-hidden /> Copiar link de cobro otra vez</button>}
            <button className="btn soft block" onClick={verify} disabled={checking}><RefreshCw size={17} aria-hidden /> {checking ? "Buscando…" : "Verificar pago en Stellar"}</button>
            {!confirmCash ? (
              <button className="btn soft block" onClick={() => setConfirmCash(true)}><Banknote size={17} aria-hidden /> Registrar pago en efectivo</button>
            ) : (
              <CashConfirm who={pendingFrom} amount={formatMoney(pending.amount, currency)} onYes={registerCash} onNo={() => setConfirmCash(false)} />
            )}
            <button className="btn danger sm" onClick={() => actions.deleteSettlement(pending.id)}>Cancelar cobro</button>
          </div>
        )}

        {/* Opciones de pago */}
        {!pending && ps.items.length > 0 && amount === 0 && (
          <div className="tile solid stack">
            <p className="small">Lo que se deben se cancela entre ustedes: no hace falta que nadie pague.</p>
            <button className="btn block" onClick={() => actions.addSettlement({ ...base, fromId: x, toId: y, amount: 0, method: "compensado", status: "paid", paidAt: Date.now() })}>
              <Check size={17} aria-hidden /> Marcar como saldado
            </button>
          </div>
        )}

        {!pending && amount > 0 && (
          <div className="tile solid stack">
            {owes.from === ME && (
              <>
                <p className="eyebrow">Pagar con Stellar</p>
                {toAddress ? (
                  <>
                    <p className="small muted">Se envían <b>{xlmStr} XLM</b> a {toName} ({shortAddr(toAddress)}) en Testnet.</p>
                    <WalletPayButton label={`Pagar ${xlmStr} XLM`} onPay={payNow} busy={busy} disabled={!xlmStr} />
                  </>
                ) : (
                  <AddAddress name={toName} addr={addr} setAddr={setAddr} onSave={() => actions.updatePerson(owes.to, { address: addr.trim() })} />
                )}
              </>
            )}
            {owes.from !== ME && (
              <>
                <p className="eyebrow">Cobrar con Stellar</p>
                {toAddress ? (
                  <>
                    <p className="small muted">Genera un link para que {fromName} pague desde su wallet. Lo detectamos solos cuando llegue el pago.</p>
                    <button className="btn block" onClick={createLink}><Link2 size={17} aria-hidden /> Crear y copiar link de cobro</button>
                  </>
                ) : owes.to === ME ? (
                  <>
                    <p className="small muted">Para cobrar por Stellar necesitas conectar tu wallet.</p>
                    <ConnectWalletButton block />
                  </>
                ) : (
                  <AddAddress name={toName} addr={addr} setAddr={setAddr} onSave={() => actions.updatePerson(owes.to, { address: addr.trim() })} />
                )}
              </>
            )}
            <div className="divider" />
            {!confirmCash ? (
              <button className="btn soft block" onClick={() => setConfirmCash(true)}><Banknote size={17} aria-hidden /> Registrar pago en efectivo</button>
            ) : (
              <CashConfirm who={fromName} amount={formatMoney(amount, currency)} onYes={registerCash} onNo={() => setConfirmCash(false)} />
            )}
          </div>
        )}

        {ps.items.length === 0 && !pending && (
          <div className="alert ok">No hay nada pendiente entre {personName(s, x)} y {personName(s, y)}.</div>
        )}

        {/* Historial */}
        {ps.history.length > 0 && (
          <div className="tile flush">
            <div className="item" style={{ cursor: "default" }}>
              <span className="eyebrow grow">Pagos anteriores</span>
            </div>
            {ps.history.map((h) => (
              <div key={h.id} className="item" style={{ cursor: "default" }}>
                <div className="grow">
                  <p className="bold">
                    {h.method === "compensado" ? "Saldado (se compensó)" : `${personName(s, h.fromId)} → ${personName(s, h.toId)}`}
                  </p>
                  <p className="small muted">
                    {new Date(h.paidAt ?? h.createdAt).toLocaleDateString("es-CR")} · {h.method === "stellar" ? "Stellar" : h.method === "cash" ? "Efectivo" : "Compensado"} · {h.expenseIds.length} gasto(s)
                    {h.txHash && (
                      <> · <a href={explorerTx(h.txHash)} target="_blank" rel="noreferrer">ver transacción</a></>
                    )}
                  </p>
                </div>
                <div className="stack right" style={{ gap: 4 }}>
                  <span className="bold"><Money amount={h.amount} currency={h.currency} /></span>
                  <StatusBadge paid />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}

function CashConfirm({ who, amount, onYes, onNo }: { who: string; amount: string; onYes: () => void; onNo: () => void }) {
  return (
    <div className="alert info stack" style={{ gap: 10 }}>
      <p>¿Confirmas que {who === "Tú" ? "pagaste" : `${who} pagó`} <b>{amount}</b> en efectivo?</p>
      <div className="row">
        <button className="btn sm" onClick={onYes}>Sí, confirmar</button>
        <button className="btn soft sm" onClick={onNo}>No</button>
      </div>
    </div>
  );
}

function AddAddress({ name, addr, setAddr, onSave }: { name: string; addr: string; setAddr: (v: string) => void; onSave: () => void }) {
  const ok = isValidAddress(addr);
  return (
    <div className="stack" style={{ gap: 8 }}>
      <p className="small muted">{name} todavía no tiene una wallet registrada. Agrega su dirección para poder pagar por aquí, o registra el pago en efectivo.</p>
      <label className="field">
        Dirección pública de la wallet Stellar de {name}
        <input className="input mono" placeholder="Empieza con G y tiene 56 caracteres" value={addr} onChange={(e) => setAddr(e.target.value)} />
      </label>
      <p className="tiny muted">Pídele a {name} que la copie desde su wallet (en la opción «Recibir»).</p>
      {addr.trim() !== "" && !ok && <p className="small neg">Esa dirección no parece válida: debe empezar con G y tener 56 caracteres.</p>}
      <button className="btn soft sm" disabled={!ok} onClick={onSave}>Guardar wallet de {name}</button>
    </div>
  );
}
