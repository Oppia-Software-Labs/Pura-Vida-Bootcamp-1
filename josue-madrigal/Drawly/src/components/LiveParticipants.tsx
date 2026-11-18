import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  RefreshCw,
  ExternalLink,
  Copy,
  Check,
  Coins,
  AlertCircle,
  Ticket,
} from 'lucide-react';
import {
  fetchLiveParticipants,
  formatAddress,
  STELLAR_CONFIG,
  type ParticipantEntry,
} from '../services/stellar';

export interface LiveParticipantsProps {
  vaultAddress?: string;
}

export const LiveParticipants: React.FC<LiveParticipantsProps> = ({ vaultAddress }) => {
  const [entries, setEntries] = useState<ParticipantEntry[]>([]);
  const [totalPotXlm, setTotalPotXlm] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const loadParticipants = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    setError(null);

    try {
      const data = await fetchLiveParticipants(vaultAddress);
      setEntries(data.entries);
      setTotalPotXlm(data.totalPotXlm);
    } catch (err: unknown) {
      const e = err as Error;
      console.error('Error cargando participantes:', e);
      setError('No se pudo sincronizar con Horizon Testnet. Intenta de nuevo.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [vaultAddress]);

  // Carga inicial
  useEffect(() => {
    loadParticipants();
  }, [loadParticipants]);

  // Recarga automática al detectar compra de boleto en la aplicación
  useEffect(() => {
    const handleTicketBought = () => {
      // Pequeño timeout para que Horizon termine de indexar la transacción
      setTimeout(() => {
        loadParticipants(true);
      }, 1500);
    };

    window.addEventListener('stellar:ticket-bought', handleTicketBought);
    window.addEventListener('stellar:refresh-balance', handleTicketBought);

    return () => {
      window.removeEventListener('stellar:ticket-bought', handleTicketBought);
      window.removeEventListener('stellar:refresh-balance', handleTicketBought);
    };
  }, [loadParticipants]);

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedHash(text);
      setTimeout(() => setCopiedHash(null), 2000);
    } catch {
      // Ignorar
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('es-CR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        day: '2-digit',
        month: 'short',
      }).format(date);
    } catch {
      return dateString;
    }
  };

  return (
    <div className="w-full rounded-3xl bg-neutral-900/40 border border-white/10 p-6 sm:p-8 backdrop-blur-2xl shadow-2xl flex flex-col gap-6">
      {/* Header del Componente */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-5">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-400">
              Horizon Testnet Explorer • Live Ledger
            </span>
          </div>
          <h2 className="text-xl font-semibold tracking-tight text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-neutral-300" />
            <span>Lista de Participantes en Vivo</span>
          </h2>
        </div>

        {/* Métricas y Botón de Refrescar */}
        <div className="flex items-center gap-3">
          {/* Pozo Acumulado */}
          <div className="px-3.5 py-1.5 rounded-2xl bg-black/60 border border-white/5 flex items-center gap-2">
            <Coins className="w-3.5 h-3.5 text-amber-400" />
            <div className="flex flex-col">
              <span className="text-[9px] font-mono uppercase text-neutral-500 leading-tight">
                Pozo Acumulado
              </span>
              <span className="text-xs font-bold font-mono text-white leading-tight">
                {totalPotXlm} XLM
              </span>
            </div>
          </div>

          {/* Contador de Entradas */}
          <div className="px-3.5 py-1.5 rounded-2xl bg-black/60 border border-white/5 flex items-center gap-2">
            <Ticket className="w-3.5 h-3.5 text-indigo-400" />
            <div className="flex flex-col">
              <span className="text-[9px] font-mono uppercase text-neutral-500 leading-tight">
                Total Boletos
              </span>
              <span className="text-xs font-bold font-mono text-white leading-tight">
                #{entries.length}
              </span>
            </div>
          </div>

          {/* Botón Refrescar Manualmente */}
          <button
            onClick={() => loadParticipants(true)}
            disabled={isRefreshing || isLoading}
            title="Refrescar lista desde Horizon"
            className="p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 active:scale-95 border border-white/10 text-neutral-300 hover:text-white transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw
              className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-white' : ''}`}
            />
          </button>
        </div>
      </div>

      {/* Manejo de Error */}
      {error && (
        <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => loadParticipants(true)}
            className="underline hover:text-white cursor-pointer ml-2"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Estado Cargando */}
      {isLoading ? (
        <div className="py-12 flex flex-col items-center justify-center gap-3 text-neutral-500 font-mono text-xs animate-pulse">
          <RefreshCw className="w-5 h-5 animate-spin text-neutral-400" />
          <span>Consultando transacciones en Horizon Testnet...</span>
        </div>
      ) : entries.length === 0 ? (
        /* Estado Vacío */
        <div className="py-12 flex flex-col items-center text-center gap-3 text-neutral-400">
          <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-neutral-400">
            <Ticket className="w-6 h-6 stroke-[1.5]" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white">
              Aún no hay participantes en este sorteo
            </h4>
            <p className="text-xs text-neutral-500 mt-1 max-w-sm">
              Sé el primero en adquirir un boleto enviando 1 XLM con tu alias a la Bóveda del Sorteo.
            </p>
          </div>
        </div>
      ) : (
        /* Tabla / Lista de Participantes */
        <div className="flex flex-col gap-2">
          {/* Cabecera de Columnas */}
          <div className="hidden sm:grid sm:grid-cols-12 px-4 py-2 text-[10px] font-mono uppercase tracking-wider text-neutral-500 border-b border-white/5">
            <div className="col-span-2">Boleto</div>
            <div className="col-span-4">Participante (Memo)</div>
            <div className="col-span-3">Remitente</div>
            <div className="col-span-3 text-right">Transacción (Tx)</div>
          </div>

          {/* Filas de Participantes */}
          <div className="flex flex-col gap-2 max-h-96 overflow-y-auto pr-1">
            {entries.map((entry) => (
              <div
                key={entry.hash}
                className="grid grid-cols-1 sm:grid-cols-12 p-3.5 sm:px-4 sm:py-3 rounded-2xl bg-black/50 hover:bg-black/75 border border-white/5 hover:border-white/10 transition-all items-center gap-2 sm:gap-0 font-mono text-xs"
              >
                {/* Número de Boleto */}
                <div className="sm:col-span-2 flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-lg bg-white/10 text-white font-bold text-xs border border-white/10">
                    #{entry.ticketNumber}
                  </span>
                  <span className="sm:hidden text-neutral-500 text-[10px]">
                    {formatDate(entry.createdAt)}
                  </span>
                </div>

                {/* Alias del Participante */}
                <div className="sm:col-span-4 flex items-center gap-2 font-sans font-semibold text-white">
                  <span className="truncate max-w-[200px]" title={entry.alias}>
                    {entry.alias}
                  </span>
                </div>

                {/* Dirección Pública del Remitente */}
                <div className="sm:col-span-3 flex items-center gap-2 text-neutral-400">
                  <span className="text-[11px]">{formatAddress(entry.sourceAccount, 4)}</span>
                  <button
                    onClick={() => handleCopy(entry.sourceAccount)}
                    title="Copiar dirección completa"
                    className="p-1 rounded text-neutral-500 hover:text-white transition-colors cursor-pointer"
                  >
                    {copiedHash === entry.sourceAccount ? (
                      <Check className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                </div>

                {/* Hash con enlace a Stellar Expert */}
                <div className="sm:col-span-3 flex items-center justify-between sm:justify-end gap-2 text-neutral-400">
                  <span className="hidden lg:inline text-[10px] text-neutral-500">
                    {formatDate(entry.createdAt)}
                  </span>
                  <a
                    href={`${STELLAR_CONFIG.explorerTxUrl}/${entry.hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Ver transacción en Stellar Expert"
                    className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white transition-all flex items-center gap-1.5 text-[11px]"
                  >
                    <span>{formatAddress(entry.hash, 3)}</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Nota al pie de verificación */}
      <div className="pt-2 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] font-mono text-neutral-500">
        <span>Fuente: Horizon API de Stellar Testnet • Consulta directa por cuenta</span>
        <span>Actualización reactiva tras cada compra</span>
      </div>
    </div>
  );
};
export default LiveParticipants;
