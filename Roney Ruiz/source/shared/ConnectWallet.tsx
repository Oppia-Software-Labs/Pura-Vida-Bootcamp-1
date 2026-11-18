import { useWallet } from "@hooks/useWallet";

const messages: Record<string, string> = {
  "Varial extension not installed": "Instala la extensión Varial para continuar.",
  "Wallet is not on testnet": "Cambia Varial a la red de prueba (testnet).",
};

export default function ConnectWallet() {
  const { address, error, connecting, connect } = useWallet();

  if (address) {
    return (
      <p className="break-all font-mono text-sm">Conectado: {address}</p>
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
