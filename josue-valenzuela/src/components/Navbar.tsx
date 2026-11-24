import React, { useState } from 'react';
import { WalletState } from '../types';
import { Wallet, LogOut, Copy, Check, Sparkles, ExternalLink, RefreshCw, Sun, Moon } from 'lucide-react';

interface NavbarProps {
  wallet: WalletState;
  onConnect: () => void;
  onDisconnect: () => void;
  onRefreshBalance: () => void;
  onOpenNewProject: () => void;
  activeTab: 'explore' | 'my-applications' | 'my-projects';
  setActiveTab: (tab: 'explore' | 'my-applications' | 'my-projects') => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  wallet,
  onConnect,
  onDisconnect,
  onRefreshBalance,
  onOpenNewProject,
  activeTab,
  setActiveTab,
  theme,
  onToggleTheme
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (wallet.address) {
      navigator.clipboard.writeText(wallet.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const truncateAddress = (addr: string) => {
    return `${addr.slice(0, 5)}...${addr.slice(-4)}`;
  };

  return (
    <header className="navbar-container">
      <div className="navbar-content">
        {/* Brand / Logo */}
        <div className="brand" onClick={() => setActiveTab('explore')}>
          <div className="brand-logo">
            <span className="brand-icon">✦</span>
          </div>
          <div>
            <div className="brand-title">
              Stellar<span className="brand-accent">Chamba</span>
              <span className="brand-badge">LATAM</span>
            </div>
            <div className="brand-subtitle">Pura Vida Bootcamp · Empleos & Bounties Web3</div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="nav-links">
          <button
            className={`nav-btn ${activeTab === 'explore' ? 'active' : ''}`}
            onClick={() => setActiveTab('explore')}
          >
            Explorar Proyectos
          </button>
          <button
            className={`nav-btn ${activeTab === 'my-applications' ? 'active' : ''}`}
            onClick={() => setActiveTab('my-applications')}
          >
            Mis Postulaciones
          </button>
          <button
            className={`nav-btn ${activeTab === 'my-projects' ? 'active' : ''}`}
            onClick={() => setActiveTab('my-projects')}
          >
            Mis Proyectos Publicados
          </button>
        </nav>

        {/* Actions & Wallet */}
        <div className="navbar-actions">
          {/* Theme Toggle Button */}
          <button
            className="theme-toggle-btn"
            onClick={onToggleTheme}
            title={theme === 'dark' ? 'Cambiar a Vista Clara' : 'Cambiar a Vista Oscura'}
            aria-label="Cambiar tema claro u oscuro"
          >
            {theme === 'dark' ? (
              <Sun size={17} className="theme-icon sun" />
            ) : (
              <Moon size={17} className="theme-icon moon" />
            )}
            <span className="theme-label">{theme === 'dark' ? 'Claro' : 'Oscuro'}</span>
          </button>

          <button className="btn btn-secondary btn-sm" onClick={onOpenNewProject}>
            <Sparkles size={16} className="btn-icon" />
            Publicar Proyecto
          </button>

          {/* Network indicator */}
          <div className="network-pill" title="Red de pruebas activa">
            <span className="network-dot"></span>
            Stellar Testnet
          </div>

          {/* Wallet Connection */}
          {wallet.connected && wallet.address ? (
            <div className="wallet-connected-group">
              {/* Balance */}
              <div className="wallet-balance-pill" onClick={onRefreshBalance} title="Clic para refrescar saldo">
                <span className="balance-amount">{wallet.balanceXlm || '0.00'} XLM</span>
                <RefreshCw size={12} className="refresh-icon" />
              </div>

              {/* Address */}
              <div className="wallet-address-pill">
                <span className="wallet-address" onClick={handleCopy} title="Clic para copiar dirección">
                  {truncateAddress(wallet.address)}
                </span>
                <button className="copy-btn" onClick={handleCopy} title="Copiar dirección">
                  {copied ? <Check size={14} className="text-success" /> : <Copy size={14} />}
                </button>
                <a
                  href={`https://stellar.expert/explorer/testnet/account/${wallet.address}`}
                  target="_blank"
                  rel="noreferrer"
                  className="copy-btn"
                  title="Ver en Stellar Expert"
                >
                  <ExternalLink size={14} />
                </a>
                <button className="disconnect-btn" onClick={onDisconnect} title="Desconectar wallet">
                  <LogOut size={14} />
                </button>
              </div>
            </div>
          ) : (
            <button
              className="btn btn-primary"
              onClick={onConnect}
              disabled={wallet.loading}
            >
              <Wallet size={16} className="btn-icon" />
              {wallet.loading ? 'Conectando...' : 'Conectar Wallet (Freighter)'}
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
