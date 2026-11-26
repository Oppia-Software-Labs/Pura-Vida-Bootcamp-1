import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useFolio } from "../folio-context";
import { shortAddress } from "../lib/format";
import { AlertIcon, CheckIcon, CopyIcon, WalletIcon } from "./Icons";

export function WalletButton() {
  const { wallet } = useFolio();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timeout = window.setTimeout(() => setCopied(false), 1600);
    return () => window.clearTimeout(timeout);
  }, [copied]);

  if (!wallet.address) {
    return (
      <button
        className="btn btn--ink btn--small"
        onClick={() => void wallet.connect()}
        disabled={wallet.connecting}
      >
        <WalletIcon size={16} />
        {wallet.connecting ? "Conectando…" : "Conectar wallet"}
      </button>
    );
  }

  async function copyAddress() {
    if (!wallet.address) return;
    try {
      await navigator.clipboard.writeText(wallet.address);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  return (
    <details className="wallet-menu">
      <summary className="wallet-menu__summary">
        <span
          className={`wallet-menu__dot ${
            wallet.networkMismatch ? "wallet-menu__dot--warn" : ""
          }`}
        />
        <span className="wallet-menu__address">
          {shortAddress(wallet.address, 4)}
        </span>
        <span className="wallet-menu__chevron" aria-hidden="true">
          ▾
        </span>
      </summary>

      <div className="wallet-menu__panel">
        <div className="wallet-menu__head">
          <span>Wallet conectada</span>
          <span className="wallet-menu__network">Testnet</span>
        </div>

        {wallet.networkMismatch && (
          <p className="wallet-menu__warning">
            <AlertIcon size={15} />
            Cambia tu wallet a Testnet para firmar.
          </p>
        )}

        <button className="wallet-menu__item" onClick={() => void copyAddress()}>
          {copied ? <CheckIcon size={16} /> : <CopyIcon size={16} />}
          {copied ? "Dirección copiada" : "Copiar dirección"}
        </button>

        <Link className="wallet-menu__item" to="/biblioteca">
          Mi biblioteca
        </Link>

        <button
          className="wallet-menu__item wallet-menu__item--danger"
          onClick={() => void wallet.disconnect()}
        >
          Desconectar
        </button>
      </div>
    </details>
  );
}
