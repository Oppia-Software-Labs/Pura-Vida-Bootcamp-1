import type { ReactNode } from "react";
import { useAppContext } from "@hooks/useAppContext";
import { cardClass } from "@helpers/classes";
import { friendlyError } from "@helpers/friendlyError";
import { Alert, Button, Spinner } from "./primitives";

type RequireWalletProps = {
  message: string;
  children: (address: string) => ReactNode;
};

export default function RequireWallet({ message, children }: RequireWalletProps) {
  const { wallet } = useAppContext();

  if (wallet.restoring) {
    return <div className="h-40 animate-pulse rounded-2xl bg-raised motion-reduce:animate-none" />;
  }

  if (!wallet.address) {
    return (
      <section className={`${cardClass()} flex flex-col items-start gap-4`} aria-label="Conectar wallet">
        <div className="flex flex-col gap-1.5">
          <h3 className="text-lg font-semibold">Conecta tu wallet</h3>
          <p className="text-sm text-muted">{message}</p>
        </div>
        <Button onClick={wallet.connect} disabled={wallet.connecting}>
          {wallet.connecting && <Spinner />}
          {wallet.connecting ? "Esperando a Varial..." : "Conectar Varial"}
        </Button>
        {wallet.error && <Alert>{friendlyError(wallet.error)}</Alert>}
      </section>
    );
  }

  return <>{children(wallet.address)}</>;
}
