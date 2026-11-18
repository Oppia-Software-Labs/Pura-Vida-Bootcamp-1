import { useEffect, useState } from "react";
import type { AccountState } from "../hooks/useAccount";
import type { StellarWallet } from "../hooks/useStellarWallet";
import {
  explorerAccountUrl,
  formatAmount,
  shortAddress,
} from "../lib/stellar";
import {
  AlertIcon,
  CheckIcon,
  CopyIcon,
  ExternalIcon,
  PlusIcon,
  RefreshIcon,
  ShieldIcon,
  SparkIcon,
  WalletIcon,
} from "./Icons";

interface WalletSectionProps {
  wallet: StellarWallet;
  account: AccountState;
  funding: boolean;
  fundMessage: { tone: "ok" | "error"; text: string } | null;
  onFund: () => Promise<void>;
}

export function WalletSection({
  wallet,
  account,
  funding,
  fundMessage,
  onFund,
}: WalletSectionProps) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timeout = window.setTimeout(() => setCopied(false), 1600);
    return () => window.clearTimeout(timeout);
  }, [copied]);

  async function copyAddress() {
    if (!wallet.address) return;

    try {
      await navigator.clipboard.writeText(wallet.address);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  if (!wallet.address) {
    return (
      <section className="wallet-card wallet-card--empty" id="wallet">
        <div className="wallet-card__glow" aria-hidden="true" />

        <div className="wallet-step">
          <span className="step-dot">01</span>
          <span>Tu entrada a Stellar</span>
        </div>

        <h2 className="wallet-title">Conecta tu wallet</h2>
        <p className="wallet-copy">
          Elige tu wallet favorita, autoriza la conexión y empieza a mover XLM
          de prueba. Sin llaves privadas, sin custodia.
        </p>

        <button
          className="btn btn--lime btn--wide"
          onClick={() => void wallet.connect()}
          disabled={wallet.connecting}
        >
          <WalletIcon size={21} />
          {wallet.connecting ? "Abriendo wallets…" : "Conectar wallet"}
        </button>

        <p className="wallet-wallets">
          Albedo · Varial · xBull · Rabet · LOBSTR
        </p>

        {wallet.error && (
          <p className="inline-alert" role="alert">
            <AlertIcon size={17} />
            {wallet.error}
          </p>
        )}

        <div className="wallet-footnote">
          <ShieldIcon size={17} />
          <span>
            Red <strong>Testnet</strong>. Tu wallet firma; la app nunca ve tus
            llaves.
          </span>
        </div>
      </section>
    );
  }

  const isLoading = account.status === "loading";
  const isUnfunded = account.status === "unfunded";
  const otherBalances =
    account.account?.balances.filter((balance) => balance.asset !== "XLM") ??
    [];

  return (
    <section className="wallet-card" id="wallet" aria-busy={isLoading}>
      <div className="wallet-card__glow" aria-hidden="true" />

      <div className="wallet-connected-head">
        <span className="live-pill">
          <span className="live-dot" />
          Wallet conectada
        </span>
        <button
          className="text-button"
          onClick={() => void wallet.disconnect()}
        >
          Desconectar
        </button>
      </div>

      <div className="address-row">
        <div>
          <span className="field-label">Dirección pública</span>
          <code className="address-code">{shortAddress(wallet.address, 6)}</code>
        </div>
        <div className="address-actions">
          <button
            className="icon-button icon-button--dark"
            onClick={() => void copyAddress()}
            aria-label="Copiar dirección"
            title="Copiar dirección"
          >
            {copied ? <CheckIcon size={18} /> : <CopyIcon size={18} />}
          </button>
          <a
            className="icon-button icon-button--dark"
            href={explorerAccountUrl(wallet.address)}
            target="_blank"
            rel="noreferrer"
            aria-label="Ver cuenta en Stellar Expert"
            title="Ver en Stellar Expert"
          >
            <ExternalIcon size={18} />
          </a>
        </div>
      </div>

      <div className="balance-block">
        <div className="balance-label">
          <span>Saldo disponible</span>
          <button
            className="icon-button icon-button--dark"
            onClick={() => void account.refresh()}
            aria-label="Actualizar saldo"
            title="Actualizar saldo"
            disabled={isLoading}
          >
            <RefreshIcon
              size={17}
              className={isLoading ? "spin" : undefined}
            />
          </button>
        </div>

        {isLoading && !account.account ? (
          <div className="balance-skeleton" aria-label="Cargando saldo" />
        ) : (
          <div className="balance-value">
            <span className="balance-number">
              {isUnfunded
                ? "0"
                : formatAmount(account.account?.nativeBalance ?? "0")}
            </span>
            <span className="balance-unit">XLM</span>
          </div>
        )}

        {otherBalances.length > 0 && (
          <ul className="asset-list">
            {otherBalances.map((balance) => (
              <li key={`${balance.asset}-${balance.balance}`}>
                <span>{balance.asset}</span>
                <strong>{formatAmount(balance.balance)}</strong>
              </li>
            ))}
          </ul>
        )}
      </div>

      {wallet.networkMismatch && (
        <p className="inline-alert" role="alert">
          <AlertIcon size={17} />
          Tu wallet está en otra red. Cámbiala a <strong>Testnet</strong> antes
          de firmar.
        </p>
      )}

      {account.error && (
        <p className="inline-alert" role="alert">
          <AlertIcon size={17} />
          {account.error}
        </p>
      )}

      {isUnfunded && (
        <div className="unfunded-box">
          <div>
            <strong>Esta cuenta todavía no existe en Testnet.</strong>
            <p>Pídele XLM de prueba a Friendbot para activarla.</p>
          </div>
          <button
            className="btn btn--lime"
            onClick={() => void onFund()}
            disabled={funding}
          >
            <PlusIcon size={18} />
            {funding ? "Fondeando…" : "Fondear con Friendbot"}
          </button>
        </div>
      )}

      {fundMessage && (
        <p
          className={`inline-message inline-message--${fundMessage.tone}`}
          role="status"
        >
          {fundMessage.tone === "ok" ? (
            <CheckIcon size={17} />
          ) : (
            <AlertIcon size={17} />
          )}
          {fundMessage.text}
        </p>
      )}

      <div className="wallet-footnote">
        <SparkIcon size={17} />
        <span>
          Red <strong>Testnet</strong> · XLM sin valor real. Ideal para probar.
        </span>
      </div>
    </section>
  );
}
