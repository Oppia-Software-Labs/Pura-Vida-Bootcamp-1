import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Wallet,
  LogOut,
  RefreshCw,
  ExternalLink,
  Copy,
  Check,
  ChevronDown,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import {
  openWalletModal,
  disconnectWallet,
  getActiveAddress,
} from '../services/walletKit';
import {
  fetchXlmBalance,
  requestFriendbotFunding,
  formatAddress,
  STELLAR_CONFIG,
} from '../services/stellar';

export interface WalletConnectProps {
  onAddressChange?: (address: string | null) => void;
}

export const WalletConnect: React.FC<WalletConnectProps> = ({ onAddressChange }) => {
  const [address, setAddress] = useState<string | null>(null);
  const [balance, setBalance] = useState<string>('0');
  const [accountExists, setAccountExists] = useState<boolean>(true);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [isLoadingBalance, setIsLoadingBalance] = useState<boolean>(false);
  const [isFunding, setIsFunding] = useState<boolean>(false);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Cerrar dropdown al hacer clic afuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Consulta el balance en Horizon Testnet
  const refreshBalance = useCallback(async (accountAddress: string) => {
    setIsLoadingBalance(true);
    try {
      const info = await fetchXlmBalance(accountAddress);
      setBalance(info.balance);
      setAccountExists(info.exists);
      if (info.error) {
        setStatusMessage({ type: 'error', text: info.error });
      }
    } catch {
      setStatusMessage({ type: 'error', text: 'Error al consultar Horizon' });
    } finally {
      setIsLoadingBalance(false);
    }
  }, []);

  // Verificar si hay una wallet activa al cargar
  useEffect(() => {
    const checkActive = async () => {
      const active = await getActiveAddress();
      if (active) {
        setAddress(active);
        onAddressChange?.(active);
        refreshBalance(active);
      }
    };
    checkActive();
  }, [onAddressChange, refreshBalance]);

  // Escuchar eventos globales de actualización de balance (por ejemplo tras comprar un boleto)
  useEffect(() => {
    const handleGlobalRefresh = () => {
      if (address) {
        refreshBalance(address);
      }
    };
    window.addEventListener('stellar:refresh-balance', handleGlobalRefresh);
    return () => window.removeEventListener('stellar:refresh-balance', handleGlobalRefresh);
  }, [address, refreshBalance]);

  // Conectar wallet
  const handleConnect = async () => {
    setIsConnecting(true);
    setStatusMessage(null);
    try {
      const selectedAddress = await openWalletModal();
      if (selectedAddress) {
        setAddress(selectedAddress);
        onAddressChange?.(selectedAddress);
        await refreshBalance(selectedAddress);
      }
    } catch (error: unknown) {
      const err = error as Error;
      if (!err.message?.includes('closed') && !err.message?.includes('cancelled')) {
        setStatusMessage({
          type: 'error',
          text: err.message || 'Error al conectar wallet',
        });
      }
    } finally {
      setIsConnecting(false);
    }
  };

  // Desconectar wallet
  const handleDisconnect = async () => {
    try {
      await disconnectWallet();
      setAddress(null);
      setBalance('0');
      setAccountExists(true);
      setIsOpen(false);
      onAddressChange?.(null);
    } catch (error: unknown) {
      const err = error as Error;
      setStatusMessage({
        type: 'error',
        text: err.message || 'Error al desconectar',
      });
    }
  };

  // Copiar dirección
  const handleCopy = async () => {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignorar error de clipboard
    }
  };

  // Fondear con Friendbot
  const handleFriendbotFunding = async () => {
    if (!address) return;
    setIsFunding(true);
    setStatusMessage({ type: 'info', text: 'Fondeando cuenta en Testnet...' });

    try {
      const result = await requestFriendbotFunding(address);
      if (result.success) {
        setStatusMessage({ type: 'success', text: result.message });
        setTimeout(() => refreshBalance(address), 1500);
      } else {
        setStatusMessage({ type: 'error', text: result.message });
      }
    } catch (error: unknown) {
      const err = error as Error;
      setStatusMessage({
        type: 'error',
        text: `Error Friendbot: ${err.message}`,
      });
    } finally {
      setIsFunding(false);
    }
  };

  // ESTADO DESCONECTADO (Apple minimal button)
  if (!address) {
    return (
      <div className="relative">
        <button
          onClick={handleConnect}
          disabled={isConnecting}
          className="group inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-white text-black hover:bg-neutral-200 active:scale-95 text-xs font-semibold tracking-tight transition-all duration-150 shadow-sm cursor-pointer disabled:opacity-50"
        >
          <Wallet className={`w-3.5 h-3.5 ${isConnecting ? 'animate-spin' : ''}`} />
          <span>{isConnecting ? 'Conectando...' : 'Conectar Wallet'}</span>
        </button>
      </div>
    );
  }

  // ESTADO CONECTADO (Pill compacto en Navbar + Popover desplegable)
  const needsFunding = !accountExists || balance === '0' || balance === '0.00';

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Pill disparador en el Navbar */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-900/80 hover:bg-neutral-800/90 border border-white/10 hover:border-white/20 transition-all duration-150 text-xs text-neutral-200 cursor-pointer backdrop-blur-md shadow-inner"
      >
        <span className="flex items-center gap-1.5 font-mono font-medium text-neutral-300">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
          <span>{balance} XLM</span>
        </span>
        <span className="text-neutral-500">|</span>
        <span className="font-mono text-neutral-400 font-normal">
          {formatAddress(address, 4)}
        </span>
        <ChevronDown
          className={`w-3 h-3 text-neutral-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Popover flotante estilo iOS/Apple Web3 */}
      {isOpen && (
        <div className="absolute right-0 mt-2.5 w-80 rounded-2xl bg-neutral-950/95 border border-white/10 p-4 shadow-2xl backdrop-blur-2xl z-50 flex flex-col gap-3.5 animate-in fade-in zoom-in-95 duration-150">
          {/* Header del popover */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span className="text-[11px] font-medium tracking-wide uppercase text-neutral-400">
                Stellar {STELLAR_CONFIG.network}
              </span>
            </div>
            {!accountExists && (
              <span className="text-[10px] font-medium bg-amber-500/10 text-amber-300 border border-amber-500/20 px-2 py-0.5 rounded-full">
                No inicializada
              </span>
            )}
          </div>

          {/* Caja con dirección y acciones */}
          <div className="p-3 rounded-xl bg-neutral-900/60 border border-white/5 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[10px] text-neutral-500 font-mono tracking-tight uppercase">
                Dirección
              </span>
              <span className="font-mono text-xs font-semibold text-white">
                {formatAddress(address, 6)}
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleCopy}
                title="Copiar dirección"
                className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                {copied ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
              <a
                href={`${STELLAR_CONFIG.explorerUrl}/${address}`}
                target="_blank"
                rel="noopener noreferrer"
                title="Ver en Explorer"
                className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Balance */}
          <div className="flex items-center justify-between px-1">
            <div className="flex flex-col">
              <span className="text-[11px] text-neutral-400">Balance en Testnet</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold font-mono tracking-tight text-white">
                  {balance}
                </span>
                <span className="text-xs font-semibold text-neutral-400 font-mono">
                  XLM
                </span>
              </div>
            </div>

            <button
              onClick={() => refreshBalance(address)}
              disabled={isLoadingBalance}
              title="Actualizar balance"
              className="p-2 rounded-xl text-neutral-400 hover:text-white hover:bg-white/5 transition-colors border border-white/5 disabled:opacity-50"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${
                  isLoadingBalance ? 'animate-spin text-white' : ''
                }`}
              />
            </button>
          </div>

          {/* Botón Fondear 10,000 XLM */}
          <div>
            <button
              onClick={handleFriendbotFunding}
              disabled={isFunding}
              className={`w-full py-2.5 px-3 rounded-xl font-medium text-xs flex items-center justify-center gap-2 transition-all duration-150 cursor-pointer ${
                needsFunding
                  ? 'bg-white text-black hover:bg-neutral-200 active:scale-98 font-semibold shadow-sm'
                  : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-white/5'
              }`}
            >
              <Sparkles className={`w-3.5 h-3.5 ${isFunding ? 'animate-spin' : ''}`} />
              <span>
                {isFunding ? 'Fondeando...' : 'Fondear 10,000 XLM (Friendbot)'}
              </span>
            </button>
          </div>

          {/* Notificación de feedback */}
          {statusMessage && (
            <div
              className={`text-[11px] p-2 rounded-lg border flex items-center gap-1.5 ${
                statusMessage.type === 'error'
                  ? 'bg-rose-500/10 border-rose-500/20 text-rose-300'
                  : statusMessage.type === 'success'
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                  : 'bg-neutral-800 border-white/10 text-neutral-300'
              }`}
            >
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              <span className="leading-tight">{statusMessage.text}</span>
            </div>
          )}

          {/* Botón Desconectar */}
          <div className="pt-2 border-t border-white/5">
            <button
              onClick={handleDisconnect}
              className="w-full py-1.5 px-2 rounded-lg text-xs font-medium text-neutral-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Desconectar Wallet</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
export default WalletConnect;
