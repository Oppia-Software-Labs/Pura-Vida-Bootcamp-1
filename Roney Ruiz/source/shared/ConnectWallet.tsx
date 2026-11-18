import { useBalance } from "@hooks/useBalance";
import { formatStroops } from "@bloc/entity/money";
import { network } from "@config/network";

import { friendlyError } from "./friendlyError";

function Balance({ address }: { address: string }) {
  const { balance, error, loading } = useBalance(address);

  if (loading) return <p className="text-sm">Consultando saldo...</p>;
  if (error) {
    return (
      <p role="alert" className="text-sm text-red-600">
        {friendlyError(error)}
      </p>
    );
  }
  if (balance === null) {
    return (
      <p className="text-sm">
        Cuenta sin fondos.{" "}
        <a
          className="underline"
          href={`${network.friendbotUrl}/?addr=${address}`}
          target="_blank"
          rel="noreferrer"
        >
          Fondear con Friendbot
        </a>
      </p>
    );
  }
  return <p className="text-sm">Saldo: {formatStroops(balance)} XLM</p>;
}

type Wallet = {
  address: string | null;
  error: Error | null;
  connecting: boolean;
  connect: () => void;
};

export default function ConnectWallet({ wallet }: { wallet: Wallet }) {
  const { address, error, connecting, connect } = wallet;

  if (address) {
    return (
      <div className="flex flex-col items-start gap-2">
        <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-semibold uppercase text-amber-900">
          {network.name}
        </span>
        <p className="break-all font-mono text-sm">{address}</p>
        <Balance address={address} />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-start gap-3">
      <button
        type="button"
        onClick={connect}
        disabled={connecting}
        className="rounded bg-black px-4 py-2 text-white disabled:opacity-50"
      >
        {connecting ? "Conectando..." : "Conectar wallet"}
      </button>
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {friendlyError(error)}
        </p>
      )}
    </div>
  );
}
