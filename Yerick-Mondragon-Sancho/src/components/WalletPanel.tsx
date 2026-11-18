import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowUpRight,
  Check,
  Copy,
  ExternalLink,
  LoaderCircle,
  LogOut,
  RefreshCw,
  ShieldCheck,
  Wallet,
  AlertTriangle,
} from "lucide-react";
import type { useWallet } from "../hooks/useWallet";
import { formatXlm } from "../stellar/wallet";

export function WalletPanel({
  wallet,
  motionDisabled = false,
}: {
  wallet: ReturnType<typeof useWallet>;
  motionDisabled?: boolean;
}) {
  const [copyStatus, setCopyStatus] = useState("");
  const copyTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  useEffect(() => {
    setCopyStatus("");
    return () => clearTimeout(copyTimer.current);
  }, [wallet.identity?.address]);
  const copyAddress = async () => {
    if (!wallet.identity) return;
    try {
      await navigator.clipboard.writeText(wallet.identity.address);
      setCopyStatus("Dirección copiada");
    } catch {
      setCopyStatus(
        "No se pudo copiar. Seleccione la dirección y cópiela manualmente.",
      );
    }
    clearTimeout(copyTimer.current);
    copyTimer.current = setTimeout(() => setCopyStatus(""), 4000);
  };
  const loadingText =
    wallet.phase === "detecting"
      ? "Buscando Varial…"
      : wallet.phase === "authorizing"
        ? "Esperando su autorización en Varial…"
        : "Consultando Testnet…";
  const connected = wallet.phase === "connected";
  const phaseLabel = {
    disconnected: "Sin conectar",
    detecting: "Buscando wallet",
    authorizing: "Su autorización",
    loading: "Consultando",
    connected: "Conectada",
    "wrong-network": "Revise la red",
    error: "Revise la conexión",
  }[wallet.phase];
  return (
    <section
      id="explorador"
      className="wallet-panel"
      aria-labelledby="wallet-title"
      aria-busy={wallet.busy}
      data-phase={wallet.phase}
    >
      <div className="panel-heading">
        <span className="eyebrow">CENTRO DE EXPLORACIÓN</span>
        <motion.span
          className="connection-status"
          key={wallet.phase}
          initial={motionDisabled ? false : { opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: motionDisabled ? 0 : 0.25 }}
        >
          <span className={`status-dot ${connected ? "verified" : ""}`} />
          {wallet.disconnecting ? "Desconectando" : phaseLabel}
        </motion.span>
      </div>
      <div className="panel-body">
        <div className="flex items-center justify-between gap-4">
          <h2 id="wallet-title">Su cuenta, lista para explorar</h2>
          <Wallet size={20} className="muted-icon" />
        </div>
        <p className="panel-description">
          Consulte su dirección pública y su saldo de prueba.
        </p>
        <AnimatePresence mode="sync" initial={false}>
          <motion.div
            key={wallet.identity ? "account" : "welcome"}
            initial={motionDisabled ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, transition: { duration: 0 } }}
            transition={{ duration: motionDisabled ? 0 : 0.3 }}
          >
            {!wallet.identity ? (
              <div className="wallet-empty">
                <div className="orbit-emblem" aria-hidden="true">
                  <div className="emblem-ring ring-one" />
                  <div className="emblem-ring ring-two" />
                  <div className="emblem-core">
                    <span>✦</span>
                  </div>
                  <i className="orbit-dot" />
                </div>
                <span className="mini-label">
                  SU WALLET ES EL PUNTO DE PARTIDA
                </span>
                <p>
                  Conecte su wallet para consultar
                  <br />
                  su cuenta en la red de prueba.
                </p>
              </div>
            ) : (
              <div className="account-info">
                <div className="account-network">
                  <span
                    className={`status-dot ${connected ? "verified" : ""}`}
                  />
                  {wallet.phase === "wrong-network"
                    ? "Cambio de red necesario"
                    : connected
                      ? "Testnet verificada"
                      : "Verificando su cuenta"}
                </div>
                <div className="balance-block">
                  <span className="mini-label">SALDO DE PRUEBA</span>
                  <div className="balance-value">
                    {connected && wallet.account?.kind === "funded"
                      ? formatXlm(wallet.account.balance)
                      : "—"}
                    <span>XLM</span>
                  </div>
                  <span className="balance-caption">
                    {connected && wallet.account?.kind === "unfunded"
                      ? "Esta cuenta todavía no está activada en Testnet."
                      : "Lumens de Testnet · sin valor monetario"}
                  </span>
                </div>
                <div className="address-heading">
                  <span className="mini-label">DIRECCIÓN PÚBLICA</span>
                  <button
                    className="icon-button"
                    onClick={copyAddress}
                    aria-label="Copiar dirección pública"
                  >
                    {copyStatus === "Dirección copiada" ? (
                      <Check size={16} />
                    ) : (
                      <Copy size={16} />
                    )}
                  </button>
                </div>
                <code className="public-address">
                  {wallet.identity.address}
                </code>
                <p role="status" className="copy-feedback">
                  {copyStatus}
                </p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
        <div aria-live="polite" aria-atomic="true">
          {wallet.busy && (
            <p className="loading-message">
              <LoaderCircle className="loading-spinner" size={16} />
              {wallet.disconnecting ? "Desconectando…" : loadingText}
            </p>
          )}
          {wallet.phase === "wrong-network" && (
            <div className="notice">
              <AlertTriangle size={18} />
              <p>
                Seleccione <strong>Testnet</strong> en Varial y presione
                «Verifique la red». No consultamos saldos de otras redes.
              </p>
            </div>
          )}
          {wallet.error && (
            <div role="alert" className="notice">
              <AlertTriangle size={18} />
              <p>{wallet.error}</p>
            </div>
          )}
        </div>
        {wallet.missingWallet && (
          <a
            className="install-link"
            href="https://varialwallet.com"
            target="_blank"
            rel="noreferrer"
          >
            Instalar Varial <ExternalLink size={15} />
          </a>
        )}
        {connected && wallet.account?.kind === "unfunded" && (
          <p className="unfunded-help">
            Puede activar su cuenta con XLM de prueba desde{" "}
            <a
              href="https://lab.stellar.org/account/fund"
              target="_blank"
              rel="noreferrer"
            >
              Stellar Lab <ArrowUpRight size={13} />
            </a>
            . Después actualice el saldo.
          </p>
        )}
        {!wallet.authorized ? (
          <button
            className="primary-button panel-connect"
            disabled={wallet.busy}
            onClick={() => void wallet.connect()}
          >
            <Wallet size={18} />
            {wallet.busy ? "Conectando…" : "Conecte su wallet"}
            <ArrowUpRight size={18} />
          </button>
        ) : (
          <div className="account-actions">
            <button
              className="secondary-button"
              disabled={wallet.busy}
              onClick={() => void wallet.refresh()}
            >
              <RefreshCw size={15} />
              {wallet.phase === "wrong-network"
                ? "Verifique la red"
                : wallet.busy
                  ? "Consultando…"
                  : "Actualice el saldo"}
            </button>
            <button
              className="icon-button disconnect-button"
              disabled={wallet.disconnecting}
              onClick={() => void wallet.disconnectWallet()}
              aria-label="Desconectar wallet"
              title="Desconectar wallet"
            >
              <LogOut size={18} />
            </button>
          </div>
        )}
        <div className="panel-footnote">
          <ShieldCheck size={14} />
          <span>
            {connected
              ? `Consultado a las ${wallet.updatedAt?.toLocaleTimeString("es-CR")}`
              : "Sus claves permanecen en su wallet."}
          </span>
        </div>
      </div>
      <div className="panel-footer">
        <span className="status-dot" />
        SOLO STELLAR TESTNET<span>VARIAL ↗</span>
      </div>
    </section>
  );
}
