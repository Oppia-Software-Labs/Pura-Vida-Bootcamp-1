"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { loadAccountSummary, type AccountSummary } from "@/lib/stellar/account";
import { displayDecimal } from "@/lib/stellar/amount";
import { explorerLink } from "@/lib/stellar/config";
import { errorMessage } from "@/lib/stellar/errors";
import { fundTestAccount } from "@/lib/stellar/friendbot";
import { requireWalletOnTestnet } from "@/lib/stellar/wallet";
import { Icon } from "./Icon";
import { shortened } from "./LevelWallet";
import { TestnetBadge } from "./SiteChrome";

const dateFormat = new Intl.DateTimeFormat("es-CR", { dateStyle: "medium", timeStyle: "short" });

export function LevelAccount({ address, onContinue }: { address: string; onContinue: () => void }) {
  const [summary, setSummary] = useState<AccountSummary | null>();
  const [busy, setBusy] = useState(true);
  const [funding, setFunding] = useState(false);
  const [error, setError] = useState("");
  const [funded, setFunded] = useState("");
  const operation = useRef(0);
  const fundInProgress = useRef(false);

  const refresh = useCallback(async () => {
    const ticket = ++operation.current;
    setBusy(true);
    setError("");
    try {
      await requireWalletOnTestnet(address);
      const data = await loadAccountSummary(address);
      await requireWalletOnTestnet(address);
      if (ticket === operation.current) setSummary(data);
    } catch (cause) {
      if (ticket === operation.current) {
        setSummary(undefined);
        setError(errorMessage(cause));
      }
    } finally {
      if (ticket === operation.current) setBusy(false);
    }
  }, [address]);

  useEffect(() => {
    void refresh();
    return () => { operation.current++; };
  }, [refresh]);

  async function fund() {
    if (fundInProgress.current) return;
    fundInProgress.current = true;
    setFunding(true);
    setError("");
    try {
      await requireWalletOnTestnet(address);
      const created = await fundTestAccount(address);
      setFunded(created
        ? "Friendbot registró tu cuenta y le envió XLM de prueba. Si el saldo tarda en aparecer, actualizá la cuenta."
        : "Tu cuenta ya está registrada en Testnet. Actualizamos sus datos.");
      await refresh();
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setFunding(false);
      fundInProgress.current = false;
    }
  }

  return (
    <div className="level-flow">
      <p className="lead">Horizon es el servicio que nos deja leer Testnet. Acá podés ver cuánto tenés y qué ha pasado en tu cuenta.</p>
      <div className="action-row">
        <span className="wallet-inline"><Icon name="wallet" width="17" height="17"/><code>{shortened(address)}</code><TestnetBadge/></span>
        <button className="button button-secondary" onClick={() => void refresh()} disabled={busy || funding}><Icon name="refresh" width="17" height="17"/>Actualizar</button>
      </div>
      {busy && <p className="notice" role="status">Consultando Testnet…</p>}
      {error && <p className="notice notice-error" role="alert">{error}</p>}
      {funded && <p className="notice notice-success" role="status">{funded}</p>}
      {!busy && summary === null && (
        <div className="wallet-card">
          <h3>Tu cuenta aún no existe en la red</h3>
          <p className="muted">Ya tenés una dirección, pero en Testnet se registra cuando recibe su primer depósito. Friendbot puede crearla con XLM de prueba gratis.</p>
          <button className="button button-primary" onClick={() => void fund()} disabled={funding}>{funding ? "Fondeando…" : "Fondear con Friendbot"} <Icon name="spark"/></button>
        </div>
      )}
      {!busy && summary && (
        <>
          <div className="account-figures">
            <div className="wallet-card">
              <h3>Balance</h3>
              <p className="balance-figure">{displayDecimal(summary.balance)} <span>XLM de prueba</span></p>
              <p className="muted">La cantidad de XLM de prueba que tiene tu cuenta.</p>
            </div>
            <div className="wallet-card">
              <h3>Otros activos</h3>
              <p className="muted">Fichas de prueba que tu cuenta puede guardar.</p>
              {summary.assets.length === 0 ? <p>Tu cuenta solo tiene XLM de prueba.</p> : (
                <ul className="asset-list">{summary.assets.map((asset) => <li key={asset.id} title={asset.issuer ?? undefined}><strong>{asset.name}</strong> <span>{displayDecimal(asset.balance)} unidades de prueba</span></li>)}</ul>
              )}
            </div>
          </div>
          <div className="wallet-card">
            <h3>Últimas 5 transacciones</h3>
            <p className="muted">Cada transacción agrupa acciones. Su hash es el identificador que podés buscar en el explorador.</p>
            {summary.history.length === 0 ? <p>Todavía no aparecen movimientos.</p> : (
              <ul className="transaction-list">
                {summary.history.map((item) => (
                  <li key={item.hash}>
                    <div><strong>{item.operations.join(", ") || "Tipo sin confirmar"}</strong><time dateTime={item.date}>{dateFormat.format(new Date(item.date))} · {item.successful ? "Confirmada" : "Fallida"}</time></div>
                    <a className="text-link" href={explorerLink("tx", item.hash)} rel="noreferrer" target="_blank" aria-label={`Abrir transacción ${item.hash} en el explorador de Testnet`}><code>{shortened(item.hash, 6)}</code><Icon name="external" width="15" height="15"/></a>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="action-row"><button className="button button-primary" onClick={onContinue}>Continuar al mar <Icon name="arrow"/></button></div>
        </>
      )}
    </div>
  );
}
