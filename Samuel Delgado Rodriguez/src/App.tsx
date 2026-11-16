import { useEffect, useState } from 'react';
import { loadAccount, type AccountResult } from './stellar/account';
import { connectWallet, restoreWallet, WalletError } from './stellar/wallet';

type AccountState = { status: 'idle' | 'loading' | 'error'; message?: string } | AccountResult;
const SESSION_KEY = 'stellar-viewer-connected';
const short = (value: string) => `${value.slice(0, 6)}…${value.slice(-6)}`;

export default function App() {
  const [address, setAddress] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [walletError, setWalletError] = useState<string | null>(null);
  const [account, setAccount] = useState<AccountState>({ status: 'idle' });
  const [refreshKey, setRefreshKey] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY) !== 'true') return;
    let active = true;
    restoreWallet().then((value) => {
      if (!active) return;
      if (value) setAddress(value);
      else sessionStorage.removeItem(SESSION_KEY);
    }).catch(() => sessionStorage.removeItem(SESSION_KEY));
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!address) { setAccount({ status: 'idle' }); return; }
    const controller = new AbortController();
    setAccount({ status: 'loading' });
    loadAccount(address, controller.signal).then(setAccount).catch((error: unknown) => {
      if (!controller.signal.aborted) setAccount({
        status: 'error',
        message: error instanceof Error ? error.message : 'No pudimos consultar la cuenta.',
      });
    });
    return () => controller.abort();
  }, [address, refreshKey]);

  async function connect() {
    setWalletError(null);
    setConnecting(true);
    try {
      const value = await connectWallet();
      sessionStorage.setItem(SESSION_KEY, 'true');
      setAddress(value);
    } catch (error) {
      setWalletError(error instanceof WalletError ? error.message : 'No se pudo conectar Freighter. Inténtalo de nuevo.');
    } finally { setConnecting(false); }
  }

  function disconnect() {
    sessionStorage.removeItem(SESSION_KEY);
    setAddress(null);
    setWalletError(null);
    setCopied(false);
  }

  async function copyAddress() {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2200);
    } catch {
      setWalletError('No se pudo copiar la dirección. Selecciónala y cópiala manualmente.');
    }
  }

  return <div className="page">
    <header className="header">
      <a className="brand" href="#inicio"><span className="brand-icon">✳</span> stellar<span>/</span>vista</a>
      <span className="network"><i /> STELLAR TESTNET</span>
    </header>
    <main id="inicio" className="main">
      <section className="intro">
        <div className="eyebrow">— &nbsp; UNA VISTA CLARA DE TU CUENTA</div>
        <h1>Tu Stellar,<br /><em>de un vistazo.</em></h1>
        <p>Conecta Freighter para consultar tu dirección y saldo XLM en la red de pruebas. Sin claves privadas, sin complicaciones.</p>
      </section>
      <div className="right-column">
        <section className="card" aria-labelledby="card-title">
          <div className="card-header"><span className="wallet-icon">▣</span><div><small>TU ESPACIO EN TESTNET</small><h2 id="card-title">Mi cuenta</h2></div><span className="sparkle">✳</span></div>
          {address ? <div className="card-content" aria-live="polite">
            <div className="connected"><i /> Wallet conectada <span>Testnet</span></div>
            <div className="balance-box"><small>SALDO DISPONIBLE</small>
              {account.status === 'loading' && <div className="loading">Consultando saldo…</div>}
              {account.status === 'funded' && <div className="balance"><strong>{Number(account.balance).toLocaleString('es-CR', { maximumFractionDigits: 7 })}</strong> XLM</div>}
              {account.status === 'unfunded' && <><div className="balance"><strong>—</strong> XLM</div><p>Esta cuenta aún no existe en Testnet. Actívala con fondos de prueba desde Freighter o Stellar Lab.</p></>}
              {account.status === 'error' && <p className="error" role="alert">{account.message}</p>}
            </div>
            <div className="address"><small>DIRECCIÓN PÚBLICA</small><div><code title={address}>{short(address)}</code><button onClick={copyAddress} aria-label={copied ? 'Dirección copiada' : 'Copiar dirección'}>{copied ? '✓' : '▢'}</button></div></div>
            <div className="actions"><button onClick={() => setRefreshKey((key) => key + 1)} disabled={account.status === 'loading'}>↻ &nbsp; Actualizar saldo</button><button onClick={disconnect}>Desconectar</button></div>
          </div> : <div className="card-content empty">
            <div className="orb" aria-hidden="true">✳</div><h3>Todo comienza aquí.</h3><p>Conecta tu wallet Freighter para ver los datos de tu cuenta Stellar.</p>
            <button className="connect-button" onClick={connect} disabled={connecting}><span>▣ &nbsp; {connecting ? 'Conectando…' : 'Conectar Freighter'}</span><span>→</span></button>
            <div className="helper">¿No tienes Freighter? <a href="https://www.freighter.app/" target="_blank" rel="noreferrer">Descárgalo aquí ↗</a></div>
          </div>}
          {walletError && <p className="error card-error" role="alert">{walletError}</p>}
        </section>
        <aside className="note"><span>↗</span><div><strong>Solo para explorar.</strong><p>Esta app usa Testnet y muestra datos públicos. Nunca solicita tus claves privadas ni realiza transacciones.</p></div></aside>
      </div>
    </main>
    <footer className="footer"><span>HECHO PARA PURA VIDA BOOTCAMP</span><span>POR SAMUEL DELGADO RODRIGUEZ · 2026</span></footer>
  </div>;
}
