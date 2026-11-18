import { config, shortAddress } from "../lib/stellar";

type Props = {
  address: string | null;
  wrongNetwork: boolean;
  connecting: boolean;
  error: string | null;
  onConnect: () => void;
  onDisconnect: () => void;
};

export function WalletSection({ address, wrongNetwork, connecting, error, onConnect, onDisconnect }: Props) {
  return (
    <section className="card" aria-labelledby="wallet-title">
      <h2 id="wallet-title">1 · Conecta tu wallet</h2>
      {!address ? (
        <>
          <p className="muted">
            Usa Varial (antes Freighter), xBull, LOBSTR, Albedo u otra wallet de Stellar. La app trabaja en <b>Testnet</b>.
          </p>
          <button className="btn primary" onClick={onConnect} disabled={connecting}>
            {connecting ? "Conectando…" : "Conectar wallet"}
          </button>
        </>
      ) : (
        <>
          <div className="row">
            <span className="dot ok" aria-hidden /> Conectada:
            <a className="mono" href={`${config.explorerUrl}/account/${address}`} target="_blank" rel="noreferrer" title={address}>
              {shortAddress(address)}
            </a>
            <button className="btn ghost" onClick={() => navigator.clipboard?.writeText(address)}>Copiar</button>
            <button className="btn ghost" onClick={onDisconnect}>Desconectar</button>
          </div>
          {wrongNetwork && (
            <p className="alert warn">Tu wallet no está en Testnet. Cámbiala a Testnet para firmar transacciones.</p>
          )}
        </>
      )}
      {error && <p className="alert error">{error}</p>}
    </section>
  );
}
