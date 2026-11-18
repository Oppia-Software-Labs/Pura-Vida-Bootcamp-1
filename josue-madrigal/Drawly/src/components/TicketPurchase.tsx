import React, { useState } from 'react';
import {
  Ticket,
  ExternalLink,
  Copy,
  Check,
  Sparkles,
  AlertCircle,
  CheckCircle2,
  Lock,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import {
  RAFFLE_VAULT_ADDRESS,
  STELLAR_CONFIG,
  getUtf8ByteLength,
  buyRaffleTicket,
  formatAddress,
} from '../services/stellar';
import { openWalletModal } from '../services/walletKit';

export interface TicketPurchaseProps {
  connectedAddress: string | null;
  onAddressConnect: (address: string) => void;
  onBalanceRefreshNeeded: () => void;
}

export const TicketPurchase: React.FC<TicketPurchaseProps> = ({
  connectedAddress,
  onAddressConnect,
  onBalanceRefreshNeeded,
}) => {
  const [alias, setAlias] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [copiedVault, setCopiedVault] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successData, setSuccessData] = useState<{
    hash: string;
    ledger: number;
    alias: string;
  } | null>(null);

  const byteLength = getUtf8ByteLength(alias);
  const isOverLimit = byteLength > 28;

  const handleCopyVault = async () => {
    try {
      await navigator.clipboard.writeText(RAFFLE_VAULT_ADDRESS);
      setCopiedVault(true);
      setTimeout(() => setCopiedVault(false), 2000);
    } catch {
      // Ignorar error
    }
  };

  const handleBuyTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!connectedAddress) {
      try {
        const address = await openWalletModal();
        if (address) {
          onAddressConnect(address);
        }
      } catch (err: unknown) {
        const error = err as Error;
        if (!error.message?.includes('closed') && !error.message?.includes('cancelled')) {
          setErrorMessage(error.message || 'Error al conectar la wallet.');
        }
      }
      return;
    }

    if (!alias.trim()) {
      setErrorMessage('Por favor ingresa un nombre o alias para el boleto.');
      return;
    }

    if (isOverLimit) {
      setErrorMessage(`El alias no puede superar los 28 bytes (actual: ${byteLength} bytes).`);
      return;
    }

    setIsSubmitting(true);
    setStatusMessage('Iniciando transacción...');

    try {
      const result = await buyRaffleTicket({
        userAddress: connectedAddress,
        alias: alias.trim(),
        onStatusUpdate: (msg) => setStatusMessage(msg),
      });

      setSuccessData({
        hash: result.hash,
        ledger: result.ledger,
        alias: alias.trim(),
      });

      // Actualizar el balance del usuario y notificar compra para recarga automática
      onBalanceRefreshNeeded();
      window.dispatchEvent(new Event('stellar:ticket-bought'));
      setAlias('');
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMessage(error.message || 'Error al procesar la compra del boleto.');
    } finally {
      setIsSubmitting(false);
      setStatusMessage('');
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto rounded-3xl bg-neutral-900/40 border border-white/10 p-6 sm:p-8 backdrop-blur-2xl shadow-2xl flex flex-col gap-6">
      {/* Header del Módulo */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/5 text-neutral-400 text-[11px] font-mono mb-1.5 border border-white/5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Drawly • Módulo Oficial</span>
          </div>
          <h2 className="text-xl font-semibold tracking-tight text-white">
            Comprar Boleto de Rifa
          </h2>
        </div>
        <div className="text-left sm:text-right">
          <span className="text-[10px] uppercase font-mono tracking-wider text-neutral-500">
            Costo por boleto
          </span>
          <div className="text-xl font-bold font-mono text-white">1.00 XLM</div>
        </div>
      </div>

      {/* Información de la Bóveda del Sorteo (Preconfigurada en Testnet) */}
      <div className="p-4 rounded-2xl bg-black/60 border border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-neutral-300 shrink-0">
            <Lock className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-white">
                Bóveda del Sorteo
              </span>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.2 rounded-full">
                Testnet
              </span>
            </div>
            <span className="font-mono text-xs text-neutral-400 mt-0.5">
              {formatAddress(RAFFLE_VAULT_ADDRESS, 8)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 self-end sm:self-auto">
          <button
            onClick={handleCopyVault}
            type="button"
            title="Copiar dirección de la Bóveda"
            className="px-2.5 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-white/5 transition-colors text-xs font-mono flex items-center gap-1.5 cursor-pointer"
          >
            {copiedVault ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copiada</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copiar</span>
              </>
            )}
          </button>

          <a
            href={`${STELLAR_CONFIG.explorerAccountUrl}/${RAFFLE_VAULT_ADDRESS}`}
            target="_blank"
            rel="noopener noreferrer"
            title="Ver Bóveda en Stellar Expert"
            className="px-2.5 py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-white/5 transition-colors text-xs font-mono flex items-center gap-1.5"
          >
            <span>Stellar Expert</span>
            <ExternalLink className="w-3 h-3 text-neutral-500" />
          </a>
        </div>
      </div>

      {/* Pantalla de Éxito cuando se completa la transacción */}
      {successData ? (
        <div className="p-6 rounded-2xl bg-neutral-950/80 border border-emerald-500/20 flex flex-col items-center text-center gap-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white">
              ¡Boleto Comprado con Éxito!
            </h3>
            <p className="text-xs text-neutral-400 mt-1">
              Tu participación quedó registrada inmutablemente en Stellar Testnet.
            </p>
          </div>

          <div className="w-full p-4 rounded-xl bg-black/60 border border-white/5 flex flex-col gap-2.5 text-left text-xs font-mono">
            <div className="flex justify-between items-center">
              <span className="text-neutral-500">Participante (Memo.text)</span>
              <span className="text-white font-semibold">{successData.alias}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-neutral-500">Monto transferido</span>
              <span className="text-emerald-400 font-semibold">1.00 XLM</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-neutral-500">Ledger confirmado</span>
              <span className="text-neutral-300">#{successData.ledger}</span>
            </div>
            <div className="flex flex-col gap-1 pt-2 border-t border-white/5">
              <span className="text-neutral-500">Hash de la transacción</span>
              <a
                href={`${STELLAR_CONFIG.explorerTxUrl}/${successData.hash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white hover:text-neutral-300 underline underline-offset-4 flex items-center gap-1 break-all"
              >
                <span>{successData.hash}</span>
                <ExternalLink className="w-3 h-3 shrink-0" />
              </a>
            </div>
          </div>

          <button
            onClick={() => setSuccessData(null)}
            className="w-full py-2.5 rounded-xl bg-white text-black hover:bg-neutral-200 text-xs font-semibold transition-all cursor-pointer shadow-sm"
          >
            Comprar otro boleto
          </button>
        </div>
      ) : (
        /* Formulario de Compra */
        <form onSubmit={handleBuyTicket} className="flex flex-col gap-5">
          {/* Campo de Nombre / Alias */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs">
              <label
                htmlFor="raffle-alias"
                className="font-medium text-neutral-300 flex items-center gap-1.5"
              >
                <span>Nombre o Alias del participante</span>
              </label>
              <span
                className={`font-mono text-[11px] ${
                  isOverLimit
                    ? 'text-rose-400 font-semibold'
                    : byteLength >= 24
                    ? 'text-amber-400'
                    : 'text-neutral-500'
                }`}
              >
                {byteLength} / 28 bytes
              </span>
            </div>

            <div className="relative">
              <input
                id="raffle-alias"
                type="text"
                value={alias}
                onChange={(e) => setAlias(e.target.value)}
                placeholder="Ej: Josue_Madrigal"
                disabled={isSubmitting}
                className="w-full px-4 py-3 rounded-xl bg-black/60 border border-white/10 hover:border-white/20 focus:border-white/40 focus:outline-none text-white text-sm font-sans placeholder:text-neutral-600 transition-colors"
              />
            </div>

            <p className="text-[11px] text-neutral-500 leading-normal">
              Este nombre se guardará permanentemente en el campo{' '}
              <code className="text-neutral-300 font-mono bg-white/5 px-1 py-0.5 rounded text-[10px]">
                Memo.text
              </code>{' '}
              de la transacción en la blockchain de Stellar.
            </p>
          </div>

          {/* Desglose de la Transacción */}
          <div className="p-3.5 rounded-xl bg-black/40 border border-white/5 flex flex-col gap-2 text-xs">
            <div className="flex justify-between items-center text-neutral-400">
              <span>Boleto Drawly (1x)</span>
              <span className="font-mono text-neutral-200">1.0000000 XLM</span>
            </div>
            <div className="flex justify-between items-center text-neutral-400">
              <span>Comisión de red estimada</span>
              <span className="font-mono text-neutral-200">0.0000100 XLM</span>
            </div>
            <div className="flex justify-between items-center text-neutral-400 pt-1.5 border-t border-white/5">
              <span className="font-medium text-neutral-300">Total</span>
              <span className="font-mono font-bold text-white">~1.00 XLM</span>
            </div>
          </div>

          {/* Alertas de Error */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{errorMessage}</span>
            </div>
          )}

          {/* Estado de Progreso en Vivo */}
          {isSubmitting && (
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-neutral-300 text-xs flex items-center gap-2.5 animate-pulse">
              <Sparkles className="w-4 h-4 animate-spin text-white" />
              <span>{statusMessage}</span>
            </div>
          )}

          {/* Botón de Envío */}
          <button
            type="submit"
            disabled={isSubmitting || isOverLimit}
            className="w-full py-3 px-4 rounded-xl bg-white text-black hover:bg-neutral-200 active:scale-98 text-xs font-semibold transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <span>Procesando en Stellar...</span>
            ) : !connectedAddress ? (
              <>
                <span>Conectar Wallet para Comprar</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            ) : (
              <>
                <Ticket className="w-3.5 h-3.5" />
                <span>Comprar 1 Boleto (1 XLM)</span>
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
};
export default TicketPurchase;
