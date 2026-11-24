import { useCallback, useState } from "react";
import { Link, NavLink, Outlet } from "react-router";
import type { AppContext } from "@hooks/useAppContext";
import { useWallet } from "@hooks/useWallet";
import { network } from "@config/network";
import { avatarGradient, shortAddress } from "@helpers/format";
import { Button } from "@shared/primitives";

const links = [
  { to: "/", label: "Inicio", end: true },
  { to: "/depositos", label: "Mis depósitos", end: false },
  { to: "/crear", label: "Crear", end: false },
];

function WalletChip({ wallet }: { wallet: AppContext["wallet"] }) {
  if (wallet.restoring) return <div className="h-9 w-32 animate-pulse rounded-full bg-raised motion-reduce:animate-none" />;

  if (!wallet.address) {
    return (
      <Button size="sm" onClick={wallet.connect} disabled={wallet.connecting}>
        {wallet.connecting ? "Conectando..." : "Conectar"}
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2 rounded-full border border-line bg-surface/70 py-1 pr-3 pl-1">
      <span aria-hidden className="size-7 rounded-full" style={{ background: avatarGradient(wallet.address) }} />
      <span className="font-mono text-xs text-muted" title={wallet.address}>
        {shortAddress(wallet.address)}
      </span>
      <span className="rounded-full bg-warn/10 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-warn capitalize">
        {network.name}
      </span>
    </div>
  );
}

export default function AppLayout() {
  const wallet = useWallet();
  const [balanceKey, setBalanceKey] = useState(0);
  const [depositsKey, setDepositsKey] = useState(0);
  const refreshBalance = useCallback(() => setBalanceKey((key) => key + 1), []);
  const refreshDeposits = useCallback(() => setDepositsKey((key) => key + 1), []);

  const context: AppContext = { wallet, balanceKey, depositsKey, refreshBalance, refreshDeposits };

  return (
    <div className="mx-auto flex min-h-dvh max-w-2xl flex-col gap-6 px-4 py-6 sm:py-8">
      <header className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-3">
            <img src="/favicon.svg" alt="" className="size-10" />
            <span className="flex flex-col">
              <span className="text-xl leading-tight font-semibold tracking-tight">Plazo</span>
              <span className="hidden text-xs text-muted sm:block">Depósito de garantía sin custodio</span>
            </span>
          </Link>
          <WalletChip wallet={wallet} />
        </div>
        <nav aria-label="Principal" className="grid grid-cols-3 gap-1 rounded-xl border border-line bg-surface/70 p-1">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `rounded-lg px-2 py-2 text-center text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-raised text-fg shadow-[inset_0_0_0_1px_var(--color-line-strong)]"
                    : "text-muted hover:text-fg"
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="flex flex-1 flex-col gap-6">
        <Outlet context={context} />
      </main>
      <footer className="pt-4 text-center text-xs text-faint">
        Solo testnet. Ejercicio de práctica, sin validez legal.
      </footer>
    </div>
  );
}
