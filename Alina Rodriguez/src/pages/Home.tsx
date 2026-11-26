import { Plus, Receipt, ShieldCheck, Users, Wallet } from "lucide-react";
import { formatMoney } from "../lib/currencies";
import { expenseDebts, expenseStatus, pairState } from "../lib/ledger";
import { ME, personName, useAppState, type State } from "../lib/store";
import { shortAddr, useWallet } from "../lib/stellar";
import { IconTile } from "../components/icons";
import { ConnectWalletButton, Money, StatusBadge, TrustNote, WalletSteps } from "../components/ui";
import { myGroupBalance } from "./Groups";

/** Saldos tuyos por moneda (grupos + cuentas sueltas). */
function totalsByCurrency(s: State) {
  const owedToMe: Record<string, number> = {};
  const iOwe: Record<string, number> = {};
  const add = (bag: Record<string, number>, c: string, v: number) => (bag[c] = (bag[c] ?? 0) + v);
  for (const g of s.groups) {
    if (!g.memberIds.includes(ME)) continue;
    for (const id of g.memberIds) {
      if (id === ME) continue;
      const n = pairState(s, g.id, g.currency, ME, id).net;
      if (n > 0) add(owedToMe, g.currency, n);
      if (n < 0) add(iOwe, g.currency, -n);
    }
  }
  for (const e of s.expenses.filter((x) => !x.groupId)) {
    const others = new Set(expenseDebts(e).flatMap((d) => [d.from, d.to]).filter((x) => x !== ME));
    for (const id of others) {
      const n = pairState(s, `exp:${e.id}`, e.currency, ME, id).net;
      if (n > 0) add(owedToMe, e.currency, n);
      if (n < 0) add(iOwe, e.currency, -n);
    }
  }
  return { owedToMe, iOwe };
}

const fmtBag = (bag: Record<string, number>) => {
  const entries = Object.entries(bag);
  return entries.length ? entries.map(([c, v]) => formatMoney(v, c)).join(" + ") : formatMoney(0, "CRC");
};

export function BillsPage() {
  const s = useAppState();
  const bills = s.expenses.filter((e) => !e.groupId).sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt);
  return (
    <div className="stack">
      <div className="page-head">
        <div>
          <p className="eyebrow">Gastos de una sola vez</p>
          <h1>Cuentas sueltas</h1>
        </div>
        <a className="btn" href="#/gasto/nuevo"><Plus size={18} aria-hidden /> Nueva cuenta</a>
      </div>
      <div className="tile flush">
        {bills.length === 0 ? (
          <div className="empty">
            <IconTile name="receipt" size={52} />
            <p className="bold" style={{ color: "var(--ink)" }}>No hay cuentas sueltas</p>
            <p className="small">Divide una cena con alguien que no está en tus grupos y cóbrale con un link.</p>
          </div>
        ) : (
          bills.map((e) => {
            const st = expenseStatus(s, e);
            return (
              <a key={e.id} className="item" href={`#/gasto/${e.id}`}>
                <IconTile name={e.icon} size={42} />
                <div className="grow">
                  <p className="item-title">{e.description}</p>
                  <p className="item-sub">{e.date} · {e.participantIds.length} personas · {st.paid}/{st.total} cobros pagados</p>
                </div>
                <div className="stack right" style={{ gap: 4, alignItems: "flex-end" }}>
                  <span className="bold"><Money amount={e.total} currency={e.currency} /></span>
                  <StatusBadge paid={st.total > 0 && st.paid === st.total} />
                </div>
              </a>
            );
          })
        )}
      </div>
    </div>
  );
}

export function Home() {
  const s = useAppState();
  const w = useWallet();
  const { owedToMe, iOwe } = totalsByCurrency(s);
  const recent = [...s.expenses].sort((a, b) => b.createdAt - a.createdAt).slice(0, 5);
  const meName = s.people.find((p) => p.id === ME)?.name;
  const isNew = s.groups.length === 0 && s.expenses.length === 0;

  return (
    <div className="bento top">
      <div className="span-7 stack" style={{ gap: 16 }}>
      {/* Bloque principal: resumen compacto */}
      <section className="tile dark stack" style={{ gap: 16 }}>
        <div className="spread">
          <p className="muted small">Pura vida{meName && meName !== "Yo" ? `, ${meName}` : ""}</p>
          <span className="badge" style={{ color: "#bfe3d6", border: "1px solid rgba(191,227,214,.25)" }}>
            <ShieldCheck size={14} aria-hidden /> Stellar Testnet
          </span>
        </div>
        {isNew ? (
          <div className="stack" style={{ gap: 10 }}>
            <h1 style={{ fontSize: "2.4rem", maxWidth: 520 }}>Cuentas claras, amistades largas.</h1>
            <p className="muted" style={{ maxWidth: 480, lineHeight: 1.55 }}>
              Divide gastos con tu familia y amigos, y salda cada deuda con Stellar o en efectivo.
            </p>
          </div>
        ) : (
          <div className="grid2" style={{ gap: 20 }}>
            <div>
              <p className="muted small" style={{ marginBottom: 6 }}>Te deben</p>
              <p className="big-num">{fmtBag(owedToMe)}</p>
            </div>
            <div>
              <p className="muted small" style={{ marginBottom: 6 }}>Debes</p>
              <p className="big-num" style={{ color: "var(--sand)" }}>{fmtBag(iOwe)}</p>
            </div>
          </div>
        )}
        <div className="row wrap">
          <a className="btn on-dark" href={isNew ? "#/grupos?nuevo=1" : "#/gasto/nuevo"}>
            <Plus size={18} aria-hidden /> {isNew ? "Crear mi primer grupo" : "Nuevo gasto"}
          </a>
          <a className="btn outline-dark" href={isNew ? "#/gasto/nuevo" : "#/grupos?nuevo=1"}>
            {isNew ? "Nueva cuenta suelta" : "Nuevo grupo"}
          </a>
        </div>
      </section>

      {/* Grupos */}
      <section className="tile flush">
        <div className="item static">
          <span className="grow bold">Grupos</span>
          <a className="btn soft sm" href="#/grupos">Ver todos</a>
        </div>
        {s.groups.length === 0 ? (
          <div className="empty">
            <span className="icon-tile" style={{ width: 48, height: 48 }}><Users size={22} strokeWidth={1.8} aria-hidden /></span>
            <p className="small">Aún no tienes grupos. Crea uno para tu familia o roomies.</p>
          </div>
        ) : (
          s.groups.slice(0, 4).map((g) => {
            const bal = myGroupBalance(s, g);
            return (
              <a key={g.id} className="item" href={`#/grupos/${g.id}`}>
                <IconTile name={g.icon} size={42} />
                <div className="grow">
                  <p className="item-title">{g.name}</p>
                  <p className="item-sub">{g.memberIds.length} personas</p>
                </div>
                <span className={`bold ${bal > 0 ? "pos" : bal < 0 ? "neg" : "muted"}`}>
                  {bal === 0 ? "A mano" : formatMoney(bal, g.currency, { sign: true })}
                </span>
              </a>
            );
          })
        )}
      </section>

      {/* Últimos gastos */}
      <section className="tile flush">
        <div className="item static">
          <span className="grow bold">Últimos gastos</span>
          <a className="btn soft sm" href="#/gasto/nuevo"><Plus size={16} aria-hidden /> Gasto</a>
        </div>
        {recent.length === 0 ? (
          <div className="empty">
            <span className="icon-tile" style={{ width: 48, height: 48 }}><Receipt size={22} strokeWidth={1.8} aria-hidden /></span>
            <p className="small">Sin gastos todavía. Tu historial aparecerá aquí.</p>
          </div>
        ) : (
          recent.map((e) => {
            const g = s.groups.find((x) => x.id === e.groupId);
            const st = expenseStatus(s, e);
            return (
              <a key={e.id} className="item" href={`#/gasto/${e.id}`}>
                <IconTile name={e.icon} size={42} />
                <div className="grow">
                  <p className="item-title">{e.description}</p>
                  <p className="item-sub">{g?.name ?? "Cuenta suelta"} · pagó {e.payers.map((p) => personName(s, p.personId)).join(" y ")} <Money amount={e.total} currency={e.currency} /></p>
                </div>
                <StatusBadge paid={st.total > 0 && st.paid === st.total} />
              </a>
            );
          })
        )}
      </section>
      </div>

      {/* Wallet */}
      <section className="tile solid span-5 stack" style={{ gap: 14 }}>
        <div className="spread">
          <div className="row">
            <span className="icon-tile" style={{ width: 40, height: 40 }}><Wallet size={19} strokeWidth={1.8} aria-hidden /></span>
            <h2>Tu wallet</h2>
          </div>
          {w.address && <span className="badge paid">Conectada{w.walletName ? ` · ${w.walletName}` : ""}</span>}
        </div>
        {w.address ? (
          <>
            <p className="mid-num">
              {w.balance === null ? "Sin fondos" : Number(w.balance).toLocaleString("es-CR", { maximumFractionDigits: 2 })}
              {w.balance !== null && <span className="muted" style={{ fontSize: "1rem", fontWeight: 500 }}> XLM</span>}
            </p>
            <p className="mono muted">{shortAddr(w.address)}</p>
            <a className="btn soft" href="#/wallet" style={{ marginTop: "auto" }}>Ver mi wallet</a>
          </>
        ) : (
          <>
            <p className="small muted">Conéctala para pagar y cobrar en XLM. Funciona con LOBSTR, Varial, xBull, Albedo y más.</p>
            <WalletSteps />
            <ConnectWalletButton block />
            <TrustNote />
          </>
        )}
      </section>

    </div>
  );
}
