"use client";

import { useState } from "react";
import { Icon } from "./Icon";
import { useJourney } from "./JourneyProvider";
import { TestnetBadge } from "./SiteChrome";

export function shortened(value: string, width = 7) {
  return `${value.slice(0, width)}…${value.slice(-width)}`;
}

export function WalletInstructions({ wrongNetwork = false }: { wrongNetwork?: boolean }) {
  return (
    <div className={wrongNetwork ? "notice notice-warning" : "notice"} role={wrongNetwork ? "alert" : undefined}>
      <Icon name={wrongNetwork ? "warning" : "info"}/>
      <div>
        <strong>{wrongNetwork ? "Cambiá a Testnet para continuar" : "Prepará Freighter en tu navegador"}</strong>
        <ol>
          {!wrongNetwork && <li>Instalá la extensión desde <a className="text-link" href="https://www.freighter.app/" target="_blank" rel="noreferrer">el sitio oficial <Icon name="external" width="13" height="13"/></a> y creá o abrí una billetera.</li>}
          <li>Abrí la extensión y elegí <strong>Testnet</strong> en el selector de redes.</li>
          <li>Volvé a esta pestaña. Si hace falta, conectá Freighter de nuevo.</li>
        </ol>
      </div>
    </div>
  );
}

export function LevelWallet({ onContinue }: { onContinue: () => void }) {
  const { wallet, walletBusy, walletError, connect, disconnect } = useJourney();
  const [copy, setCopy] = useState<string | null>(null);

  async function copyAddress(address: string) {
    try {
      await navigator.clipboard.writeText(address);
      setCopy("Dirección copiada.");
    } catch {
      setCopy("Podés seleccionar la dirección y copiarla manualmente.");
    }
  }

  return (
    <div className="level-flow">
      <p className="lead">Freighter es una billetera para Stellar. La extensión te permite compartir tu dirección pública y más adelante aprobar la firma del pago.</p>
      {wallet?.testnet ? (
        <div className="wallet-card">
          <div className="wallet-heading"><Icon name="wallet"/><strong>{shortened(wallet.address)}</strong><TestnetBadge/></div>
          <p className="muted">Dirección pública completa</p>
          <div className="copy-line">
            <code>{wallet.address}</code>
            <button aria-label="Copiar dirección pública" className="icon-button" onClick={() => copyAddress(wallet.address)}><Icon name="copy"/></button>
          </div>
          {copy && <p className="muted" role="status">{copy}</p>}
          <small>Podés compartir esta dirección para recibir pagos. La clave secreta queda en tu billetera.</small>
        </div>
      ) : <WalletInstructions wrongNetwork={wallet?.testnet === false}/>}
      {walletError && <p className="notice notice-error" role="alert">{walletError}</p>}
      <div className="action-row">
        {wallet ? (
          <button className="button button-secondary" onClick={() => { disconnect(); setCopy(null); }}>Desconectar</button>
        ) : (
          <><button className="button button-primary" disabled={walletBusy} onClick={() => void connect()}><Icon name="wallet"/>{walletBusy ? "Conectando…" : "Conectar Freighter"}</button><TestnetBadge/></>
        )}
        {wallet?.testnet && <button className="button button-primary" onClick={onContinue}>Explorar mi cuenta <Icon name="arrow"/></button>}
      </div>
    </div>
  );
}
