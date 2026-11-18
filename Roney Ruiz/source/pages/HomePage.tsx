import { Link, Navigate } from "react-router";
import { useAppContext } from "@hooks/useAppContext";
import { readSharedDepositId } from "@bloc/storage/deposits";
import ConnectWallet from "@shared/ConnectWallet";
import HowItWorks from "@shared/HowItWorks";

const actions = [
  {
    to: "/crear",
    eyebrow: "Como inquilino",
    title: "Crear un depósito",
    body: "Bloquea el monto en la red y define cuándo puede reclamar el arrendador.",
  },
  {
    to: "/depositos",
    eyebrow: "Como inquilino o arrendador",
    title: "Ver mis depósitos",
    body: "Consulta el estado y la cuenta regresiva, y reclama cuando te toque.",
  },
];

export default function HomePage() {
  const { wallet, balanceKey } = useAppContext();
  const legacyLinkId = readSharedDepositId();

  if (legacyLinkId) return <Navigate to={`/depositos/${legacyLinkId}`} replace />;

  return (
    <>
      {wallet.restoring ? (
        <div className="h-48 animate-pulse rounded-2xl bg-raised motion-reduce:animate-none" />
      ) : (
        <ConnectWallet wallet={wallet} refreshKey={balanceKey} />
      )}

      {wallet.address && (
        <nav aria-label="Acciones" className="flex flex-col gap-3">
          <p className="text-xs font-semibold tracking-widest text-accent-strong uppercase">¿Qué quieres hacer?</p>
          <div className="grid gap-3 sm:grid-cols-2">
            {actions.map((action) => (
              <Link
                key={action.to}
                to={action.to}
                className="group flex flex-col gap-1.5 rounded-2xl border border-line bg-surface/80 p-5 transition-colors hover:border-accent/50"
              >
                <span className="text-xs text-faint">{action.eyebrow}</span>
                <span className="flex items-center justify-between text-lg font-semibold">
                  {action.title}
                  <span aria-hidden className="text-accent-strong transition-transform group-hover:translate-x-1">
                    →
                  </span>
                </span>
                <span className="text-sm text-muted">{action.body}</span>
              </Link>
            ))}
          </div>
        </nav>
      )}

      <HowItWorks />
    </>
  );
}
