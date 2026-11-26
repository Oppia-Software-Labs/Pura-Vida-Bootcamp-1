import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import {
  claimAguinaldo,
  createAguinaldo,
  listAguinaldos,
  loadAguinaldo,
  refreshRow,
  roleLabel,
  statusLabel,
  unlockSeconds,
  type AguinaldoRow,
  type UnlockPreset,
} from "./aguinaldo";
import { formatCountdown } from "./predicates";
import {
  expertAccountUrl,
  expertBalanceUrl,
  expertTxUrl,
  formatXlm,
  fundWithFriendbot,
  isPublicKey,
  loadSnapshot,
  shortAddress,
  stellarErrorMessage,
  type AccountSnapshot,
} from "./stellar";
import { useWallet } from "./useWallet";
import "./App.css";

const DEFAULT_AMOUNT = "2";
const CLAIM_WINDOW_SEC = 60;

function shareUrl(balanceId: string): string {
  const url = new URL(window.location.href);
  url.searchParams.set("id", balanceId);
  return url.toString();
}

function queryBalanceId(): string | null {
  const id = new URLSearchParams(window.location.search).get("id");
  return id && id.trim().length > 0 ? id.trim() : null;
}

export default function App() {
  const { address, busy, error, connect, disconnect, setError } = useWallet();
  const [nowSec, setNowSec] = useState(() => Math.floor(Date.now() / 1000));
  const [snapshot, setSnapshot] = useState<AccountSnapshot | null>(null);
  const [rows, setRows] = useState<AguinaldoRow[]>([]);
  const [loadingAccount, setLoadingAccount] = useState(false);
  const [loadingList, setLoadingList] = useState(false);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [lastTx, setLastTx] = useState<string | null>(null);
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState(DEFAULT_AMOUNT);
  const [motivo, setMotivo] = useState("Aguinaldo de prueba");
  const [preset, setPreset] = useState<UnlockPreset>("demo");
  const [customMinutes, setCustomMinutes] = useState("2");
  const [linkId, setLinkId] = useState<string | null>(queryBalanceId);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNowSec(Math.floor(Date.now() / 1000));
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  const refreshAccount = useCallback(async (account: string) => {
    setLoadingAccount(true);
    try {
      setSnapshot(await loadSnapshot(account));
    } catch (err) {
      setError(stellarErrorMessage(err));
    } finally {
      setLoadingAccount(false);
    }
  }, [setError]);

  const refreshList = useCallback(async (account: string) => {
    setLoadingList(true);
    try {
      const listed = await listAguinaldos(account);
      const deepLink = queryBalanceId();
      if (deepLink && !listed.some((row) => row.id === deepLink)) {
        try {
          listed.unshift(await loadAguinaldo(deepLink, account));
        } catch {
          /* el id del link puede estar ya reclamado */
        }
      }
      setRows(listed);
    } catch (err) {
      setError(stellarErrorMessage(err));
    } finally {
      setLoadingList(false);
    }
  }, [setError]);

  useEffect(() => {
    if (!address) return;
    void refreshAccount(address);
    void refreshList(address);
  }, [address, refreshAccount, refreshList]);

  const liveRows = useMemo(
    () => (address ? rows.map((row) => refreshRow(row, address, nowSec)) : []),
    [rows, address, nowSec],
  );

  async function onFund() {
    if (!address) return;
    setBusyAction("fund");
    setNotice(null);
    try {
      await fundWithFriendbot(address);
      await refreshAccount(address);
      setNotice("Friendbot fondeó la cuenta en Testnet. Ya podés crear un aguinaldo.");
    } catch (err) {
      setError(stellarErrorMessage(err));
    } finally {
      setBusyAction(null);
    }
  }

  async function onCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!address) return;
    setBusyAction("create");
    setNotice(null);
    setCopied(false);
    try {
      const customSec = Number(customMinutes) * 60;
      const created = await createAguinaldo({
        from: address,
        to: recipient.trim() || address,
        amountXlm: amount,
        motivo,
        unlockSec: unlockSeconds(preset, customSec),
        windowSec: CLAIM_WINDOW_SEC,
      });
      setLastTx(created.hash);
      setLinkId(created.balanceId);
      window.history.replaceState({}, "", shareUrl(created.balanceId));
      setNotice(
        "Aguinaldo creado. El destinatario espera la fecha; si no lo pide, vos lo recuperás.",
      );
      await refreshAccount(address);
      await refreshList(address);
    } catch (err) {
      setError(stellarErrorMessage(err));
    } finally {
      setBusyAction(null);
    }
  }

  async function onClaim(balanceId: string) {
    if (!address) return;
    setBusyAction(balanceId);
    setNotice(null);
    try {
      const hash = await claimAguinaldo(address, balanceId);
      setLastTx(hash);
      setNotice("Listo: el XLM pasó a tu cuenta de Testnet.");
      await refreshAccount(address);
      await refreshList(address);
    } catch (err) {
      setError(stellarErrorMessage(err));
    } finally {
      setBusyAction(null);
    }
  }

  async function onCopy(balanceId: string) {
    const url = shareUrl(balanceId);
    await navigator.clipboard.writeText(url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  const connected = Boolean(address);
  const needsFunds = snapshot !== null && (!snapshot.exists || Number(snapshot.xlm) < 3);

  return (
    <div className="page">
      <header className="top">
        <div>
          <p className="eyebrow">Pura Vida Bootcamp · Testnet</p>
          <h1>Aguinaldo</h1>
          <p className="lede">
            Un pago en XLM que nadie puede tocar hasta una fecha. Después de esa
            fecha, el destinatario lo reclama. Si no lo pide, te vuelve.
          </p>
        </div>
        <section className="wallet" aria-label="Conectar wallet">
          <p className="wallet-kicker">Wallet Stellar</p>
          {address ? (
            <>
              <p className="addr" title={address}>
                {shortAddress(address)}
              </p>
              <p className="balance">
                {loadingAccount
                  ? "Leyendo saldo…"
                  : snapshot?.exists
                    ? `${formatXlm(snapshot.xlm)} XLM`
                    : "Cuenta todavía no existe en Testnet"}
              </p>
              <div className="wallet-actions">
                {needsFunds ? (
                  <button
                    type="button"
                    onClick={() => void onFund()}
                    disabled={busyAction === "fund"}
                  >
                    {busyAction === "fund" ? "Pidiendo fondos…" : "Pedir XLM de prueba"}
                  </button>
                ) : null}
                <button
                  type="button"
                  className="ghost"
                  onClick={() => void disconnect()}
                  disabled={busy}
                >
                  Desconectar
                </button>
              </div>
              <a
                className="subtle-link"
                href={expertAccountUrl(address)}
                target="_blank"
                rel="noreferrer"
              >
                Ver cuenta en Stellar Expert
              </a>
            </>
          ) : (
            <>
              <p className="wallet-help">
                Conectá Freighter o Varial en <strong>Testnet</strong>. No pedimos
                claves privadas.
              </p>
              <button
                type="button"
                onClick={() => void connect()}
                disabled={busy}
              >
                {busy ? "Abriendo wallets…" : "Conectar wallet"}
              </button>
            </>
          )}
        </section>
      </header>

      {error ? <p className="banner error">{error}</p> : null}
      {notice ? <p className="banner ok">{notice}</p> : null}
      {lastTx ? (
        <p className="banner">
          Transacción:{" "}
          <a href={expertTxUrl(lastTx)} target="_blank" rel="noreferrer">
            {lastTx.slice(0, 10)}…
          </a>
        </p>
      ) : null}

      <main className="grid">
        <form className="card" onSubmit={(event) => void onCreate(event)}>
          <h2>Crear aguinaldo</h2>
          <p className="hint">
            Stellar lo guarda como un <em>claimable balance</em>: dos claimants,
            el destinatario y vos. Guía oficial vía Stellar Raven.
          </p>
          <label>
            Destinatario (G…)
            <input
              value={recipient}
              onChange={(event) => setRecipient(event.target.value)}
              placeholder="Tu misma cuenta sirve para probar"
              autoComplete="off"
              spellCheck={false}
            />
          </label>
          {recipient && !isPublicKey(recipient) ? (
            <p className="field-error">Esa clave pública no es válida.</p>
          ) : null}
          <label>
            Monto en XLM
            <input
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              inputMode="decimal"
            />
          </label>
          <label>
            Motivo (memo, 28 bytes)
            <input
              value={motivo}
              onChange={(event) => setMotivo(event.target.value)}
              maxLength={40}
            />
          </label>
          <fieldset>
            <legend>Se abre en</legend>
            <label className="radio">
              <input
                type="radio"
                name="preset"
                checked={preset === "demo"}
                onChange={() => setPreset("demo")}
              />
              60 segundos (para que el revisor lo pruebe)
            </label>
            <label className="radio">
              <input
                type="radio"
                name="preset"
                checked={preset === "five"}
                onChange={() => setPreset("five")}
              />
              5 minutos
            </label>
            <label className="radio">
              <input
                type="radio"
                name="preset"
                checked={preset === "custom"}
                onChange={() => setPreset("custom")}
              />
              Personalizado
            </label>
            {preset === "custom" ? (
              <label>
                Minutos hasta que se abre
                <input
                  value={customMinutes}
                  onChange={(event) => setCustomMinutes(event.target.value)}
                  inputMode="numeric"
                />
              </label>
            ) : null}
          </fieldset>
          <p className="hint">
            Después de abrirse hay un minuto para reclamar. Si nadie lo
            pide, el que envió lo recupera.
          </p>
          <button type="submit" disabled={!connected || busyAction === "create"}>
            {busyAction === "create"
              ? "Firmá en la wallet…"
              : connected
                ? "Crear en Testnet"
                : "Conectá la wallet primero"}
          </button>
        </form>

        <section className="card">
          <div className="card-head">
            <h2>Pendientes</h2>
            {address ? (
              <button
                type="button"
                className="ghost small"
                onClick={() => void refreshList(address)}
                disabled={loadingList}
              >
                {loadingList ? "Actualizando…" : "Actualizar"}
              </button>
            ) : null}
          </div>
          {!connected ? (
            <p className="hint">Cuando conectes, acá aparecen los que podés reclamar o recuperar.</p>
          ) : liveRows.length === 0 ? (
            <p className="hint">No hay aguinaldos pendientes para esta cuenta.</p>
          ) : (
            <ul className="list">
              {liveRows.map((row) => (
                <li key={row.id} className={row.id === linkId ? "highlight" : ""}>
                  <div>
                    <strong>{formatXlm(row.amount)} XLM</strong>
                    <span>{address ? roleLabel(row, address) : ""}</span>
                  </div>
                  <p>
                    {statusLabel(row, nowSec)}
                    {row.nextAt && row.nextAt > nowSec
                      ? ` · ${formatCountdown(row.nextAt, nowSec)}`
                      : null}
                  </p>
                  <div className="row-actions">
                    <button
                      type="button"
                      disabled={!row.canAct || busyAction === row.id}
                      onClick={() => void onClaim(row.id)}
                    >
                      {busyAction === row.id
                        ? "Reclamando…"
                        : row.canAct
                          ? "Reclamar"
                          : "Aún no"}
                    </button>
                    <button
                      type="button"
                      className="ghost"
                      onClick={() => void onCopy(row.id)}
                    >
                      {copied && row.id === linkId ? "Link copiado" : "Copiar link"}
                    </button>
                    <a
                      href={expertBalanceUrl(row.id)}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Ledger
                    </a>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>

      <footer>
        <p>
          Solo Testnet. Operaciones clásicas{" "}
          <code>createClaimableBalance</code> / <code>claimClaimableBalance</code>
          . Hecho con Stellar Raven.
        </p>
      </footer>
    </div>
  )
}
