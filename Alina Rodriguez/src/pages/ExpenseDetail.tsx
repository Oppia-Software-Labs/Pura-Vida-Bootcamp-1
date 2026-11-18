import { ArrowLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { debtStatus, expenseDebts } from "../lib/ledger";
import { navigate } from "../lib/router";
import { actions, personName, scopeOf, useAppState } from "../lib/store";
import { SettleModal } from "../components/SettleModal";
import { Avatar, Money, StatusBadge } from "../components/ui";

const METHOD_LABEL = { equal: "Partes iguales", exact: "Montos exactos", percent: "Porcentaje", shares: "Shares" } as const;

export function ExpenseDetail({ id }: { id: string }) {
  const s = useAppState();
  const e = s.expenses.find((x) => x.id === id);
  const [open, setOpen] = useState<{ from: string; to: string } | null>(null);
  if (!e) return <div className="tile empty">Este gasto no existe.</div>;

  const group = e.groupId ? s.groups.find((g) => g.id === e.groupId) : undefined;
  const debts = expenseDebts(e);
  const scope = scopeOf(e);
  const locked = s.settlements.some((x) => x.scope === scope && x.expenseIds.includes(e.id));
  const allPaid = debts.length > 0 && debts.every((d) => debtStatus(s, e, d.from, d.to) === "pagado");

  return (
    <div className="stack narrow">
      <div className="page-head">
        <div>
          <a href={group ? `#/grupos/${group.id}` : "#/cuentas"} className="back"><ArrowLeft size={16} aria-hidden /> {group ? group.name : "Cuentas sueltas"}</a>
          <h1 style={{ marginTop: 4 }}>{e.description}</h1>
          <p className="muted small">{e.date} · {METHOD_LABEL[e.method]}</p>
        </div>
        <div className="stack right" style={{ gap: 6 }}>
          <span className="mid-num"><Money amount={e.total} currency={e.currency} /></span>
          <StatusBadge paid={allPaid} />
        </div>
      </div>

      <div className="tile solid">
        <p className="eyebrow" style={{ marginBottom: 10 }}>Pagó</p>
        <div className="stack" style={{ gap: 8 }}>
          {e.payers.map((p) => (
            <div key={p.personId} className="row">
              <Avatar name={personName(s, p.personId)} id={p.personId} />
              <span className="grow">{personName(s, p.personId)}</span>
              <span className="bold"><Money amount={p.amount} currency={e.currency} /></span>
            </div>
          ))}
        </div>
      </div>

      <div className="tile solid">
        <p className="eyebrow" style={{ marginBottom: 10 }}>Le toca a cada quien</p>
        <div className="stack" style={{ gap: 8 }}>
          {e.owed.map((o) => (
            <div key={o.personId} className="row">
              <Avatar name={personName(s, o.personId)} id={o.personId} />
              <span className="grow">
                {personName(s, o.personId)}
                {e.method === "percent" && <span className="muted small"> · {e.inputs[o.personId]}%</span>}
                {e.method === "shares" && <span className="muted small"> · {e.inputs[o.personId]} parte(s)</span>}
              </span>
              <Money amount={o.amount} currency={e.currency} />
            </div>
          ))}
        </div>
        {group && e.currency !== group.currency && (
          <p className="small muted" style={{ marginTop: 10 }}>
            Tipo de cambio guardado: 1 {e.currency} = {e.rateToBase.toLocaleString("es-CR", { maximumFractionDigits: 6 })} {group.currency}
          </p>
        )}
      </div>

      <div className="tile flush">
        <div className="item" style={{ cursor: "default" }}>
          <span className="grow bold">Cobros</span>
          <span className="small muted">Toca uno para pagar o registrar efectivo</span>
        </div>
        {debts.length === 0 && <div className="empty">Nadie le debe a nadie en este gasto.</div>}
        {debts.map((d) => {
          const st = debtStatus(s, e, d.from, d.to);
          return (
            <button key={`${d.from}-${d.to}`} className="item" onClick={() => setOpen(d)}>
              <Avatar name={personName(s, d.from)} id={d.from} />
              <div className="grow">
                <p className="bold">{personName(s, d.from)} → {personName(s, d.to)}</p>
                <p className="small muted"><Money amount={d.amount} currency={e.currency} /></p>
              </div>
              <StatusBadge paid={st === "pagado"} />
              <ChevronRight size={18} className="muted" aria-hidden />
            </button>
          );
        })}
      </div>

      {group && (
        <p className="small muted">
          En grupos, cada cobro se paga junto con los demás gastos entre esas dos personas (se compensan solo entre ellas dos).
        </p>
      )}

      {!locked && (
        <button
          className="btn danger"
          onClick={() => {
            if (confirm("¿Eliminar este gasto?")) {
              actions.deleteExpense(e.id);
              navigate(group ? `/grupos/${group.id}` : "/cuentas");
            }
          }}
        >
          Eliminar gasto
        </button>
      )}

      {open && (
        <SettleModal
          scope={scope}
          currency={e.baseCurrency}
          a={open.to}
          b={open.from}
          title={group ? undefined : e.description}
          onClose={() => setOpen(null)}
        />
      )}
    </div>
  );
}
