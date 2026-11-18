import { useBalance } from "@hooks/useBalance";
import { useWallet } from "@hooks/useWallet";
import { formatStroops } from "@bloc/entity/money";
import { network } from "@config/network";

const messages: Record<string, string> = {
  "Varial extension not installed": "Instala la extensión Varial para continuar.",
  "Wallet is not on testnet": "Cambia Varial a la red de prueba (testnet).",
  "Horizon request failed": "No se pudo consultar el saldo. Intenta de nuevo en un momento.",
};

function Balance({ address }: { address: string }) {
  const { balance, error, loading } = useBalance(address);

  if (loading) return <p className="text-sm">Consultando saldo...</p>;
  if (error) {
    return (
      <p role="alert" className="text-sm text-red-600">
        {messages[error.message] ?? "No se pudo consultar el saldo."}
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

export default function ConnectWallet() {
  const { address, error, connecting, connect } = useWallet();

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
          {messages[error.message] ?? "No se pudo conectar la wallet."}
        </p>
      )}
    </div>
  );
}
