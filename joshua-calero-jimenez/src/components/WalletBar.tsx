import { Link } from "react-router-dom";
import { useWallet } from "../lib/wallet";
import { shortAddress } from "../lib/validation";
import { Button, Notice } from "./ui";

export default function WalletBar() {
  const { address, connecting, connect, disconnect, onTestnet, error, clearError } = useWallet();

  return (
    <header className="mx-auto w-full max-w-4xl px-4 pt-6">
      <div className="flex items-center justify-between gap-4">
        <Link to="/" className="font-display text-base font-light tracking-wide">
          Órbita
        </Link>

        {address ? (
          <div className="flex items-center gap-4 text-sm">
            <span title={address} className="font-mono text-muted">
              {shortAddress(address)}
            </span>
            <button onClick={() => void disconnect()} className="text-muted transition-colors hover:text-ink">
              Desconectar
            </button>
          </div>
        ) : (
          <Button variant="secondary" onClick={() => void connect()} disabled={connecting}>
            {connecting ? "Conectando…" : "Conectar wallet"}
          </Button>
        )}
      </div>

      {(address && onTestnet === false) || error ? (
        <div className="mt-6 space-y-3">
          {address && onTestnet === false && (
            <Notice tone="danger">
              Tu wallet no está en Testnet. Cambia la red a Testnet en tu wallet y vuelve a esta pestaña.
            </Notice>
          )}
          {error && (
            <Notice tone="danger">
              {error}{" "}
              <button onClick={clearError} className="ml-2 underline underline-offset-4">
                Cerrar
              </button>
            </Notice>
          )}
        </div>
      ) : null}
    </header>
  );
}
