import { useCallback, useEffect, useState } from "react";
import { Compass, Sparkles } from "lucide-react";
import {
  fetchAccountSnapshot,
  fetchRecentPayments,
  fundWithFriendbot,
  getNetworkConfig,
  type AccountSnapshot,
  type PaymentRecord,
  type StellarNetworkId,
} from "./lib/stellar";
import { useStellarWallet } from "./hooks/useStellarWallet";
import { WalletSection } from "./components/WalletSection";
import { BalanceCard } from "./components/BalanceCard";
import { SendPaymentForm } from "./components/SendPaymentForm";
import { PaymentsTable } from "./components/PaymentsTable";

export function App() {
  const [networkId, setNetworkId] = useState<StellarNetworkId>("testnet");
  const wallet = useStellarWallet(networkId);
  const [account, setAccount] = useState<AccountSnapshot | null>(null);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loadingAccount, setLoadingAccount] = useState(false);
  const [accountError, setAccountError] = useState<string | null>(null);
  const [funding, setFunding] = useState(false);
  const [fundMessage, setFundMessage] = useState<string | null>(null);

  const networkConfig = getNetworkConfig(networkId);

  const loadAccountData = useCallback(
    async (targetAddress: string, targetNetwork: StellarNetworkId) => {
      setLoadingAccount(true);
      setAccountError(null);

      try {
        const [snapshot, recentPayments] = await Promise.all([
          fetchAccountSnapshot(targetAddress, targetNetwork),
          fetchRecentPayments(targetAddress, targetNetwork, 10),
        ]);
        setAccount(snapshot);
        setPayments(recentPayments);
      } catch (err) {
        setAccountError(
          err instanceof Error
            ? err.message
            : "No se pudo consultar la cuenta en Stellar Horizon."
        );
      } finally {
        setLoadingAccount(false);
      }
    },
    []
  );

  useEffect(() => {
    if (!wallet.address) {
      setAccount(null);
      setPayments([]);
      setAccountError(null);
      setFundMessage(null);
      return;
    }
    setFundMessage(null);
    void loadAccountData(wallet.address, networkId);
  }, [wallet.address, networkId, loadAccountData]);

  const handleRefresh = useCallback(async () => {
    if (!wallet.address) return;
    setFundMessage(null);
    await loadAccountData(wallet.address, networkId);
  }, [wallet.address, networkId, loadAccountData]);

  const handleFundWithFriendbot = useCallback(async () => {
    if (!wallet.address || networkId !== "testnet") return;
    setFunding(true);
    setAccountError(null);
    setFundMessage(null);

    try {
      await fundWithFriendbot(wallet.address);
      setFundMessage(
        "Cuenta fondeada con éxito en Testnet mediante Friendbot (+10,000 XLM)."
      );
      await loadAccountData(wallet.address, "testnet");
    } catch (err) {
      setAccountError(
        err instanceof Error
          ? err.message
          : "Ocurrió un error al solicitar fondos a Friendbot."
      );
    } finally {
      setFunding(false);
    }
  }, [wallet.address, networkId, loadAccountData]);

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand">
          <span className="brand-icon" aria-hidden="true">
            <Compass size={22} />
          </span>
          <div>
            <h1>Pura Vida Stellar</h1>
            <p className="subtitle">
              Stellar Wallet Dashboard · Entregable 1 · Franco Vinicio Rojas Lagos
            </p>
          </div>
        </div>

        <a
          href="https://raven.stellar.org/"
          target="_blank"
          rel="noreferrer"
          className="raven-pill"
        >
          <Sparkles size={14} aria-hidden="true" />
          Asistido con Stellar Raven MCP
        </a>
      </header>

      <main className="app-main">
        <WalletSection
          address={wallet.address}
          mode={wallet.mode}
          walletName={wallet.walletName}
          networkId={networkId}
          isConnecting={wallet.isConnecting}
          error={wallet.error}
          onChangeNetwork={setNetworkId}
          onConnect={wallet.connect}
          onDisconnect={wallet.disconnect}
          onConnectWatch={wallet.connectWatchAddress}
          onGenerateDemo={wallet.generateDemoAddress}
          onOpenProfile={wallet.openProfile}
          onClearError={wallet.clearError}
        />

        {wallet.address ? (
          <>
            <div className="dashboard-grid">
              <BalanceCard
                account={account}
                networkId={networkId}
                loading={loadingAccount}
                funding={funding}
                fundMessage={fundMessage}
                error={accountError}
                onRefresh={handleRefresh}
                onFundWithFriendbot={handleFundWithFriendbot}
              />

              <SendPaymentForm
                sourceAddress={wallet.address}
                mode={wallet.mode}
                networkId={networkId}
                funded={Boolean(account?.funded)}
                onSignTransaction={wallet.signTransaction}
                onPaymentSuccess={handleRefresh}
              />
            </div>

            <PaymentsTable
              payments={payments}
              networkId={networkId}
              loading={loadingAccount}
              funded={Boolean(account?.funded)}
            />
          </>
        ) : (
          <section className="card empty-guide" aria-labelledby="guide-heading">
            <h2 id="guide-heading">¿Qué puedes probar en esta aplicación?</h2>
            <ul className="feature-list">
              <li>
                <strong>Conexión multi-wallet:</strong> Conecta LOBSTR, Freighter / Varial,
                xBull, Albedo o Hana usando{" "}
                <code>@creit-tech/stellar-wallets-kit</code> v2.
              </li>
              <li>
                <strong>Selector Testnet / Mainnet:</strong> Prueba gratis en Testnet con
                Friendbot o cambia a Mainnet para inspeccionar y operar con wallets como
                LOBSTR.
              </li>
              <li>
                <strong>Consulta en vivo a Horizon:</strong> Visualiza balance en XLM,
                reserva mínima estimada y trustlines con{" "}
                <code>@stellar/stellar-sdk</code> v17.
              </li>
              <li>
                <strong>Pagos firmados e historial:</strong> Construye, previsualiza, firma y
                envía transacciones de XLM con seguimiento inmediato en Stellar Expert.
              </li>
            </ul>
          </section>
        )}
      </main>

      <footer className="app-footer">
        <p>
          Construido para el <strong>Pura Vida Bootcamp · Oppia Software Labs</strong> usando{" "}
          <a href="https://raven.stellar.org/" target="_blank" rel="noreferrer">
            Stellar Raven
          </a>{" "}
          (MCP oficial de Stellar) · Red activa: {networkConfig.label}.
        </p>
      </footer>
    </div>
  );
}
