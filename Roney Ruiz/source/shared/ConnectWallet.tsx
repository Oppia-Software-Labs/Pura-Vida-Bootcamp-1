import { useBalance } from "@hooks/useBalance";
import { network } from "@config/network";
import CopyButton from "./CopyButton";
import { friendlyError } from "./friendlyError";
import { avatarGradient, formatXlm, shortAddress } from "./format";

type Wallet = {
  address: string | null;
  error: Error | null;
  connecting: boolean;
  connect: () => void;
};

function Balance({ address }: { address: string }) {
  const { balance, error, loading } = useBalance(address);

  if (loading) return <div className="h-12 w-48 animate-pulse rounded-lg bg-raised motion-reduce:animate-none" />;
  if (error) {
    return (
      <p role="alert" className="alert">
        {friendlyError(error)}
      </p>
    );
  }
  if (balance === null) {
    return (
      <div className="flex flex-col items-start gap-3 rounded-xl border border-warn/30 bg-warn/10 p-4">
        <p className="text-sm text-warn">Esta cuenta aún no tiene fondos en testnet.</p>
        <a
          className="btn btn-ghost"
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
      <p className="hint">Saldo disponible</p>
      <p className="text-4xl font-semibold tracking-tight">
        {formatXlm(balance)} <span className="text-lg font-medium text-muted">XLM</span>
      </p>
    </div>
  );
}

export default function ConnectWallet({ wallet }: { wallet: Wallet }) {
  const { address, error, connecting, connect } = wallet;

  if (address) {
    return (
      <section
        className="card flex flex-col gap-5 border-accent/25 bg-linear-to-br from-accent/15 via-surface/80 to-surface/80"
        aria-label="Wallet"
      >
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
            <span className="badge capitalize">{network.name}</span>
            <CopyButton text={address} label="Copiar dirección" />
          </div>
        </div>
        <Balance address={address} />
      </section>
    );
  }

  return (
    <section className="card flex flex-col items-start gap-6 py-8 sm:py-10" aria-label="Wallet">
      <div className="flex flex-col gap-3">
        <p className="eyebrow">Depósito de garantía</p>
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Tu depósito, sin que <span className="text-accent-strong">nadie lo custodie</span>.
        </h2>
        <p className="max-w-md text-muted">
          El dinero se bloquea en la red Stellar y el plazo decide quién puede retirarlo. Conecta Varial en testnet para
          empezar.
        </p>
      </div>
      <button type="button" onClick={connect} disabled={connecting} className="btn btn-primary px-6 py-3">
        {connecting && <span aria-hidden className="spinner" />}
        {connecting ? "Esperando a Varial..." : "Conectar Varial"}
      </button>
      {error && (
        <p role="alert" className="alert">
          {friendlyError(error)}
        </p>
      )}
    </section>
  );
}
