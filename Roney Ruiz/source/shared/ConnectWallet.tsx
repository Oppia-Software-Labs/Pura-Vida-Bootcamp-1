import { useBalance } from "@hooks/useBalance";
import { network } from "@config/network";
import CopyButton from "./CopyButton";
import { friendlyError } from "./friendlyError";
import { formatXlm, shortAddress } from "./format";

type Wallet = {
  address: string | null;
  error: Error | null;
  connecting: boolean;
  connect: () => void;
};

function Balance({ address }: { address: string }) {
  const { balance, error, loading } = useBalance(address);

  if (loading) return <div className="h-9 w-40 animate-pulse rounded-lg bg-raised motion-reduce:animate-none" />;
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
      <p className="hint">Saldo</p>
      <p className="text-3xl font-semibold tracking-tight">
        {formatXlm(balance)} <span className="text-lg font-medium text-muted">XLM</span>
      </p>
    </div>
  );
}

export default function ConnectWallet({ wallet }: { wallet: Wallet }) {
  const { address, error, connecting, connect } = wallet;

  if (address) {
    return (
      <section className="card flex flex-col gap-5" aria-label="Wallet">
        <div className="flex items-center justify-between gap-3">
          <p className="flex items-center gap-2 text-sm text-muted">
            <span aria-hidden className="size-2 rounded-full bg-ok" />
            Wallet conectada
          </p>
          <span className="badge capitalize">{network.name}</span>
        </div>
        <div className="flex items-center justify-between gap-3">
          <p className="font-mono text-sm text-muted" title={address}>
            {shortAddress(address)}
          </p>
          <CopyButton text={address} label="Copiar dirección" />
        </div>
        <Balance address={address} />
      </section>
    );
  }

  return (
    <section className="card flex flex-col items-start gap-5" aria-label="Wallet">
      <div className="flex flex-col gap-1.5">
        <h2 className="text-lg font-semibold">Conecta tu wallet</h2>
        <p className="text-sm text-muted">
          Usa la extensión Varial en testnet para crear y reclamar depósitos. Es dinero de prueba, sin validez legal.
        </p>
      </div>
      <button type="button" onClick={connect} disabled={connecting} className="btn btn-primary">
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
