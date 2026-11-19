import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { useWalletContext } from "../contexts/WalletContext.jsx";
import { useStellarAccount } from "../hooks/useStellarAccount.js";
import { sendContribution, withdrawFromVault, getTestUsdc } from "../lib/stellar.js";
import { VAULT_ADDRESS } from "../constants/stellar.js";

// ─── helpers ─────────────────────────────────────────────────────────────────

const num = (n) => parseFloat(n ?? "0") || 0;
const fmt = (n, d = 2) =>
  num(n).toLocaleString("es-CR", { minimumFractionDigits: d, maximumFractionDigits: d });
const trunc = (str, a = 8, b = 6) => (str ? `${str.slice(0, a)}…${str.slice(-b)}` : "—");
const explorer = (kind, id) => `https://stellar.expert/explorer/testnet/${kind}/${id}`;

function errorMessage(err) {
  const codes = err?.response?.data?.extras?.result_codes;
  if (codes) return [codes.transaction, ...(codes.operations ?? [])].filter(Boolean).join(" · ");
  const msg = err?.message ?? "La transacción falló";
  if (/reject|declin|cancel/i.test(msg)) return "Cancelaste la firma en tu wallet.";
  return msg;
}

// ─── icons ───────────────────────────────────────────────────────────────────

const Svg = ({ d, className = "w-4 h-4", sw = 1.8 }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={sw} d={d} />
  </svg>
);
const I = {
  home: "M3 12l9-8 9 8M5 10v10h5v-6h4v6h5V10",
  swap: "M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4",
  list: "M4 6h16M4 10h16M4 14h16M4 18h16",
  refresh: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15",
  check: "M5 13l4 4L19 7",
  arrowRight: "M5 12h14m-6-6l6 6-6 6",
  arrowDown: "M12 5v14m0 0l-6-6m6 6l6-6",
  arrowUp: "M12 19V5m0 0l-6 6m6-6l6 6",
  wallet: "M3 7a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7zm13 5h.01M3 9h18",
  vault: "M4 6a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm8 9a3 3 0 100-6 3 3 0 000 6zm0-3h.01",
  growth: "M3 17l6-6 4 4 8-8m0 0v6m0-6h-6",
  external: "M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14",
  info: "M12 16v-4m0-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
};

// ─── sidebar ─────────────────────────────────────────────────────────────────

const NAV = [
  { id: "resumen", label: "Mi pensión", desc: "Tu saldo y el vault", icon: I.home },
  { id: "contribuir", label: "Depositar / Retirar", desc: "Mueve tus USDC", icon: I.swap },
  { id: "historial", label: "Historial", desc: "Todas tus operaciones", icon: I.list },
];

function Sidebar({ activeTab, setActiveTab, onDisconnect, truncatedKey, walletId }) {
  return (
    <aside className="w-60 flex-shrink-0 bg-[#0a0a0a] border-r border-border flex flex-col">
      <div className="h-14 flex items-center gap-2.5 px-4 border-b border-border">
        <div className="w-6 h-6 rounded-md bg-accent flex items-center justify-center font-bold text-white text-xs flex-shrink-0">
          K
        </div>
        <span className="text-white font-semibold text-sm tracking-tight">Koired</span>
        <span className="ml-auto text-[10px] text-yellow-400/90 bg-yellow-400/10 border border-yellow-400/20 px-1.5 py-0.5 rounded-md leading-none">
          Testnet
        </span>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {NAV.map(({ id, label, desc, icon }) => {
          const active = activeTab === id;
          return (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all
                ${active ? "bg-accent/10 text-accent" : "text-muted hover:text-white hover:bg-white/[0.04]"}`}
            >
              <Svg d={icon} />
              <span className="min-w-0">
                <span className={`block text-sm ${active ? "font-medium" : ""}`}>{label}</span>
                <span className="block text-[11px] text-muted/70 truncate">{desc}</span>
              </span>
            </button>
          );
        })}
      </nav>

      <div className="p-3 border-t border-border space-y-2">
        <div className="bg-[#111] border border-border rounded-xl p-3 space-y-1.5">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse flex-shrink-0" />
            <span className="text-green-400 text-[11px] font-medium">Wallet conectada</span>
          </div>
          <p className="text-white text-xs font-mono truncate">{truncatedKey}</p>
          <p className="text-muted text-[11px] capitalize">{walletId ?? "wallet"}</p>
        </div>
        <button
          onClick={onDisconnect}
          className="w-full text-muted hover:text-red-400 text-xs py-2 hover:bg-red-400/5 rounded-lg transition-colors text-left px-3"
        >
          Desconectar wallet
        </button>
      </div>
    </aside>
  );
}

// ─── shared bits ─────────────────────────────────────────────────────────────

function Card({ children, className = "" }) {
  return <div className={`bg-[#111] border border-border rounded-2xl ${className}`}>{children}</div>;
}

function Hint({ children }) {
  return (
    <p className="flex gap-1.5 text-muted/80 text-[11px] leading-relaxed">
      <Svg d={I.info} className="w-3.5 h-3.5 flex-shrink-0 mt-px" />
      <span>{children}</span>
    </p>
  );
}

function Skeleton({ loading, children }) {
  return loading ? <span className="inline-block w-20 h-[1em] rounded bg-white/5 animate-pulse align-middle" /> : children;
}

function TxResult({ result, onClose }) {
  if (!result) return null;
  if (result.hash) {
    return (
      <div className="bg-green-500/8 border border-green-500/25 rounded-2xl p-5 flex items-start gap-3">
        <div className="w-8 h-8 rounded-xl bg-green-500/15 text-green-400 flex items-center justify-center flex-shrink-0">
          <Svg d={I.check} sw={2} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-green-400 font-semibold text-sm">{result.title}</p>
          <p className="text-muted text-xs mt-0.5 mb-2">{result.detail}</p>
          <a href={explorer("tx", result.hash)} target="_blank" rel="noreferrer"
            className="inline-flex items-center gap-1 text-accent text-xs hover:underline">
            Ver transacción en el explorador <Svg d={I.external} className="w-3 h-3" />
          </a>
        </div>
        <button onClick={onClose} className="text-muted hover:text-white text-xs">✕</button>
      </div>
    );
  }
  return (
    <div className="bg-red-500/8 border border-red-500/25 rounded-2xl p-5 flex items-start gap-3">
      <div className="flex-1 min-w-0">
        <p className="text-red-400 text-sm font-medium mb-1">No se pudo completar</p>
        <p className="text-muted text-xs break-words">{result.error}</p>
      </div>
      <button onClick={onClose} className="text-muted hover:text-white text-xs">✕</button>
    </div>
  );
}

// ─── onboarding ──────────────────────────────────────────────────────────────

function PrimerosPasos({ accountNotFound, account, position, fundingLoading, faucetLoading, onFund, onFaucet, onGoDeposit }) {
  const step1 = !accountNotFound && !!account;
  const step2 = num(account?.usdcBalance) > 0 || num(position.usdc) > 0;
  const step3 = num(position.usdc) > 0;
  if (step1 && step2 && step3) return null;

  const steps = [
    {
      done: step1,
      title: "Activa tu cuenta",
      desc: "Recibe XLM de prueba para pagar las comisiones de la red.",
      action: { label: fundingLoading ? "Activando…" : "Activar con Friendbot", onClick: onFund, busy: fundingLoading },
    },
    {
      done: step2,
      title: "Consigue USDC de prueba",
      desc: "El faucet de Blend te envía 1000 USDC. Solo firmas una vez.",
      action: { label: faucetLoading ? "Solicitando…" : "Obtener 1000 USDC", onClick: onFaucet, busy: faucetLoading },
    },
    {
      done: step3,
      title: "Haz tu primer depósito",
      desc: "Mueve USDC al vault para empezar a generar rendimiento.",
      action: { label: "Ir a depositar", onClick: onGoDeposit },
    },
  ];
  const current = steps.findIndex((s) => !s.done);

  return (
    <Card className="p-6">
      <div className="flex items-baseline justify-between gap-4 mb-5">
        <div>
          <h3 className="text-white font-semibold">Primeros pasos</h3>
          <p className="text-muted text-xs mt-0.5">Tres pasos para empezar a ahorrar para tu pensión.</p>
        </div>
        <span className="text-muted text-xs whitespace-nowrap">{steps.filter((s) => s.done).length} de 3</span>
      </div>
      <ol className="grid md:grid-cols-3 gap-3">
        {steps.map((s, i) => {
          const isCurrent = i === current;
          return (
            <li key={s.title}
              className={`rounded-xl border p-4 flex flex-col gap-3 ${
                isCurrent ? "border-accent/50 bg-accent/[0.06]" : "border-border bg-[#0d0d0d]"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 ${
                  s.done ? "bg-green-500/15 text-green-400" : isCurrent ? "bg-accent text-white" : "bg-white/5 text-muted"
                }`}>
                  {s.done ? <Svg d={I.check} className="w-3.5 h-3.5" sw={2.5} /> : i + 1}
                </span>
                <span className={`text-sm font-medium ${s.done ? "text-muted line-through" : "text-white"}`}>{s.title}</span>
              </div>
              <p className="text-muted text-xs leading-relaxed flex-1">{s.desc}</p>
              {isCurrent && (
                <button onClick={s.action.onClick} disabled={s.action.busy}
                  className="self-start text-xs bg-accent hover:bg-accent-hover text-white font-medium px-3.5 py-2 rounded-full transition-colors disabled:opacity-50">
                  {s.action.label}
                </button>
              )}
            </li>
          );
        })}
      </ol>
    </Card>
  );
}

// ─── vault hero ──────────────────────────────────────────────────────────────

function FlowStep({ icon, title, sub, tone }) {
  return (
    <div className="flex-1 min-w-0 flex items-center gap-3 bg-[#0d0d0d] border border-border rounded-xl p-3">
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${tone}`}>
        <Svg d={icon} />
      </div>
      <div className="min-w-0">
        <p className="text-white text-xs font-medium">{title}</p>
        <p className="text-muted text-[11px] leading-snug">{sub}</p>
      </div>
    </div>
  );
}

function VaultHero({ position, vault, loading, onDeposit, onWithdraw }) {
  const share = num(vault.totalShares) > 0 ? (num(position.shares) / num(vault.totalShares)) * 100 : 0;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-accent/25 bg-gradient-to-br from-accent/[0.14] via-[#111] to-[#111] p-6 md:p-7">
      <div className="pointer-events-none absolute -top-24 -right-24 w-72 h-72 rounded-full bg-accent/20 blur-3xl" />

      <div className="relative flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="text-accent text-xs font-medium uppercase tracking-wider">Tu fondo de pensión</p>
          <p className="text-white text-4xl md:text-5xl font-bold tracking-tight mt-2">
            <Skeleton loading={loading && num(position.usdc) === 0}>
              {fmt(position.usdc)} <span className="text-2xl text-white/60 font-semibold">USDC</span>
            </Skeleton>
          </p>
          <p className="text-muted text-xs mt-2">
            {fmt(position.shares, 4)} dfTokens
            {share > 0 && <> · {share < 0.01 ? "<0.01" : fmt(share)}% del vault</>}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={onDeposit}
            className="flex items-center gap-1.5 bg-accent hover:bg-accent-hover text-white text-sm font-semibold px-5 py-2.5 rounded-full transition-colors">
            <Svg d={I.arrowDown} /> Depositar
          </button>
          <button onClick={onWithdraw} disabled={num(position.usdc) === 0}
            className="flex items-center gap-1.5 border border-border hover:border-white/30 text-white text-sm font-semibold px-5 py-2.5 rounded-full transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
            <Svg d={I.arrowUp} /> Retirar
          </button>
        </div>
      </div>

      {/* cómo funciona */}
      <div className="relative mt-7">
        <p className="text-muted text-[11px] uppercase tracking-wider mb-2.5">Cómo funciona</p>
        <div className="flex flex-col md:flex-row md:items-center gap-2">
          <FlowStep icon={I.wallet} tone="bg-white/5 text-white"
            title="1 · Tu wallet" sub="Depositas USDC, un dólar digital estable." />
          <Svg d={I.arrowRight} className="w-4 h-4 text-muted/50 flex-shrink-0 self-center rotate-90 md:rotate-0" />
          <FlowStep icon={I.vault} tone="bg-accent/15 text-accent"
            title="2 · Vault DeFindex" sub="Guarda tus fondos y te da dfTokens como recibo." />
          <Svg d={I.arrowRight} className="w-4 h-4 text-muted/50 flex-shrink-0 self-center rotate-90 md:rotate-0" />
          <FlowStep icon={I.growth} tone="bg-green-500/10 text-green-400"
            title="3 · Estrategia Blend" sub="Presta los USDC y genera intereses para el vault." />
        </div>
      </div>
    </div>
  );
}

// ─── vault details ───────────────────────────────────────────────────────────

function VaultDetalles({ vault, loading }) {
  const tvl = num(vault.tvl);
  const investedPct = tvl > 0 ? (num(vault.invested) / tvl) * 100 : 0;

  return (
    <Card className="p-6 space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-white font-semibold text-sm">Estado del vault</h3>
          <p className="text-muted text-xs mt-0.5">DeFindex USDC Vault · PaltaLabs</p>
        </div>
        <a href={explorer("contract", VAULT_ADDRESS)} target="_blank" rel="noreferrer"
          className="inline-flex items-center gap-1 text-accent text-[11px] hover:underline whitespace-nowrap">
          {trunc(VAULT_ADDRESS, 4, 4)} <Svg d={I.external} className="w-3 h-3" />
        </a>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-muted text-[11px]">Total en el vault</p>
          <p className="text-white text-lg font-semibold mt-0.5">
            <Skeleton loading={loading && tvl === 0}>{fmt(vault.tvl, 0)} USDC</Skeleton>
          </p>
        </div>
        <div>
          <p className="text-muted text-[11px]">Valor de 1 dfToken</p>
          <p className="text-white text-lg font-semibold mt-0.5">
            <Skeleton loading={loading && tvl === 0}>{fmt(vault.sharePrice, 4)} USDC</Skeleton>
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-[11px]">
          <span className="flex items-center gap-1.5 text-muted">
            <span className="w-2 h-2 rounded-sm bg-green-400" /> Invertido en Blend
            <span className="text-white">{fmt(vault.invested, 0)}</span>
          </span>
          <span className="flex items-center gap-1.5 text-muted">
            <span className="w-2 h-2 rounded-sm bg-white/20" /> En reserva
            <span className="text-white">{fmt(vault.idle, 0)}</span>
          </span>
        </div>
        <div className="h-2 rounded-full bg-white/10 overflow-hidden">
          <div className="h-full bg-green-400 rounded-full transition-all" style={{ width: `${investedPct}%` }} />
        </div>
      </div>

      <Hint>
        El valor de cada dfToken sube cuando la estrategia genera intereses. Por eso tu saldo en USDC crece aunque
        tu cantidad de dfTokens no cambie.
        {tvl > 0 && num(vault.invested) === 0 &&
          " Ahora mismo todo está en reserva: los fondos están seguros pero no generan intereses hasta que el administrador del vault los invierta en Blend."}
      </Hint>
    </Card>
  );
}

// ─── tab: resumen ────────────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1a1a1a] border border-border rounded-xl px-3 py-2 text-xs shadow-xl">
      <p className="text-muted mb-1">{label}</p>
      <p className="text-white font-semibold">{payload[0].value.toFixed(2)} USDC</p>
    </div>
  );
}

const KIND = {
  deposit: { label: "Depósito al vault", dot: "bg-accent", sign: "−" },
  withdraw: { label: "Retiro del vault", dot: "bg-orange-400", sign: "+" },
  received: { label: "Recibido", dot: "bg-green-400", sign: "+" },
  sent: { label: "Enviado", dot: "bg-red-400", sign: "−" },
  create_account: { label: "Cuenta activada", dot: "bg-yellow-400", sign: "+" },
  contract: { label: "Llamada a contrato", dot: "bg-muted", sign: "" },
};

function TabResumen({ account, payments, vault, position, loading, onboarding, onDeposit, onWithdraw }) {
  const depositos = payments.filter((p) => p.kind === "deposit");
  const retiros = payments.filter((p) => p.kind === "withdraw");
  const totalDepositado = depositos.reduce((s, p) => s + num(p.amount), 0);
  const totalRetirado = retiros.reduce((s, p) => s + num(p.amount), 0);

  // Ahorro acumulado (depósitos − retiros) en orden cronológico, partiendo de 0
  const movimientos = payments.filter((p) => p.kind === "deposit" || p.kind === "withdraw").reverse();
  let acumulado = 0;
  const chartData = movimientos.length
    ? [{ fecha: "Inicio", monto: 0 }, ...movimientos.map((p) => {
        acumulado += p.kind === "deposit" ? num(p.amount) : -num(p.amount);
        return {
          fecha: new Date(p.createdAt).toLocaleDateString("es-CR", { day: "numeric", month: "short" }),
          monto: Math.max(acumulado, 0),
        };
      })]
    : [];

  return (
    <div className="space-y-6 max-w-6xl">
      {onboarding}

      <div className="grid xl:grid-cols-[1fr_380px] gap-6">
        <VaultHero position={position} vault={vault} loading={loading} onDeposit={onDeposit} onWithdraw={onWithdraw} />
        <VaultDetalles vault={vault} loading={loading} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5">
          <p className="text-muted text-xs">USDC en tu wallet</p>
          <p className="text-white text-xl font-bold mt-1">
            <Skeleton loading={loading && !account}>{fmt(account?.usdcBalance)}</Skeleton>
          </p>
          <p className="text-muted/70 text-[11px] mt-0.5">Disponible para depositar</p>
        </Card>
        <Card className="p-5">
          <p className="text-muted text-xs">Depositado / retirado</p>
          <p className="text-white text-xl font-bold mt-1">
            {fmt(totalDepositado)} <span className="text-muted text-sm font-normal">/ {fmt(totalRetirado)}</span>
          </p>
          <p className="text-muted/70 text-[11px] mt-0.5">En tus últimas {payments.length} operaciones</p>
        </Card>
        <Card className="p-5">
          <p className="text-muted text-xs">XLM para comisiones</p>
          <p className="text-white text-xl font-bold mt-1">
            <Skeleton loading={loading && !account}>{fmt(account?.xlmBalance)}</Skeleton>
          </p>
          <p className="text-muted/70 text-[11px] mt-0.5">Cada operación cuesta centavos de XLM</p>
        </Card>
      </div>

      <div className="grid xl:grid-cols-[1fr_380px] gap-6">
        <Card className="p-6">
          <h3 className="text-white font-semibold text-sm">Tu ahorro acumulado</h3>
          <p className="text-muted text-xs mt-0.5 mb-5">USDC depositados menos retirados, operación por operación</p>
          {chartData.length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center gap-1 text-center">
              <p className="text-muted text-sm">Aún no has depositado</p>
              <p className="text-muted/60 text-xs">Tus depósitos aparecerán aquí</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="gradientArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4F6EF7" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#4F6EF7" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e1e1e" vertical={false} />
                <XAxis dataKey="fecha" tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="monto" stroke="#4F6EF7" strokeWidth={2} fill="url(#gradientArea)"
                  dot={{ r: 3, fill: "#4F6EF7", strokeWidth: 0 }} activeDot={{ r: 5, fill: "#4F6EF7", strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </Card>

        <Card className="p-6">
          <h3 className="text-white font-semibold text-sm mb-4">Actividad reciente</h3>
          {payments.length === 0 ? (
            <p className="text-muted text-xs">Sin actividad todavía.</p>
          ) : (
            <div className="space-y-1">
              {payments.slice(0, 6).map((p) => <ActivityRow key={p.id} p={p} />)}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function ActivityRow({ p }) {
  const k = KIND[p.kind] ?? KIND.contract;
  return (
    <a href={explorer("tx", p.transactionHash)} target="_blank" rel="noreferrer"
      className="flex items-center justify-between gap-3 py-2 px-2 -mx-2 rounded-lg hover:bg-white/[0.03]">
      <div className="flex items-center gap-3 min-w-0">
        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${k.dot}`} />
        <div className="min-w-0">
          <p className="text-white text-xs font-medium truncate">{k.label}</p>
          <p className="text-muted text-[11px]">
            {new Date(p.createdAt).toLocaleDateString("es-CR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
      </div>
      {p.amount && (
        <span className="text-white text-xs font-mono whitespace-nowrap">
          {fmt(p.amount)} {p.assetCode}
        </span>
      )}
    </a>
  );
}

// ─── tab: contribuir ─────────────────────────────────────────────────────────

const PRESETS = [5, 10, 25, 50, 100];

function TabContribuir({ publicKey, account, position, vault, accountNotFound, signXDR, onRefresh, modo, setModo, onFaucet, faucetLoading }) {
  const [monto, setMonto] = useState("10");
  const [enviando, setEnviando] = useState(false);
  const [result, setResult] = useState(null);

  const depositar = modo === "depositar";
  const usdcWallet = num(account?.usdcBalance);
  const enVault = num(position.usdc);
  const maximo = depositar ? usdcWallet : enVault;
  const montoNum = num(monto);
  const price = num(vault.sharePrice) || 1;

  let problema = null;
  if (accountNotFound) problema = "Primero activa tu cuenta desde “Mi pensión”.";
  else if (!(montoNum > 0)) problema = "Escribe un monto mayor a 0.";
  else if (montoNum > maximo + 1e-7)
    problema = depositar
      ? `No tienes suficiente USDC en tu wallet (tienes ${fmt(usdcWallet)}).`
      : `Solo tienes ${fmt(enVault)} USDC en el vault.`;

  const pensionDespues = depositar ? enVault + montoNum : Math.max(enVault - montoNum, 0);
  const walletDespues = depositar ? Math.max(usdcWallet - montoNum, 0) : usdcWallet + montoNum;

  function cambiarModo(m) {
    setModo(m);
    setResult(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (problema) return;
    setResult(null);
    setEnviando(true);
    try {
      const r = depositar
        ? await sendContribution(publicKey, monto, signXDR)
        : await withdrawFromVault(publicKey, monto, position, signXDR);
      setResult({
        hash: r.hash,
        title: depositar ? `Depositaste ${fmt(monto)} USDC` : `Retiraste ${fmt(monto)} USDC`,
        detail: depositar
          ? "Tus USDC ya están en el vault y recibiste dfTokens a cambio."
          : "Los USDC volvieron a tu wallet.",
      });
      onRefresh();
    } catch (err) {
      setResult({ error: errorMessage(err) });
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="grid lg:grid-cols-[minmax(0,560px)_minmax(0,1fr)] gap-6 items-start max-w-6xl">
      <div className="space-y-5">
        {/* modo */}
        <div className="grid grid-cols-2 gap-1 bg-[#111] border border-border rounded-xl p-1">
          {[["depositar", "Depositar", I.arrowDown], ["retirar", "Retirar", I.arrowUp]].map(([id, label, icon]) => (
            <button key={id} type="button" onClick={() => cambiarModo(id)}
              className={`flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                modo === id ? "bg-accent text-white" : "text-muted hover:text-white"
              }`}>
              <Svg d={icon} /> {label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          <Card className="p-6 space-y-5">
            <div>
              <h2 className="text-white text-lg font-bold">
                {depositar ? "Depositar USDC al vault" : "Retirar USDC del vault"}
              </h2>
              <p className="text-muted text-xs mt-1">
                {depositar
                  ? "Tus USDC salen de tu wallet y entran al vault. Recibes dfTokens que representan tu parte."
                  : "Devuelves dfTokens al vault y recibes el USDC equivalente en tu wallet."}
              </p>
            </div>

            {/* amount */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="monto" className="text-muted text-xs font-medium">¿Cuánto?</label>
                <span className="text-muted text-[11px]">
                  {depositar ? "En tu wallet" : "En el vault"}: <span className="text-white">{fmt(maximo)} USDC</span>
                </span>
              </div>
              <div className="flex items-center bg-[#0d0d0d] border border-border rounded-xl focus-within:border-accent transition-colors">
                <input id="monto" type="number" min="0" step="any" inputMode="decimal" value={monto}
                  onChange={(e) => setMonto(e.target.value)}
                  className="flex-1 min-w-0 bg-transparent text-white text-2xl font-semibold px-4 py-3.5 focus:outline-none"
                  placeholder="0.00" />
                <span className="text-muted text-sm font-medium pr-2">USDC</span>
                <button type="button" onClick={() => setMonto(String(maximo))}
                  className="mr-2 text-[11px] font-semibold text-accent bg-accent/10 hover:bg-accent/20 px-2.5 py-1 rounded-md">
                  MÁX
                </button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2.5">
                {PRESETS.map((p) => (
                  <button key={p} type="button" onClick={() => setMonto(String(p))}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                      monto === String(p)
                        ? "bg-accent/15 text-accent border-accent/40"
                        : "text-muted border-border hover:text-white hover:border-white/20"
                    }`}>
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* preview */}
            <div className="bg-[#0d0d0d] border border-border/70 rounded-xl divide-y divide-border/70 text-xs">
              <div className="flex justify-between gap-3 p-3.5">
                <span className="text-muted">{depositar ? "Recibirás aprox." : "Devolverás aprox."}</span>
                <span className="text-white font-mono">{fmt(montoNum / price, 4)} dfTokens</span>
              </div>
              <div className="flex justify-between gap-3 p-3.5">
                <span className="text-muted">Tu pensión en el vault</span>
                <span className="text-white">
                  {fmt(enVault)} <span className="text-muted">→</span>{" "}
                  <span className={depositar ? "text-green-400" : "text-orange-400"}>{fmt(pensionDespues)} USDC</span>
                </span>
              </div>
              <div className="flex justify-between gap-3 p-3.5">
                <span className="text-muted">USDC en tu wallet</span>
                <span className="text-white">
                  {fmt(usdcWallet)} <span className="text-muted">→</span> {fmt(walletDespues)}
                </span>
              </div>
              <div className="flex justify-between gap-3 p-3.5">
                <span className="text-muted">Comisión de red</span>
                <span className="text-white">Centavos de XLM</span>
              </div>
            </div>

            {problema && montoNum > 0 && <p className="text-orange-400 text-xs">{problema}</p>}

            <button type="submit" disabled={enviando || !!problema}
              className="btn-primary w-full py-3.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100">
              {enviando ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Confirma en tu wallet…
                </span>
              ) : depositar ? `Depositar ${montoNum > 0 ? fmt(monto) : ""} USDC` : `Retirar ${montoNum > 0 ? fmt(monto) : ""} USDC`}
            </button>
            <p className="text-muted/70 text-[11px] text-center -mt-2">
              Tu wallet te pedirá firmar. Nada se mueve sin tu firma.
            </p>
          </Card>
        </form>

        <TxResult result={result} onClose={() => setResult(null)} />
      </div>

      {/* side help */}
      <div className="space-y-4">
        {depositar && usdcWallet === 0 && !accountNotFound && (
          <Card className="p-5 border-accent/30">
            <p className="text-white text-sm font-semibold">¿No tienes USDC?</p>
            <p className="text-muted text-xs mt-1 mb-3">En testnet puedes pedir 1000 USDC de prueba gratis.</p>
            <button onClick={onFaucet} disabled={faucetLoading}
              className="text-xs bg-accent hover:bg-accent-hover text-white font-medium px-3.5 py-2 rounded-full disabled:opacity-50">
              {faucetLoading ? "Solicitando…" : "Obtener 1000 USDC de prueba"}
            </button>
          </Card>
        )}
        <Card className="p-5 space-y-4">
          <p className="text-white text-sm font-semibold">Preguntas frecuentes</p>
          {[
            ["¿Qué es el vault?",
              "Un contrato inteligente de DeFindex que junta los USDC de muchas personas y los invierte en Blend, un protocolo de préstamos en Stellar."],
            ["¿Qué son los dfTokens?",
              "Son tu recibo. Representan tu porcentaje del vault. Cuando el vault gana intereses, cada dfToken vale más USDC."],
            ["¿Puedo retirar cuando quiera?",
              "Sí. No hay plazo mínimo. Retiras y los USDC vuelven a tu wallet en segundos."],
            ["¿Es dinero real?",
              "No. Esto corre en Stellar Testnet con USDC de prueba, sin valor real."],
          ].map(([q, a]) => (
            <details key={q} className="group border-t border-border/70 pt-3 first-of-type:border-0 first-of-type:pt-0">
              <summary className="cursor-pointer list-none flex justify-between items-center text-xs text-white">
                {q}
                <span className="text-muted group-open:rotate-45 transition-transform text-base leading-none">+</span>
              </summary>
              <p className="text-muted text-xs leading-relaxed mt-2">{a}</p>
            </details>
          ))}
        </Card>
      </div>
    </div>
  );
}

// ─── tab: historial ──────────────────────────────────────────────────────────

function TabHistorial({ payments, loading, publicKey }) {
  return (
    <div className="space-y-5 max-w-6xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-muted text-sm">Tus últimas {payments.length} operaciones en Stellar Testnet. Haz clic en una para verla en el explorador.</p>
        {publicKey && (
          <a href={explorer("account", publicKey)} target="_blank" rel="noreferrer"
            className="inline-flex items-center gap-1 text-accent text-xs hover:underline">
            Ver cuenta completa <Svg d={I.external} className="w-3 h-3" />
          </a>
        )}
      </div>

      <Card className="overflow-x-auto">
        {loading && payments.length === 0 ? (
          <div className="py-20 text-center">
            <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-muted text-sm">Cargando operaciones…</p>
          </div>
        ) : payments.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-muted text-sm">Sin operaciones aún</p>
            <p className="text-muted/50 text-xs mt-1">Haz un depósito para verlo aquí</p>
          </div>
        ) : (
          <table className="w-full min-w-[640px]">
            <thead className="border-b border-border bg-[#0d0d0d]">
              <tr>
                {["Operación", "Fecha", "Monto", "Con"].map((h) => (
                  <th key={h} className="text-left text-muted text-[11px] font-medium uppercase tracking-wider px-6 py-3.5">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => {
                const k = KIND[p.kind] ?? KIND.contract;
                const contraparte = p.from === publicKey ? p.to : p.from ?? p.sourceAccount;
                return (
                  <tr key={p.id} className="border-b border-border/60 last:border-0 hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <a href={explorer("tx", p.transactionHash)} target="_blank" rel="noreferrer"
                        className="flex items-center gap-2.5 text-white text-sm hover:text-accent">
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${k.dot}`} />
                        {k.label}
                      </a>
                    </td>
                    <td className="px-6 py-4 text-muted text-xs whitespace-nowrap">
                      {new Date(p.createdAt).toLocaleDateString("es-CR", {
                        day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
                      })}
                    </td>
                    <td className="px-6 py-4 text-white text-sm font-mono whitespace-nowrap">
                      {p.amount ? `${fmt(p.amount)} ${p.assetCode}` : "—"}
                    </td>
                    <td className="px-6 py-4 text-muted text-xs font-mono">
                      {contraparte === VAULT_ADDRESS ? (
                        <span className="text-accent font-sans">Vault DeFindex</span>
                      ) : trunc(contraparte)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}

// ─── main page ───────────────────────────────────────────────────────────────

const TITLES = {
  resumen: ["Mi pensión", "Cuánto tienes ahorrado y cómo está el vault"],
  contribuir: ["Depositar / Retirar", "Mueve USDC entre tu wallet y el vault"],
  historial: ["Historial", "Todas tus operaciones on-chain"],
};

export default function AppPage() {
  const { publicKey, truncatedKey, walletId, disconnect, signXDR, isConnected } = useWalletContext();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("resumen");
  const [modo, setModo] = useState("depositar");
  const [faucetLoading, setFaucetLoading] = useState(false);
  const [faucetResult, setFaucetResult] = useState(null);

  const {
    account, payments, vault, position, loading,
    fundingLoading, accountNotFound, error,
    refresh, fundAccount,
  } = useStellarAccount(publicKey);

  if (!isConnected) return <Navigate to="/" replace />;

  function handleDisconnect() {
    disconnect();
    navigate("/");
  }

  function irA(tab, m) {
    if (m) setModo(m);
    setActiveTab(tab);
  }

  async function handleFaucet() {
    setFaucetResult(null);
    setFaucetLoading(true);
    try {
      const r = await getTestUsdc(publicKey, signXDR);
      setFaucetResult({ hash: r.hash, title: "Recibiste 1000 USDC de prueba", detail: "Ya puedes depositarlos en el vault." });
      refresh();
    } catch (err) {
      setFaucetResult({ error: errorMessage(err) });
    } finally {
      setFaucetLoading(false);
    }
  }

  const [title, subtitle] = TITLES[activeTab];

  const onboarding = (
    <PrimerosPasos
        accountNotFound={accountNotFound}
        account={account}
        position={position}
        fundingLoading={fundingLoading}
        faucetLoading={faucetLoading}
        onFund={fundAccount}
        onFaucet={handleFaucet}
      onGoDeposit={() => irA("contribuir", "depositar")}
    />
  );

  return (
    <div className="flex h-screen bg-[#080808] text-white overflow-hidden">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onDisconnect={handleDisconnect}
        truncatedKey={truncatedKey}
        walletId={walletId}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 border-b border-border flex items-center px-6 gap-4 flex-shrink-0">
          <div className="min-w-0">
            <p className="text-white font-semibold text-sm">{title}</p>
            <p className="text-muted text-xs truncate">{subtitle}</p>
          </div>
          <button
            onClick={refresh}
            disabled={loading}
            className="ml-auto flex items-center gap-1.5 text-muted hover:text-white text-xs border border-border rounded-full px-3 py-1.5 hover:border-accent/30 transition-colors disabled:opacity-50"
          >
            <Svg d={I.refresh} className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} sw={2} />
            {loading ? "Actualizando…" : "Actualizar"}
          </button>
        </header>

        {error && (
          <div className="bg-red-500/8 border-b border-red-500/20 px-6 py-3">
            <p className="text-red-400 text-xs">{error}</p>
          </div>
        )}

        <main className="flex-1 overflow-auto p-6">
          {faucetResult && (
            <div className="max-w-6xl mb-6">
              <TxResult result={faucetResult} onClose={() => setFaucetResult(null)} />
            </div>
          )}
          {activeTab === "resumen" && (
            <TabResumen
              account={account}
              payments={payments}
              vault={vault}
              position={position}
              loading={loading}
              onboarding={onboarding}
              onDeposit={() => irA("contribuir", "depositar")}
              onWithdraw={() => irA("contribuir", "retirar")}
            />
          )}
          {activeTab === "contribuir" && (
            <TabContribuir
              publicKey={publicKey}
              account={account}
              position={position}
              vault={vault}
              accountNotFound={accountNotFound}
              signXDR={signXDR}
              onRefresh={refresh}
              modo={modo}
              setModo={setModo}
              onFaucet={handleFaucet}
              faucetLoading={faucetLoading}
            />
          )}
          {activeTab === "historial" && (
            <TabHistorial payments={payments} loading={loading} publicKey={publicKey} />
          )}
        </main>
      </div>
    </div>
  );
}
