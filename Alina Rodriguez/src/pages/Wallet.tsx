import { Droplets, RefreshCw, Wallet } from "lucide-react";
import { useEffect, useState } from "react";
import { actions, ME, useAppState } from "../lib/store";
import {
  disconnectWallet,
  explorerAccount,
  fundWithFriendbot,
  NETWORK_PASSPHRASE,
  refreshBalance,
  useWallet,
} from "../lib/stellar";
import { ConnectWalletButton, copy, toast, TrustNote, WalletSteps } from "../components/ui";

export function WalletPage() {
  const s = useAppState();
  const w = useWallet();
  const me = s.people.find((p) => p.id === ME)!;
  const [name, setName] = useState(me.name === "Yo" ? "" : me.name);
  const [funding, setFunding] = useState(false);

  useEffect(() => {
    refreshBalance();
  }, []);

  const wrongNet = w.address && w.networkPassphrase && w.networkPassphrase !== NETWORK_PASSPHRASE;

  return (
    <div className="stack narrow">
      <div className="page-head">
        <div>
          <h1>Mi wallet</h1>
          <p className="muted small">Conecta tu wallet de Stellar para pagar y cobrar en XLM (Testnet).</p>
        </div>
      </div>

      <div className="tile solid stack">
        <p className="eyebrow">Tu nombre</p>
        <p className="small muted">Así te verán las personas en los links de cobro.</p>
        <div className="row">
          <input className="input" placeholder="Tu nombre" value={name} onChange={(e) => setName(e.target.value)} />
          <button className="btn soft" disabled={!name.trim()} onClick={() => { actions.updatePerson(ME, { name: name.trim() }); toast("Nombre guardado"); }}>
            Guardar
          </button>
        </div>
      </div>

      {!w.address ? (
        <div className="tile solid stack">
          <div className="row">
            <span className="icon-tile" style={{ width: 44, height: 44 }}><Wallet size={21} strokeWidth={1.8} aria-hidden /></span>
            <div className="grow">
              <h2>Conecta tu wallet</h2>
              <p className="small muted">LOBSTR, Varial (antes Freighter), xBull, Albedo, Hana y más.</p>
            </div>
          </div>
          <p className="eyebrow">¿Primera vez?</p>
          <WalletSteps />
          <ConnectWalletButton block />
          <TrustNote />
        </div>
      ) : (
        <div className="tile solid stack">
          <div className="spread">
            <h2>Wallet conectada</h2>
            <span className="badge paid">{w.walletName ?? "Conectada"}</span>
          </div>
          <div>
            <p className="eyebrow">Dirección</p>
            <p className="mono">{w.address}</p>
            <div className="row" style={{ marginTop: 8 }}>
              <button className="btn soft sm" onClick={() => copy(w.address!)}>Copiar</button>
              <a className="btn soft sm" href={explorerAccount(w.address)} target="_blank" rel="noreferrer">Ver en explorador</a>
            </div>
          </div>
          {wrongNet && <div className="alert error">Tu wallet no está en <b>Testnet</b>. Ábrela y cambia la red a Testnet para poder pagar.</div>}
          <div className="divider" />
          <div className="spread">
            <div>
              <p className="eyebrow">Balance</p>
              <p className="mid-num">{w.balance === null ? "—" : `${Number(w.balance).toLocaleString("es-CR", { maximumFractionDigits: 2 })} XLM`}</p>
              {w.balance === null && <p className="small muted">Tu cuenta aún no existe en Testnet.</p>}
            </div>
            <button className="btn soft sm" onClick={() => refreshBalance()} aria-label="Actualizar balance"><RefreshCw size={16} aria-hidden /></button>
          </div>
          <button
            className="btn soft block"
            disabled={funding}
            onClick={async () => {
              setFunding(true);
              try {
                await fundWithFriendbot(w.address!);
                toast("Cuenta fondeada con XLM de prueba");
              } catch (e) {
                toast((e as Error).message);
              } finally {
                setFunding(false);
              }
            }}
          >
            <Droplets size={17} aria-hidden /> {funding ? "Pidiendo XLM…" : "Obtener XLM de prueba (Friendbot)"}
          </button>
          <button className="btn danger sm" onClick={() => disconnectWallet()}>Desconectar</button>
        </div>
      )}
    </div>
  );
}
