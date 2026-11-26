import { useEffect } from "react";
import { House, Receipt, Users, Wallet } from "lucide-react";
import { refreshRates } from "./lib/rates";
import { useRoute } from "./lib/router";
import { checkPendingPayments, initWallet, shortAddr, useWallet } from "./lib/stellar";
import { getState } from "./lib/store";
import { LogoMark, ToastHost } from "./components/ui";
import { ExpenseDetail } from "./pages/ExpenseDetail";
import { ExpenseForm } from "./pages/ExpenseForm";
import { GroupDetail, GroupsPage } from "./pages/Groups";
import { BillsPage, Home } from "./pages/Home";
import { PayPage } from "./pages/PayPage";
import { WalletPage } from "./pages/Wallet";

export default function App() {
  const route = useRoute();
  const w = useWallet();
  const [first, second] = route.path;
  const isPay = first === "pagar";

  useEffect(() => {
    initWallet();
    refreshRates();
  }, []);

  // Revisa cada 20 s si llegaron pagos de los cobros abiertos.
  useEffect(() => {
    if (isPay) return;
    const tick = () => {
      if (getState().settlements.some((x) => x.status === "pending")) checkPendingPayments();
    };
    tick();
    const t = setInterval(tick, 20000);
    return () => clearInterval(t);
  }, [isPay]);

  let page;
  if (isPay && second) page = <PayPage data={second} />;
  else if (first === "grupos" && second) page = <GroupDetail id={second} />;
  else if (first === "grupos") page = <GroupsPage />;
  else if (first === "cuentas") page = <BillsPage />;
  else if (first === "gasto" && second === "nuevo") page = <ExpenseForm key={route.query.toString()} groupId={route.query.get("grupo")} />;
  else if (first === "gasto" && second) page = <ExpenseDetail id={second} />;
  else if (first === "wallet") page = <WalletPage />;
  else page = <Home />;

  const nav = [
    { href: "#/", label: "Inicio", Icon: House, active: !first },
    { href: "#/grupos", label: "Grupos", Icon: Users, active: first === "grupos" },
    { href: "#/cuentas", label: "Cuentas", Icon: Receipt, active: first === "cuentas" || first === "gasto" },
    { href: "#/wallet", label: "Wallet", Icon: Wallet, active: first === "wallet" },
  ];

  return (
    <>
      <div className="backdrop" aria-hidden="true">
        <span className="b1" />
        <span className="b2" />
        <span className="b3" />
      </div>
      <div className="shell">
        <header className="topbar">
          <a className="brand" href={isPay ? undefined : "#/"}>
            <LogoMark />
            <span className="brand-name">Teja a Teja</span>
          </a>
          {!isPay && (
            <nav className="nav" aria-label="Principal">
              {nav.map((n) => (
                <a key={n.href} href={n.href} className={n.active ? "active" : ""}>{n.label}</a>
              ))}
            </nav>
          )}
          <a className="wallet-pill" href={isPay ? undefined : "#/wallet"}>
            <span className={`dot${w.address ? "" : " off"}`} />
            {w.address ? shortAddr(w.address) : "Sin wallet"}
          </a>
        </header>
        <main>{page}</main>
      </div>
      {!isPay && (
        <nav className="mobile-nav" aria-label="Principal">
          {nav.map(({ href, label, Icon, active }) => (
            <a key={href} href={href} className={active ? "active" : ""}>
              <Icon size={20} strokeWidth={1.8} aria-hidden />
              {label}
            </a>
          ))}
        </nav>
      )}
      <ToastHost />
    </>
  );
}
