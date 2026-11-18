import { useCallback, useEffect, useState } from "react";
import {
  addUsdcTrustline,
  connectFreighter,
  disconnectWallet,
  getBalances,
  getRecentPayments,
  isWalletOnTestnet,
  sendXlm,
} from "./stellar.js";
import { friendlyError } from "./errors.js";

const short = (a) => `${a.slice(0, 6)}…${a.slice(-6)}`;

function StatusLine({ status }) {
  return (
    <p className={status.ok === false ? "error" : status.ok ? "ok" : "muted"}>
      {status.msg}{" "}
      {status.hash && (
        <a href={`https://stellar.expert/explorer/testnet/tx/${status.hash}`} target="_blank" rel="noreferrer">
          Ver transacción
        </a>
      )}
    </p>
  );
}

export default function App() {
  const [address, setAddress] = useState(null);
  const [balances, setBalances] = useState(null);
  const [error, setError] = useState(null);
  const [connecting, setConnecting] = useState(false);

  const [destination, setDestination] = useState("");
  const [amount, setAmount] = useState("");
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState(null);
  const [trusting, setTrusting] = useState(false);
  const [trustStatus, setTrustStatus] = useState(null);
  const [onTestnet, setOnTestnet] = useState(true);
  const [payments, setPayments] = useState(null);
  const [historyError, setHistoryError] = useState(null);

  const checkNetwork = useCallback(async () => {
    try {
      setOnTestnet(await isWalletOnTestnet());
    } catch {
      // Si no se puede leer la red no bloqueamos la app.
    }
  }, []);

  const refresh = useCallback(async (addr) => {
    setError(null);
    checkNetwork();
    setHistoryError(null);
    getRecentPayments(addr)
      .then(setPayments)
      .catch((e) => setHistoryError(`No se pudo leer el historial: ${friendlyError(e)}`));
    try {
      setBalances(await getBalances(addr));
    } catch (e) {
      setError(`No se pudo leer el saldo: ${friendlyError(e)}`);
    }
  }, [checkNetwork]);

  useEffect(() => {
    if (address) refresh(address);
  }, [address, refresh]);

  // Al volver a la pestaña (p. ej. tras cambiar la red en Freighter) se revisa de nuevo.
  useEffect(() => {
    if (!address) return;
    window.addEventListener("focus", checkNetwork);
    return () => window.removeEventListener("focus", checkNetwork);
  }, [address, checkNetwork]);

  const onConnect = async () => {
    setError(null);
    setConnecting(true);
    try {
      setAddress(await connectFreighter());
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setConnecting(false);
    }
  };

  const onDisconnect = async () => {
    await disconnectWallet();
    setAddress(null);
    setBalances(null);
    setPayments(null);
    setStatus(null);
    setTrustStatus(null);
  };

  const onAddTrustline = async () => {
    setTrustStatus({ ok: null, msg: "Firma la trustline en Freighter…" });
    setTrusting(true);
    try {
      const hash = await addUsdcTrustline(address);
      setTrustStatus({ ok: true, msg: "Trustline de USDC agregada.", hash });
      refresh(address);
    } catch (e) {
      setTrustStatus({ ok: false, msg: friendlyError(e) });
    } finally {
      setTrusting(false);
    }
  };

  const onSend = async (e) => {
    e.preventDefault();
    setStatus(null);
    const n = Number(amount);
    if (!(n > 0)) {
      setStatus({ ok: false, msg: "Monto inválido: escribe una cantidad mayor que 0." });
      return;
    }
    setSending(true);
    try {
      setStatus({ ok: null, msg: "Firma la transacción en Freighter…" });
      // Stellar admite hasta 7 decimales
      const amt = n.toFixed(7).replace(/\.?0+$/, "");
      const hash = await sendXlm(address, destination.trim(), amt);
      setStatus({ ok: true, msg: "¡Enviado!", hash });
      setDestination("");
      setAmount("");
      refresh(address);
    } catch (e) {
      setStatus({ ok: false, msg: friendlyError(e) });
    } finally {
      setSending(false);
    }
  };

  return (
    <main>
      <h1>Stellar Testnet Wallet</h1>
      <p className="muted">Conecta Freighter, revisa tu saldo y envía XLM en testnet.</p>

      {!address ? (
        <button onClick={onConnect} disabled={connecting}>
          {connecting ? "Conectando…" : "Conectar Freighter"}
        </button>
      ) : (
        <>
          {!onTestnet && (
            <section className="card network-warning" role="alert">
              <strong>Tu wallet no está en Testnet.</strong>
              <p>Esta app solo funciona en la red de prueba de Stellar. Para cambiarla:</p>
              <ol>
                <li>Abre la extensión Freighter.</li>
                <li>Pulsa el selector de red (arriba, normalmente dice «Mainnet» o «Public»).</li>
                <li>Elige <strong>Testnet</strong>.</li>
                <li>Vuelve a esta pestaña o pulsa Actualizar.</li>
              </ol>
            </section>
          )}

          <section className="card">
            <span className="label">Dirección</span>
            <div className="row">
              <code title={address}>{short(address)}</code>
              <button className="ghost" onClick={() => navigator.clipboard?.writeText(address)}>
                Copiar
              </button>
            </div>

            {balances && !balances.funded && (
              <p className="warn">
                Cuenta sin fondos en testnet.{" "}
                <a href={`https://friendbot.stellar.org/?addr=${address}`} target="_blank" rel="noreferrer">
                  Fondear con Friendbot
                </a>{" "}
                y luego pulsa Actualizar.
              </p>
            )}

            <div className="balances">
              <div>
                <span className="label">XLM</span>
                <strong>{balances ? balances.xlm : "…"}</strong>
              </div>
              <div>
                <span className="label">USDC</span>
                <strong>{balances ? balances.usdc ?? "sin trustline" : "…"}</strong>
              </div>
            </div>

            {balances?.funded && balances.usdc === null && (
              <div className="row">
                <button onClick={onAddTrustline} disabled={trusting || !onTestnet}>
                  {trusting ? "Agregando…" : "Agregar trustline USDC"}
                </button>
              </div>
            )}
            {trustStatus && <StatusLine status={trustStatus} />}

            <div className="row">
              <button className="ghost" onClick={() => refresh(address)}>Actualizar</button>
              <button className="ghost" onClick={onDisconnect}>Desconectar</button>
            </div>
          </section>

          <section className="card">
            <h2>Enviar XLM</h2>
            <form onSubmit={onSend}>
              <label>
                Destino
                <input
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  placeholder="G…"
                  required
                />
              </label>
              <label>
                Monto (XLM)
                <input
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  type="number"
                  min="0.0000001"
                  step="0.0000001"
                  required
                />
              </label>
              <button type="submit" disabled={sending || !onTestnet}>
                {sending ? "Enviando…" : "Enviar"}
              </button>
            </form>
            {status && <StatusLine status={status} />}
          </section>

          <section className="card">
            <h2>Últimos pagos</h2>
            {historyError ? (
              <p className="error">{historyError}</p>
            ) : !payments ? (
              <p className="muted">Cargando…</p>
            ) : payments.length === 0 ? (
              <p className="muted">Todavía no hay pagos en esta cuenta.</p>
            ) : (
              <ul className="history">
                {payments.map((p) => (
                  <li key={p.id}>
                    <div className="row between">
                      <span>
                        {p.type} · <span className="muted">{p.outgoing ? "enviado" : "recibido"}</span>
                      </span>
                      <strong>{p.amount ? `${p.amount} ${p.asset}` : "—"}</strong>
                    </div>
                    <div className="row between muted small">
                      <span>{p.date.toLocaleString()}</span>
                      <span>
                        Destino: {p.destination ? <code title={p.destination}>{short(p.destination)}</code> : "—"}
                      </span>
                    </div>
                    <a
                      className="small"
                      href={`https://stellar.expert/explorer/testnet/tx/${p.txHash}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Ver en Stellar Expert
                    </a>
                  </li>
                ))}
              </ul>
            )}
            <a
              className="small"
              href={`https://stellar.expert/explorer/testnet/account/${address}`}
              target="_blank"
              rel="noreferrer"
            >
              Ver cuenta completa en Stellar Expert
            </a>
          </section>
        </>
      )}

      {error && <p className="error">{error}</p>}
    </main>
  );
}
