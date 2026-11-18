import { useState } from "react";
import { ArrowLeft, ChevronRight, Pencil, Plus, Trash } from "lucide-react";
import { formatMoney } from "../lib/currencies";
import { expenseStatus, pairState, scopePairs } from "../lib/ledger";
import { navigate } from "../lib/router";
import { actions, ME, personName, useAppState, type Group, type State } from "../lib/store";
import { SettleModal } from "../components/SettleModal";
import { GROUP_ICONS, IconPicker, IconTile } from "../components/icons";
import { Avatar, CurrencySelect, Modal, Money, PeoplePicker, StatusBadge } from "../components/ui";

/** Saldo neto tuyo dentro de un grupo (+ te deben, − debes). */
export function myGroupBalance(s: State, g: Group): number {
  let total = 0;
  if (!g.memberIds.includes(ME)) return 0;
  for (const id of g.memberIds) if (id !== ME) total += pairState(s, g.id, g.currency, ME, id).net;
  return total;
}

export function GroupsPage() {
  const s = useAppState();
  const [creating, setCreating] = useState(window.location.hash.includes("nuevo=1"));
  return (
    <div className="stack">
      <div className="page-head">
        <div>
          <p className="eyebrow">Familia, roomies, viajes</p>
          <h1>Grupos</h1>
        </div>
        <button className="btn" onClick={() => setCreating(true)}><Plus size={18} aria-hidden /> Nuevo grupo</button>
      </div>
      {s.groups.length === 0 ? (
        <div className="tile empty">
          <IconTile name="users" size={52} />
          <p className="bold" style={{ color: "var(--ink)" }}>Todavía no tienes grupos</p>
          <p className="small">Crea uno para registrar gastos en conjunto sin mandar links cada vez.</p>
          <button className="btn" onClick={() => setCreating(true)}><Plus size={18} aria-hidden /> Crear grupo</button>
        </div>
      ) : (
        <div className="bento">
          {s.groups.map((g) => {
            const bal = myGroupBalance(s, g);
            const n = s.expenses.filter((e) => e.groupId === g.id).length;
            return (
              <a key={g.id} className="tile span-4 stack" href={`#/grupos/${g.id}`} style={{ textDecoration: "none", color: "inherit", gap: 16 }}>
                <div className="spread">
                  <IconTile name={g.icon} size={48} />
                  <ChevronRight size={18} className="muted" aria-hidden />
                </div>
                <div>
                  <p className="item-title" style={{ fontSize: "1.05rem" }}>{g.name}</p>
                  <p className="item-sub">{g.memberIds.length} personas · {n} gasto{n === 1 ? "" : "s"}</p>
                </div>
                <div className="spread">
                  <span className="small muted">{bal === 0 ? "Estás a mano" : bal > 0 ? "Te deben" : "Debes"}</span>
                  {bal !== 0 && <span className={`bold ${bal > 0 ? "pos" : "neg"}`}>{formatMoney(Math.abs(bal), g.currency)}</span>}
                </div>
              </a>
            );
          })}
        </div>
      )}
      {creating && <GroupFormModal onClose={() => setCreating(false)} />}
    </div>
  );
}

function GroupFormModal({ onClose, group }: { onClose: () => void; group?: Group }) {
  const [name, setName] = useState(group?.name ?? "");
  const [icon, setIcon] = useState(group?.icon ?? "users");
  const [currency, setCurrency] = useState(group?.currency ?? "CRC");
  const [members, setMembers] = useState<string[]>(group?.memberIds ?? [ME]);
  const valid = name.trim() && members.length >= 2;
  return (
    <Modal title={group ? "Editar grupo" : "Nuevo grupo"} onClose={onClose}>
      <div className="stack">
        <label className="field">Nombre<input className="input" value={name} onChange={(e) => setName(e.target.value)} autoFocus /></label>
        <div className="stack" style={{ gap: 8 }}>
          <p className="eyebrow">Icono</p>
          <IconPicker value={icon} onChange={setIcon} options={GROUP_ICONS} />
        </div>
        {!group && (
          <>
            <label className="field">Moneda principal<CurrencySelect value={currency} onChange={setCurrency} /></label>
            <p className="small muted">Los gastos se pueden registrar en cualquier moneda; los saldos se muestran en esta.</p>
          </>
        )}
        <p className="eyebrow">Miembros</p>
        <PeoplePicker selected={members} onChange={setMembers} />
        <button
          className="btn block"
          disabled={!valid}
          onClick={() => {
            if (group) {
              actions.updateGroup(group.id, { name: name.trim(), icon, memberIds: Array.from(new Set([...group.memberIds, ...members])) });
              onClose();
            } else {
              const g = actions.addGroup({ name: name.trim(), icon, currency, memberIds: members });
              navigate(`/grupos/${g.id}`);
            }
          }}
        >
          {group ? "Guardar cambios" : "Crear grupo"}
        </button>
      </div>
    </Modal>
  );
}

export function GroupDetail({ id }: { id: string }) {
  const s = useAppState();
  const g = s.groups.find((x) => x.id === id);
  const [tab, setTab] = useState<"saldos" | "gastos" | "miembros">("saldos");
  const [pair, setPair] = useState<[string, string] | null>(null);
  const [editing, setEditing] = useState(false);
  if (!g) return <div className="tile empty">Este grupo no existe.</div>;

  const expenses = s.expenses.filter((e) => e.groupId === g.id).sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt);
  const pairs = scopePairs(s, g.id, g.currency, g.memberIds);
  const mine = pairs.filter((p) => p.a === ME || p.b === ME);
  const others = pairs.filter((p) => p.a !== ME && p.b !== ME);
  const bal = myGroupBalance(s, g);
  const groupTotal = expenses.reduce((acc, e) => acc + e.total * e.rateToBase, 0);

  const pairRow = (p: (typeof pairs)[number]) => {
    const [x, y] = p.b === ME ? [p.b, p.a] : [p.a, p.b];
    const net = p.b === ME ? -p.net : p.net; // + = y le debe a x
    const amount = p.pending ? p.pending.amount : Math.abs(net);
    const from = p.pending ? p.pending.fromId : net > 0 ? y : x;
    const to = p.pending ? p.pending.toId : net > 0 ? x : y;
    const label =
      amount === 0
        ? `${personName(s, x)} y ${personName(s, y)} están a mano`
        : from === ME
          ? `Le debes a ${personName(s, to)}`
          : to === ME
            ? `${personName(s, from)} te debe`
            : `${personName(s, from)} le debe a ${personName(s, to)}`;
    return (
      <button key={`${p.a}-${p.b}`} className="item" onClick={() => setPair([p.a, p.b])}>
        <Avatar name={personName(s, from)} id={from} />
        <div className="grow">
          <p className="item-title">{label}</p>
          <p className="item-sub">{p.items.length} gasto{p.items.length === 1 ? "" : "s"} sin saldar</p>
        </div>
        <div className="stack" style={{ gap: 4, alignItems: "flex-end" }}>
          <span className={`bold ${to === ME ? "pos" : from === ME ? "neg" : ""}`}>{formatMoney(amount, g.currency)}</span>
          <StatusBadge paid={false} />
        </div>
        <ChevronRight size={18} className="muted" aria-hidden />
      </button>
    );
  };

  return (
    <div className="stack">
      <a href="#/grupos" className="back"><ArrowLeft size={16} aria-hidden /> Grupos</a>
      <div className="bento">
        <section className="tile dark span-8 stack" style={{ gap: 20 }}>
          <div className="spread">
            <div className="row" style={{ gap: 14 }}>
              <IconTile name={g.icon} size={52} dark />
              <div>
                <h1>{g.name}</h1>
                <p className="muted small">{g.memberIds.map((m) => personName(s, m)).join(", ")}</p>
              </div>
            </div>
            <button className="btn outline-dark sm" onClick={() => setEditing(true)}><Pencil size={15} aria-hidden /> Editar</button>
          </div>
          <div className="spread" style={{ alignItems: "flex-end", flexWrap: "wrap" }}>
            <div>
              <p className="muted small">{bal === 0 ? "Estás a mano" : bal > 0 ? "En total te deben" : "En total debes"}</p>
              <p className="big-num">{formatMoney(Math.abs(bal), g.currency)}</p>
            </div>
            <a className="btn on-dark" href={`#/gasto/nuevo?grupo=${g.id}`}><Plus size={18} aria-hidden /> Agregar gasto</a>
          </div>
        </section>
        <section className="tile span-4 stack" style={{ justifyContent: "space-between" }}>
          <div>
            <p className="eyebrow">Gastado en el grupo</p>
            <p className="mid-num" style={{ marginTop: 6 }}>{formatMoney(groupTotal, g.currency)}</p>
          </div>
          <div className="spread small muted">
            <span>{expenses.length} gasto{expenses.length === 1 ? "" : "s"}</span>
            <span>{g.memberIds.length} personas</span>
          </div>
        </section>
      </div>

      <div className="seg" role="tablist">
        <button role="tab" aria-selected={tab === "saldos"} className={tab === "saldos" ? "on" : ""} onClick={() => setTab("saldos")}>Quién le debe a quién</button>
        <button role="tab" aria-selected={tab === "gastos"} className={tab === "gastos" ? "on" : ""} onClick={() => setTab("gastos")}>Gastos</button>
        <button role="tab" aria-selected={tab === "miembros"} className={tab === "miembros" ? "on" : ""} onClick={() => setTab("miembros")}>Miembros</button>
      </div>

      {tab === "saldos" && (
        <div className="stack">
          {pairs.length === 0 && <div className="tile empty">Nadie le debe nada a nadie.</div>}
          {mine.length > 0 && <div className="tile flush">{mine.map(pairRow)}</div>}
          {others.length > 0 && (
            <>
              <p className="eyebrow">Entre otros miembros</p>
              <div className="tile flush">{others.map(pairRow)}</div>
            </>
          )}
        </div>
      )}

      {tab === "gastos" && (
        <div className="tile flush">
          {expenses.length === 0 && <div className="empty">Sin gastos todavía.</div>}
          {expenses.map((e) => {
            const st = expenseStatus(s, e);
            const payers = e.payers.map((p) => personName(s, p.personId)).join(" y ");
            return (
              <a key={e.id} className="item" href={`#/gasto/${e.id}`}>
                <IconTile name={e.icon} size={42} />
                <div className="grow">
                  <p className="item-title">{e.description}</p>
                  <p className="item-sub">{e.date} · {payers} pagó <Money amount={e.total} currency={e.currency} /></p>
                </div>
                <StatusBadge paid={st.total > 0 && st.paid === st.total} />
              </a>
            );
          })}
        </div>
      )}

      {tab === "miembros" && (
        <div className="tile flush">
          {g.memberIds.map((m) => {
            const p = s.people.find((x) => x.id === m);
            return (
              <div key={m} className="item static">
                <Avatar name={personName(s, m)} id={m} />
                <div className="grow">
                  <p className="item-title">{personName(s, m)}</p>
                  <p className="item-sub mono">{p?.address ? p.address : "Sin wallet registrada · solo efectivo"}</p>
                </div>
              </div>
            );
          })}
          <div className="item static">
            <button
              className="btn danger sm"
              onClick={() => {
                if (confirm(`¿Eliminar el grupo "${g.name}" y todos sus gastos?`)) {
                  actions.deleteGroup(g.id);
                  navigate("/grupos");
                }
              }}
            >
              <Trash size={15} aria-hidden /> Eliminar grupo
            </button>
          </div>
        </div>
      )}

      {pair && <SettleModal scope={g.id} currency={g.currency} a={pair[0]} b={pair[1]} onClose={() => setPair(null)} />}
      {editing && <GroupFormModal group={g} onClose={() => setEditing(false)} />}
    </div>
  );
}
