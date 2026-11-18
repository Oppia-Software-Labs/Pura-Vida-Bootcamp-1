import { useBalance } from "@hooks/useBalance";
import type { AppContext } from "@hooks/useAppContext";
import { network } from "@config/network";
import CopyButton from "./CopyButton";
import { friendlyError } from "@helpers/friendlyError";
import { avatarGradient, formatXlm, shortAddress } from "@helpers/format";
import { buttonClass, cardClass } from "@helpers/classes";
import { Alert, Button, Spinner } from "./primitives";

function Balance({ address, refreshKey }: { address: string; refreshKey: number }) {
  const { balance, error, loading } = useBalance(address, refreshKey);

  if (loading) return <div className="h-12 w-48 animate-pulse rounded-lg bg-raised motion-reduce:animate-none" />;
  if (error) return <Alert>{friendlyError(error)}</Alert>;
  if (balance === null) {
    return (
      <div className="flex flex-col items-start gap-3 rounded-xl border border-warn/30 bg-warn/10 p-4">
        <p className="text-sm text-warn">Esta cuenta aún no tiene fondos en testnet.</p>
        <a
          className={buttonClass({ variant: "ghost" })}
          href={`${network.friendbotUrl}/?addr=${address}`}
          target="_blank"
          rel="noreferrer"
        >
          Fondear con Friendbot
        </a>
      </div>
    );
  }
  return (
    <div>
      <p className="text-xs text-faint">Saldo disponible</p>
      <p className="text-4xl font-semibold tracking-tight">
        {formatXlm(balance)} <span className="text-lg font-medium text-muted">XLM</span>
      </p>
    </div>
  );
}

export default function ConnectWallet({ wallet, refreshKey }: { wallet: AppContext["wallet"]; refreshKey: number }) {
  const { address, error, connecting, connect } = wallet;

  if (address) {
    return (
      <section className={`${cardClass({ tone: "accent" })} flex flex-col gap-5`} aria-label="Wallet">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span
              aria-hidden
              className="size-10 shrink-0 rounded-full"
              style={{ background: avatarGradient(address) }}
            />
            <div className="min-w-0">
              <p className="flex items-center gap-2 text-sm font-medium">
                <span aria-hidden className="size-2 rounded-full bg-ok" />
                Wallet conectada
              </p>
              <p className="font-mono text-xs text-muted" title={address}>
                {shortAddress(address)}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className="rounded-full border border-warn/30 bg-warn/10 px-2.5 py-0.5 text-xs font-semibold tracking-wide text-warn capitalize">
              {network.name}
            </span>
            <CopyButton text={address} label="Copiar dirección" />
          </div>
        </div>
        <Balance address={address} refreshKey={refreshKey} />
      </section>
    );
  }

  return (
    <section className={`${cardClass({ padding: "roomy" })} flex flex-col items-start gap-6`} aria-label="Wallet">
      <div className="flex flex-col gap-3">
        <p className="text-xs font-semibold tracking-widest text-accent-strong uppercase">Depósito de garantía</p>
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Tu depósito, sin que <span className="text-accent-strong">nadie lo custodie</span>.
        </h2>
        <p className="max-w-md text-muted">
          El dinero se bloquea en la red Stellar y el plazo decide quién puede retirarlo. Conecta Varial en testnet para
          empezar.
        </p>
      </div>
      <Button size="lg" onClick={connect} disabled={connecting}>
        {connecting && <Spinner />}
        {connecting ? "Esperando a Varial..." : "Conectar Varial"}
      </Button>
      {error && <Alert>{friendlyError(error)}</Alert>}
    </section>
  );
}
