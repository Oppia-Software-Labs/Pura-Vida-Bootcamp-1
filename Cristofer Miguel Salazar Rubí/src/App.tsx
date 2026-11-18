import { useCallback, useState } from "react";
import { ActivityList } from "./components/ActivityList";
import {
  ArrowUpRightIcon,
  ExternalIcon,
  LogoMark,
  SendIcon,
  ShieldIcon,
  SparkIcon,
  WalletIcon,
} from "./components/Icons";
import { PaymentForm } from "./components/PaymentForm";
import { WalletSection } from "./components/WalletSection";
import { useAccount } from "./hooks/useAccount";
import { useStellarWallet } from "./hooks/useStellarWallet";
import {
  STELLAR,
  fundWithFriendbot,
  shortAddress,
} from "./lib/stellar";

export default function App() {
  const wallet = useStellarWallet();
  const account = useAccount(wallet.address);
  const { refresh: refreshAccount } = account;
  const [funding, setFunding] = useState(false);
  const [fundMessage, setFundMessage] = useState<{
    tone: "ok" | "error";
    text: string;
  } | null>(null);
  const [activityKey, setActivityKey] = useState(0);

  const handleFund = useCallback(async () => {
    if (!wallet.address) return;

    setFunding(true);
    setFundMessage(null);

    try {
      await fundWithFriendbot(wallet.address);
      await refreshAccount();
      setActivityKey((key) => key + 1);
      setFundMessage({
        tone: "ok",
        text: "Friendbot envió 10,000 XLM de prueba a tu cuenta.",
      });
    } catch (fundError) {
      setFundMessage({
        tone: "error",
        text:
          fundError instanceof Error
            ? fundError.message
            : "Friendbot no respondió. Intenta de nuevo.",
      });
    } finally {
      setFunding(false);
    }
  }, [refreshAccount, wallet.address]);

  const handleSubmitted = useCallback(() => {
    void refreshAccount();
    setActivityKey((key) => key + 1);
  }, [refreshAccount]);

  return (
    <div className="page-shell" id="top">
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Pura Vida Wallet, inicio">
          <span className="brand-mark">
            <LogoMark size={38} />
          </span>
          <span className="brand-name">
            Pura Vida <em>Wallet</em>
          </span>
        </a>

        <div className="header-actions">
          <span className="network-pill">
            <span className="network-dot" />
            Testnet
          </span>

          {wallet.address ? (
            <a className="btn btn--header" href="#panel">
              <span className="header-address">
                {shortAddress(wallet.address, 4)}
              </span>
              <ArrowUpRightIcon size={16} />
            </a>
          ) : (
            <button
              className="btn btn--header"
              onClick={() => void wallet.connect()}
              disabled={wallet.connecting}
            >
              <WalletIcon size={17} />
              {wallet.connecting ? "Conectando…" : "Conectar wallet"}
            </button>
          )}
        </div>
      </header>

      <main>
        <section className="hero">
          <div className="hero-copy">
            <span className="eyebrow">
              <SparkIcon size={15} />
              Stellar · Testnet · Sin custodia
            </span>

            <h1>
              Stellar sin <em>enredos.</em>
              <br />
              Pura vida, de verdad.
            </h1>

            <p className="hero-lead">
              Conecta tu wallet, consulta tu saldo y envía XLM de prueba en
              segundos. Una app pequeña, construida con{" "}
              <strong>Stellar Raven</strong> como copiloto.
            </p>

            <div className="hero-actions">
              {wallet.address ? (
                <a className="btn btn--dark" href="#panel">
                  Ir a mi panel
                  <ArrowUpRightIcon size={18} />
                </a>
              ) : (
                <button
                  className="btn btn--dark"
                  onClick={() => void wallet.connect()}
                  disabled={wallet.connecting}
                >
                  <WalletIcon size={18} />
                  {wallet.connecting ? "Abriendo wallets…" : "Conectar wallet"}
                </button>
              )}
              <a className="btn btn--ghost" href="#como-funciona">
                Cómo funciona
              </a>
            </div>

            <ul className="hero-proof">
              <li>
                <ShieldIcon size={17} />
                Non-custodial
              </li>
              <li>
                <SparkIcon size={17} />
                Stellar Raven
              </li>
              <li>
                <WalletIcon size={17} />
                5 wallets
              </li>
            </ul>
          </div>

          <WalletSection
            wallet={wallet}
            account={account}
            funding={funding}
            fundMessage={fundMessage}
            onFund={handleFund}
          />
        </section>

        {wallet.address && (
          <section className="workspace" aria-label="Panel de tu cuenta">
            <PaymentForm
              address={wallet.address}
              nativeBalance={account.account?.nativeBalance ?? "0"}
              signTransaction={wallet.signTransaction}
              onSubmitted={handleSubmitted}
            />
            <ActivityList
              address={wallet.address}
              refreshKey={activityKey}
            />
          </section>
        )}

        <section className="raven-strip" aria-label="Sobre Stellar Raven">
          <div className="raven-strip__icon">
            <SparkIcon size={26} />
          </div>
          <div>
            <span className="field-label">El copiloto de este proyecto</span>
            <h2>Construida con Stellar Raven</h2>
            <p>
              Raven es el MCP oficial de Stellar. Lo usé para investigar la
              integración de wallets, las transacciones clásicas y las buenas
              prácticas de UX antes de escribir cada pieza.
            </p>
          </div>
          <a
            className="btn btn--ghost btn--small"
            href="https://raven.stellar.org/"
            target="_blank"
            rel="noreferrer"
          >
            Conocer Raven
            <ExternalIcon size={16} />
          </a>
        </section>

        <section className="how" id="como-funciona">
          <div className="how-head">
            <span className="eyebrow eyebrow--dark">
              <SendIcon size={15} />
              Tres pasos
            </span>
            <h2>De cero a tu primer pago</h2>
            <p>
              Todo ocurre en Testnet, la red de pruebas de Stellar. Ningún fondo
              real se mueve.
            </p>
          </div>

          <ol className="how-grid">
            <li>
              <span className="how-number">01</span>
              <h3>Conecta</h3>
              <p>
                Elige Albedo, Varial, xBull, Rabet o LOBSTR. Tu wallet guarda
                las llaves; la app solo recibe tu dirección pública.
              </p>
            </li>
            <li>
              <span className="how-number">02</span>
              <h3>Fondea</h3>
              <p>
                Si tu cuenta es nueva, Friendbot te regala XLM de prueba para
                activarla y pagar comisiones.
              </p>
            </li>
            <li>
              <span className="how-number">03</span>
              <h3>Envía</h3>
              <p>
                Escribe una dirección, el monto y firma. La transacción viaja a
                Horizon y queda registrada en la blockchain.
              </p>
            </li>
          </ol>
        </section>
      </main>

      <footer className="site-footer">
        <div className="footer-brand">
          <LogoMark size={30} />
          <span>Pura Vida Wallet</span>
        </div>
        <p>
          Hecho con calma en Costa Rica ·{" "}
          <a href={STELLAR.explorerUrl} target="_blank" rel="noreferrer">
            Stellar Expert
          </a>{" "}
          ·{" "}
          <a href={STELLAR.friendbotUrl} target="_blank" rel="noreferrer">
            Friendbot
          </a>
        </p>
        <span className="footer-note">Entregable 1 · Bootcamp</span>
      </footer>
    </div>
  );
}
